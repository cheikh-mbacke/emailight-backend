// ============================================================================
// 📁 src/middleware/rateLimiting.js - Rate limiting avancé
// ============================================================================

import Redis from "ioredis";
import config from "../config/env.js";
import { RateLimitError } from "../utils/customError.js";
import { RATE_LIMIT_ERRORS } from "../utils/errorCodes.js";

let logger = null;
let redis = null;

export const setLogger = (log) => {
  logger = log;
};

export const setRedis = (redisClient) => {
  redis = redisClient;
};

/**
 * 🔒 Configuration des limites par endpoint
 */
const RATE_LIMIT_RULES = {
  // Authentification
  "POST /api/v1/auth/login": {
    max: 5,
    window: 15 * 60 * 1000, // 15 minutes
    keyGenerator: (request) => `login:${request.ip}`,
    message: "Trop de tentatives de connexion. Réessayez dans 15 minutes.",
  },
  "POST /api/v1/auth/register": {
    max: 3,
    window: 60 * 60 * 1000, // 1 heure
    keyGenerator: (request) => `register:${request.ip}`,
    message: "Trop de tentatives d'inscription. Réessayez dans 1 heure.",
  },
  "POST /api/v1/auth/forgot-password": {
    max: 3,
    window: 60 * 60 * 1000, // 1 heure
    keyGenerator: (request) => `forgot-password:${request.ip}`,
    message: "Trop de demandes de réinitialisation. Réessayez dans 1 heure.",
  },
  "POST /api/v1/auth/reset-password": {
    max: 5,
    window: 15 * 60 * 1000, // 15 minutes
    keyGenerator: (request) => `reset-password:${request.ip}`,
    message:
      "Trop de tentatives de réinitialisation. Réessayez dans 15 minutes.",
  },

  // API utilisateur
  "GET /api/v1/users/me": {
    max: 100,
    window: 60 * 1000, // 1 minute
    keyGenerator: (request) =>
      `user-profile:${request.user?._id || request.ip}`,
    message: "Trop de requêtes de profil. Réessayez dans 1 minute.",
  },
  "PUT /api/v1/users/me": {
    max: 10,
    window: 60 * 1000, // 1 minute
    keyGenerator: (request) => `user-update:${request.user?._id || request.ip}`,
    message: "Trop de mises à jour. Réessayez dans 1 minute.",
  },

  // Comptes email
  "POST /api/v1/users/me/email-accounts": {
    max: 5,
    window: 60 * 1000, // 1 minute
    keyGenerator: (request) =>
      `email-account-create:${request.user?._id || request.ip}`,
    message: "Trop de création de comptes email. Réessayez dans 1 minute.",
  },
  "DELETE /api/v1/users/me/email-accounts/*": {
    max: 10,
    window: 60 * 1000, // 1 minute
    keyGenerator: (request) =>
      `email-account-delete:${request.user?._id || request.ip}`,
    message: "Trop de suppression de comptes. Réessayez dans 1 minute.",
  },

  // Préférences
  "PUT /api/v1/preferences": {
    max: 20,
    window: 60 * 1000, // 1 minute
    keyGenerator: (request) => `preferences:${request.user?._id || request.ip}`,
    message: "Trop de mises à jour de préférences. Réessayez dans 1 minute.",
  },

  // Upload de fichiers
  "POST /api/v1/users/me/upload": {
    max: 10,
    window: 60 * 1000, // 1 minute
    keyGenerator: (request) => `file-upload:${request.user?._id || request.ip}`,
    message: "Trop d'uploads de fichiers. Réessayez dans 1 minute.",
  },

  // OAuth
  "GET /api/v1/auth/google": {
    max: 10,
    window: 60 * 1000, // 1 minute
    keyGenerator: (request) => `google-oauth:${request.ip}`,
    message:
      "Trop de tentatives d'authentification Google. Réessayez dans 1 minute.",
  },
  "GET /api/v1/auth/google/callback": {
    max: 10,
    window: 60 * 1000, // 1 minute
    keyGenerator: (request) => `google-callback:${request.ip}`,
    message: "Trop de callbacks Google. Réessayez dans 1 minute.",
  },
};

/**
 * 🔒 Règles par défaut pour les endpoints non configurés
 */
const DEFAULT_RATE_LIMIT = {
  max: 100,
  window: 60 * 1000, // 1 minute
  keyGenerator: (request) => `default:${request.user?._id || request.ip}`,
  message: "Trop de requêtes. Réessayez dans 1 minute.",
};

/**
 * 🔍 Obtenir la règle de rate limiting pour un endpoint
 */
function getRateLimitRule(request) {
  const method = request.method;
  const url = request.url;
  const endpoint = `${method} ${url}`;

  // Chercher une règle exacte
  if (RATE_LIMIT_RULES[endpoint]) {
    return RATE_LIMIT_RULES[endpoint];
  }

  // Chercher une règle avec wildcard
  for (const [pattern, rule] of Object.entries(RATE_LIMIT_RULES)) {
    if (pattern.includes("*")) {
      const regexPattern = pattern.replace(/\*/g, ".*");
      if (new RegExp(regexPattern).test(endpoint)) {
        return rule;
      }
    }
  }

  return DEFAULT_RATE_LIMIT;
}

/**
 * 🔒 Middleware de rate limiting avancé
 */
export const advancedRateLimit = async (request, reply) => {
  try {
    if (!redis) {
      logger?.warn(
        "Redis non disponible pour le rate limiting - limitation désactivée"
      );
      return;
    }

    const rule = getRateLimitRule(request);
    const key = rule.keyGenerator(request);
    const windowMs = rule.window;
    const max = rule.max;

    // Obtenir le timestamp actuel en millisecondes
    const now = Date.now();
    const windowStart = now - windowMs;

    // Utiliser Redis pour le rate limiting
    const pipeline = redis.pipeline();

    // Supprimer les entrées expirées
    pipeline.zremrangebyscore(key, 0, windowStart);

    // Compter les requêtes dans la fenêtre
    pipeline.zcard(key);

    // Ajouter la requête actuelle
    pipeline.zadd(key, now, `${now}-${Math.random()}`);

    // Définir l'expiration de la clé
    pipeline.expire(key, Math.ceil(windowMs / 1000));

    const results = await pipeline.exec();
    const currentCount = results[1][1];

    // Vérifier si la limite est dépassée
    if (currentCount >= max) {
      // Calculer le temps d'attente
      const oldestRequest = await redis.zrange(key, 0, 0, "WITHSCORES");
      const oldestTimestamp = parseInt(oldestRequest[1]);
      const waitTime = Math.ceil(
        (windowStart + windowMs - oldestTimestamp) / 1000
      );

      logger?.warn(
        "Rate limit dépassé",
        {
          endpoint: `${request.method} ${request.url}`,
          ip: request.ip,
          userId: request.user?._id?.toString(),
          currentCount,
          max,
          waitTime,
        },
        {
          action: "rate_limit_exceeded",
          endpoint: `${request.method} ${request.url}`,
          userId: request.user?._id?.toString(),
        }
      );

      // Retourner l'erreur avec les headers appropriés
      reply.header("X-RateLimit-Limit", max);
      reply.header("X-RateLimit-Remaining", 0);
      reply.header(
        "X-RateLimit-Reset",
        Math.ceil((windowStart + windowMs) / 1000)
      );
      reply.header("Retry-After", waitTime);

      return reply.code(429).send({
        error: "Rate limit exceeded",
        message: rule.message,
        retryAfter: waitTime,
        limit: max,
        window: Math.ceil(windowMs / 1000),
      });
    }

    // Ajouter les headers de rate limiting
    const remaining = Math.max(0, max - currentCount - 1);
    reply.header("X-RateLimit-Limit", max);
    reply.header("X-RateLimit-Remaining", remaining);
    reply.header(
      "X-RateLimit-Reset",
      Math.ceil((windowStart + windowMs) / 1000)
    );

    logger?.debug(
      "Rate limit vérifié",
      {
        endpoint: `${request.method} ${request.url}`,
        currentCount: currentCount + 1,
        remaining,
        max,
      },
      {
        action: "rate_limit_check",
        endpoint: `${request.method} ${request.url}`,
        userId: request.user?._id?.toString(),
      }
    );
  } catch (error) {
    logger?.error("Erreur lors du rate limiting", error, {
      action: "rate_limit_error",
      endpoint: `${request.method} ${request.url}`,
      userId: request.user?._id?.toString(),
    });

    // En cas d'erreur Redis, on laisse passer la requête
    // pour éviter de bloquer les utilisateurs légitimes
  }
};

/**
 * 🔒 Rate limiting spécifique pour les emails
 */
export const emailRateLimit = async (request, reply) => {
  try {
    if (!request.user) {
      return reply.code(401).send({
        error: "Authentication required",
      });
    }

    const userId = request.user._id.toString();
    const key = `email-limit:${userId}`;
    const now = Date.now();
    const dayStart = new Date().setHours(0, 0, 0, 0);

    // Obtenir les limites selon le statut d'abonnement
    const limits = {
      free: 50,
      premium: 500,
      enterprise: 5000,
    };

    const userLimit = limits[request.user.subscriptionStatus] || limits.free;

    // Vérifier les emails envoyés aujourd'hui
    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(key, 0, dayStart);
    pipeline.zcard(key);
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    pipeline.expire(key, 24 * 60 * 60); // 24 heures

    const results = await pipeline.exec();
    const emailsSentToday = results[1][1];

    if (emailsSentToday >= userLimit) {
      logger?.warn(
        "Limite d'emails quotidienne atteinte",
        {
          userId,
          emailsSentToday,
          dailyLimit: userLimit,
          subscriptionStatus: request.user.subscriptionStatus,
        },
        {
          userId,
          action: "email_daily_limit_reached",
        }
      );

      return reply.code(429).send({
        error: "Daily email limit reached",
        message: `You have reached your daily limit of ${userLimit} emails`,
        dailyLimit: userLimit,
        emailsSentToday,
        subscriptionStatus: request.user.subscriptionStatus,
        resetTime: new Date(dayStart + 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    // Mettre à jour le compteur dans la base de données
    await request.user.incrementEmailCount();

    reply.header("X-EmailLimit-Limit", userLimit);
    reply.header("X-EmailLimit-Remaining", userLimit - emailsSentToday - 1);
    reply.header(
      "X-EmailLimit-Reset",
      Math.ceil((dayStart + 24 * 60 * 60 * 1000) / 1000)
    );
  } catch (error) {
    logger?.error("Erreur lors du rate limiting email", error, {
      action: "email_rate_limit_error",
      userId: request.user?._id?.toString(),
    });

    // En cas d'erreur, on laisse passer
  }
};

/**
 * 🔒 Rate limiting pour les tentatives de connexion
 */
export const loginRateLimit = async (request, reply) => {
  try {
    const ip = request.ip;
    const key = `login-attempts:${ip}`;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 5;

    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(key, 0, now - windowMs);
    pipeline.zcard(key);
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    pipeline.expire(key, Math.ceil(windowMs / 1000));

    const results = await pipeline.exec();
    const attempts = results[1][1];

    if (attempts >= maxAttempts) {
      const oldestAttempt = await redis.zrange(key, 0, 0, "WITHSCORES");
      const oldestTimestamp = parseInt(oldestAttempt[1]);
      const waitTime = Math.ceil(
        (now - windowMs + windowMs - oldestTimestamp) / 1000
      );

      logger?.warn(
        "Trop de tentatives de connexion",
        {
          ip,
          attempts,
          maxAttempts,
          waitTime,
        },
        {
          action: "login_rate_limit_exceeded",
          ip,
        }
      );

      reply.header("Retry-After", waitTime);
      return reply.code(429).send({
        error: "Too many login attempts",
        message: "Too many failed login attempts. Please try again later.",
        retryAfter: waitTime,
      });
    }

    reply.header("X-LoginAttempts-Remaining", maxAttempts - attempts - 1);
    reply.header("X-LoginAttempts-Reset", Math.ceil((now + windowMs) / 1000));
  } catch (error) {
    logger?.error("Erreur lors du rate limiting de connexion", error, {
      action: "login_rate_limit_error",
      ip: request.ip,
    });
  }
};

/**
 * 🔧 Factory pour créer des middlewares de rate limiting
 */
export const createRateLimitMiddleware = (rule) => {
  return async (request, reply) => {
    const customRule = {
      ...DEFAULT_RATE_LIMIT,
      ...rule,
    };

    const key = customRule.keyGenerator(request);
    const windowMs = customRule.window;
    const max = customRule.max;

    try {
      const now = Date.now();
      const windowStart = now - windowMs;

      const pipeline = redis.pipeline();
      pipeline.zremrangebyscore(key, 0, windowStart);
      pipeline.zcard(key);
      pipeline.zadd(key, now, `${now}-${Math.random()}`);
      pipeline.expire(key, Math.ceil(windowMs / 1000));

      const results = await pipeline.exec();
      const currentCount = results[1][1];

      if (currentCount >= max) {
        const oldestRequest = await redis.zrange(key, 0, 0, "WITHSCORES");
        const oldestTimestamp = parseInt(oldestRequest[1]);
        const waitTime = Math.ceil(
          (windowStart + windowMs - oldestTimestamp) / 1000
        );

        reply.header("Retry-After", waitTime);
        return reply.code(429).send({
          error: "Rate limit exceeded",
          message: customRule.message,
          retryAfter: waitTime,
        });
      }

      reply.header("X-RateLimit-Limit", max);
      reply.header(
        "X-RateLimit-Remaining",
        Math.max(0, max - currentCount - 1)
      );
      reply.header(
        "X-RateLimit-Reset",
        Math.ceil((windowStart + windowMs) / 1000)
      );
    } catch (error) {
      logger?.error("Erreur rate limiting personnalisé", error, {
        action: "custom_rate_limit_error",
        endpoint: `${request.method} ${request.url}`,
      });
    }
  };
};

/**
 * 📊 Obtenir les statistiques de rate limiting
 */
export const getRateLimitStats = async () => {
  try {
    if (!redis) {
      return { error: "Redis non disponible" };
    }

    const keys = await redis.keys("*rate*");
    const stats = {};

    for (const key of keys) {
      const count = await redis.zcard(key);
      const ttl = await redis.ttl(key);

      if (count > 0) {
        stats[key] = {
          count,
          ttl,
          type: key.includes("login")
            ? "login"
            : key.includes("email")
              ? "email"
              : key.includes("register")
                ? "register"
                : "general",
        };
      }
    }

    return {
      totalKeys: keys.length,
      activeKeys: Object.keys(stats).length,
      stats,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger?.error(
      "Erreur lors de la récupération des stats de rate limiting",
      error,
      {
        action: "rate_limit_stats_error",
      }
    );

    return { error: error.message };
  }
};
