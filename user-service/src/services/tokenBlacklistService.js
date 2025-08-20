// ============================================================================
// 📁 src/services/tokenBlacklistService.js - Service de blacklist des tokens JWT
// ============================================================================

import Redis from "ioredis";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import config from "../config/env.js";
import { SystemError, ErrorFactory } from "../utils/customError.js";
import { SYSTEM_ERRORS } from "../utils/errorCodes.js";

/**
 * 🚫 Service de gestion de la blacklist des tokens JWT
 * Utilise Redis pour stocker les tokens révoqués
 */
class TokenBlacklistService {
  static logger = null;
  static redis = null;

  /**
   * 🔧 Initialiser le service avec Redis
   */
  static initialize(logger, redisClient = null) {
    this.logger = logger;

    // Utiliser le client Redis fourni ou créer une nouvelle connexion
    if (redisClient) {
      this.redis = redisClient;
    } else {
      this.redis = new Redis(config.REDIS_URL, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000,
      });

      // Gestion des événements Redis
      this.redis.on("connect", () => {
        this.logger?.info("Connexion Redis établie pour la blacklist");
      });

      this.redis.on("error", (error) => {
        this.logger?.error("Erreur Redis pour la blacklist", error, {
          action: "redis_blacklist_error",
          errorType: error.name || "unknown",
        });
      });

      this.redis.on("close", () => {
        this.logger?.warn("Connexion Redis fermée pour la blacklist");
      });
    }

    this.logger?.info("Service de blacklist des tokens initialisé", {
      redisUrl: config.REDIS_URL,
      database: "blacklist",
    });
  }

  /**
   * 🚫 Ajouter un token à la blacklist
   */
  static async blacklistToken(token, userId, reason = "logout") {
    try {
      if (!this.redis) {
        throw new SystemError(
          "Service de blacklist non initialisé",
          SYSTEM_ERRORS.SERVICE_NOT_INITIALIZED
        );
      }

      // Décoder le token pour obtenir l'expiration
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) {
        throw new Error("Token invalide ou sans expiration");
      }

      // Calculer le TTL (Time To Live) en secondes
      const ttl = Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));

      // Stocker le token dans Redis avec TTL automatique
      const blacklistKey = `blacklist:${token}`;
      const blacklistData = {
        userId: userId.toString(),
        reason,
        blacklistedAt: new Date().toISOString(),
        expiresAt: new Date(decoded.exp * 1000).toISOString(),
        tokenHash: this.hashToken(token),
      };

      await this.redis.setex(blacklistKey, ttl, JSON.stringify(blacklistData));

      // Ajouter à l'index utilisateur pour les statistiques
      const userBlacklistKey = `user_blacklist:${userId}`;
      await this.redis.sadd(userBlacklistKey, token);
      await this.redis.expire(userBlacklistKey, ttl);

      this.logger?.auth(
        "Token ajouté à la blacklist",
        {
          userId,
          reason,
          ttlSeconds: ttl,
          expiresAt: new Date(decoded.exp * 1000),
        },
        {
          userId: userId.toString(),
          action: "token_blacklisted",
          reason,
        }
      );

      return {
        blacklisted: true,
        ttl,
        expiresAt: new Date(decoded.exp * 1000),
      };
    } catch (error) {
      this.logger?.error("Erreur lors de l'ajout à la blacklist", error, {
        action: "blacklist_token_failed",
        userId: userId?.toString(),
        reason,
      });

      if (error.isOperational) {
        throw error;
      }

      throw new SystemError(
        "Erreur lors de l'ajout du token à la blacklist",
        error
      );
    }
  }

  /**
   * ✅ Vérifier si un token est dans la blacklist
   */
  static async isTokenBlacklisted(token) {
    try {
      if (!this.redis) {
        this.logger?.warn(
          "Service de blacklist non initialisé - token non vérifié"
        );
        return false;
      }

      const blacklistKey = `blacklist:${token}`;
      const blacklistedData = await this.redis.get(blacklistKey);

      if (blacklistedData) {
        const data = JSON.parse(blacklistedData);

        this.logger?.warn(
          "Token trouvé dans la blacklist",
          {
            userId: data.userId,
            reason: data.reason,
            blacklistedAt: data.blacklistedAt,
          },
          {
            userId: data.userId,
            action: "blacklisted_token_used",
            reason: data.reason,
          }
        );

        return true;
      }

      return false;
    } catch (error) {
      this.logger?.error(
        "Erreur lors de la vérification de la blacklist",
        error,
        {
          action: "check_blacklist_failed",
          tokenHash: this.hashToken(token),
        }
      );

      // En cas d'erreur Redis, on considère le token comme valide
      // pour éviter de bloquer les utilisateurs légitimes
      return false;
    }
  }

  /**
   * 🧹 Nettoyer les tokens expirés de la blacklist
   */
  static async cleanupExpiredTokens() {
    try {
      if (!this.redis) {
        return { cleaned: 0 };
      }

      // Redis gère automatiquement l'expiration avec TTL
      // Cette méthode peut être utilisée pour des nettoyages manuels

      this.logger?.debug(
        "Nettoyage automatique des tokens expirés effectué par Redis"
      );

      return { cleaned: 0, automatic: true };
    } catch (error) {
      this.logger?.error("Erreur lors du nettoyage de la blacklist", error, {
        action: "blacklist_cleanup_failed",
      });

      return { cleaned: 0, error: error.message };
    }
  }

  /**
   * 📊 Obtenir les statistiques de la blacklist
   */
  static async getBlacklistStats() {
    try {
      if (!this.redis) {
        return { error: "Service non initialisé" };
      }

      // Compter les tokens dans la blacklist
      const blacklistKeys = await this.redis.keys("blacklist:*");
      const userBlacklistKeys = await this.redis.keys("user_blacklist:*");

      // Obtenir des informations sur les utilisateurs avec le plus de tokens blacklistés
      const userStats = [];
      for (const userKey of userBlacklistKeys.slice(0, 10)) {
        const userId = userKey.split(":")[1];
        const tokenCount = await this.redis.scard(userKey);
        if (tokenCount > 0) {
          userStats.push({ userId, tokenCount });
        }
      }

      return {
        totalBlacklistedTokens: blacklistKeys.length,
        usersWithBlacklistedTokens: userBlacklistKeys.length,
        topUsers: userStats.sort((a, b) => b.tokenCount - a.tokenCount),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger?.error("Erreur lors de la récupération des stats", error, {
        action: "blacklist_stats_failed",
      });

      return { error: error.message };
    }
  }

  /**
   * 🔍 Obtenir les tokens blacklistés d'un utilisateur
   */
  static async getUserBlacklistedTokens(userId) {
    try {
      if (!this.redis) {
        return [];
      }

      const userBlacklistKey = `user_blacklist:${userId}`;
      const tokens = await this.redis.smembers(userBlacklistKey);

      const blacklistedTokens = [];
      for (const token of tokens) {
        const blacklistKey = `blacklist:${token}`;
        const data = await this.redis.get(blacklistKey);

        if (data) {
          const tokenData = JSON.parse(data);
          blacklistedTokens.push({
            token: token.substring(0, 20) + "...", // Masquer le token complet
            reason: tokenData.reason,
            blacklistedAt: tokenData.blacklistedAt,
            expiresAt: tokenData.expiresAt,
          });
        }
      }

      return blacklistedTokens;
    } catch (error) {
      this.logger?.error(
        "Erreur lors de la récupération des tokens utilisateur",
        error,
        {
          action: "get_user_blacklisted_tokens_failed",
          userId: userId?.toString(),
        }
      );

      return [];
    }
  }

  /**
   * 🗑️ Supprimer tous les tokens blacklistés d'un utilisateur
   */
  static async clearUserTokens(userId) {
    try {
      if (!this.redis) {
        return { cleared: 0 };
      }

      const userBlacklistKey = `user_blacklist:${userId}`;
      const tokens = await this.redis.smembers(userBlacklistKey);

      if (tokens.length === 0) {
        return { cleared: 0 };
      }

      // Supprimer chaque token de la blacklist
      for (const token of tokens) {
        const blacklistKey = `blacklist:${token}`;
        await this.redis.del(blacklistKey);
      }

      // Supprimer l'index utilisateur
      await this.redis.del(userBlacklistKey);

      this.logger?.info("Tokens utilisateur supprimés de la blacklist", {
        userId: userId.toString(),
        tokensCleared: tokens.length,
      });

      return { cleared: tokens.length };
    } catch (error) {
      this.logger?.error(
        "Erreur lors de la suppression des tokens utilisateur",
        error,
        {
          action: "clear_user_tokens_failed",
          userId: userId?.toString(),
        }
      );

      return { cleared: 0, error: error.message };
    }
  }

  /**
   * 🔐 Hasher un token pour le stockage sécurisé
   */
  static hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * 🔄 Rafraîchir la connexion Redis si nécessaire
   */
  static async refreshConnection() {
    try {
      if (this.redis && this.redis.status === "ready") {
        return true;
      }

      if (this.redis) {
        await this.redis.disconnect();
      }

      this.initialize(this.logger);
      return true;
    } catch (error) {
      this.logger?.error(
        "Erreur lors du rafraîchissement de la connexion",
        error,
        {
          action: "redis_refresh_failed",
        }
      );

      return false;
    }
  }

  /**
   * 🛑 Arrêter le service
   */
  static async shutdown() {
    try {
      if (this.redis) {
        await this.redis.disconnect();
        this.redis = null;
      }

      this.logger?.info("Service de blacklist des tokens arrêté");
    } catch (error) {
      this.logger?.error("Erreur lors de l'arrêt du service", error, {
        action: "blacklist_shutdown_failed",
      });
    }
  }
}

export default TokenBlacklistService;
