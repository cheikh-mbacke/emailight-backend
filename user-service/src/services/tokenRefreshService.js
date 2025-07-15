// ============================================================================
// 📁 src/services/tokenRefreshService.js - Service de refresh automatique des tokens
// ============================================================================

import EmailAccount from "../models/EmailAccount.js";
import GmailOAuthService from "./gmailOAuthService.js";
import OutlookOAuthService from "./outlookOAuthService.js";
import { SystemError } from "../utils/customError.js";

/**
 * 🔄 Token Refresh Service - Gestion automatique du refresh des tokens OAuth
 */
class TokenRefreshService {
  static logger = null;
  static refreshInterval = null;

  /**
   * ✅ Injection du logger
   */
  static setLogger(injectedLogger) {
    this.logger = injectedLogger;
    // Injecter aussi dans les services OAuth
    GmailOAuthService.setLogger(injectedLogger);
    OutlookOAuthService.setLogger(injectedLogger);
  }

  /**
   * 🚀 Start automatic token refresh scheduler
   */
  static startRefreshScheduler(intervalMinutes = 60) {
    try {
      // Arrêter l'ancien scheduler s'il existe
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
      }

      // Démarrer le nouveau scheduler
      this.refreshInterval = setInterval(
        async () => {
          await this.refreshExpiredTokens();
        },
        intervalMinutes * 60 * 1000
      );

      this.logger?.success("Scheduler de refresh des tokens démarré", {
        intervalMinutes,
        nextRunIn: `${intervalMinutes} minutes`,
      });

      // Exécuter immédiatement une fois au démarrage
      setTimeout(async () => {
        await this.refreshExpiredTokens();
      }, 5000); // Attendre 5 secondes après le démarrage

      return true;
    } catch (error) {
      this.logger?.error("Erreur démarrage scheduler refresh tokens", error, {
        action: "token_refresh_scheduler_start_failed",
      });
      return false;
    }
  }

  /**
   * 🛑 Stop automatic token refresh scheduler
   */
  static stopRefreshScheduler() {
    try {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
        this.refreshInterval = null;

        this.logger?.info("Scheduler de refresh des tokens arrêté");
        return true;
      }
      return false;
    } catch (error) {
      this.logger?.error("Erreur arrêt scheduler refresh tokens", error);
      return false;
    }
  }

  /**
   * 🔄 Refresh all expired or soon-to-expire tokens
   */
  static async refreshExpiredTokens() {
    try {
      // Chercher les tokens qui expirent dans les 30 prochaines minutes
      const expiryThreshold = new Date();
      expiryThreshold.setMinutes(expiryThreshold.getMinutes() + 30);

      const accountsToRefresh = await EmailAccount.find({
        isActive: true,
        tokenExpiry: { $lt: expiryThreshold },
        refreshToken: { $exists: true, $ne: null },
        errorCount: { $lt: 5 }, // Éviter les comptes avec trop d'erreurs
      });

      if (accountsToRefresh.length === 0) {
        this.logger?.debug("Aucun token à rafraîchir", {
          checked: await EmailAccount.countDocuments({ isActive: true }),
          threshold: expiryThreshold,
        });
        return { refreshed: 0, errors: 0 };
      }

      this.logger?.info("Début du refresh automatique des tokens", {
        accountsToRefresh: accountsToRefresh.length,
        threshold: expiryThreshold,
      });

      let refreshedCount = 0;
      let errorCount = 0;

      // Traiter chaque compte individuellement
      for (const account of accountsToRefresh) {
        try {
          const result = await this.refreshAccountToken(account);
          if (result.refreshed) {
            refreshedCount++;
          }
        } catch (error) {
          errorCount++;
          this.logger?.warn("Échec refresh token individuel", {
            accountId: account._id.toString(),
            email: account.email,
            provider: account.provider,
            error: error.message,
          });
        }
      }

      this.logger?.success("Refresh automatique des tokens terminé", {
        totalAccounts: accountsToRefresh.length,
        refreshed: refreshedCount,
        errors: errorCount,
        successRate: `${Math.round((refreshedCount / accountsToRefresh.length) * 100)}%`,
      });

      return {
        refreshed: refreshedCount,
        errors: errorCount,
        total: accountsToRefresh.length,
      };
    } catch (error) {
      this.logger?.error("Erreur refresh automatique des tokens", error, {
        action: "automatic_token_refresh_failed",
      });

      throw new SystemError(
        "Erreur lors du refresh automatique des tokens",
        error
      );
    }
  }

  /**
   * 🔄 Refresh token for a specific account
   */
  static async refreshAccountToken(emailAccount) {
    try {
      let result;

      switch (emailAccount.provider) {
        case "gmail":
          result = await GmailOAuthService.refreshAccessToken(emailAccount);
          break;

        case "outlook":
          result = await OutlookOAuthService.refreshAccessToken(emailAccount);
          break;

        default:
          throw new Error(`Provider non supporté: ${emailAccount.provider}`);
      }

      this.logger?.user(
        "Token rafraîchi individuellement",
        {
          email: emailAccount.email,
          provider: emailAccount.provider,
          newExpiry: result.newExpiry,
        },
        {
          userId: emailAccount.userId.toString(),
          email: emailAccount.email,
          action: `${emailAccount.provider}_token_auto_refreshed`,
        }
      );

      return result;
    } catch (error) {
      // Log mais ne pas faire échouer le processus global
      this.logger?.warn("Échec refresh token individuel", {
        accountId: emailAccount._id.toString(),
        email: emailAccount.email,
        provider: emailAccount.provider,
        error: error.message,
      });

      // Marquer le compte comme ayant des erreurs
      await emailAccount.recordError(error);

      throw error;
    }
  }

  /**
   * 🔄 Refresh token for a specific account by ID (manual)
   */
  static async refreshAccountById(accountId, userId = null) {
    try {
      const query = { _id: accountId };
      if (userId) {
        query.userId = userId;
      }

      const emailAccount = await EmailAccount.findOne(query);

      if (!emailAccount) {
        throw new Error("Compte email introuvable");
      }

      if (!emailAccount.isActive) {
        throw new Error("Compte email désactivé");
      }

      if (!emailAccount.refreshToken) {
        throw new Error("Token de rafraîchissement manquant");
      }

      const result = await this.refreshAccountToken(emailAccount);

      this.logger?.user(
        "Token rafraîchi manuellement",
        {
          email: emailAccount.email,
          provider: emailAccount.provider,
        },
        {
          userId: emailAccount.userId.toString(),
          email: emailAccount.email,
          action: `${emailAccount.provider}_token_manual_refresh`,
        }
      );

      return {
        account: emailAccount.secureInfo,
        refreshResult: result,
        refreshedAt: new Date(),
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur refresh token manuel", error, {
        action: "manual_token_refresh_failed",
        accountId: accountId?.toString(),
        userId: userId?.toString(),
      });

      throw new SystemError(
        "Erreur lors du rafraîchissement manuel du token",
        error
      );
    }
  }

  /**
   * 📊 Get refresh statistics
   */
  static async getRefreshStats() {
    try {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const expiryThreshold = new Date(now.getTime() + 30 * 60 * 1000);

      const stats = {
        total: await EmailAccount.countDocuments({ isActive: true }),
        byProvider: {},
        needsRefresh: await EmailAccount.countDocuments({
          isActive: true,
          tokenExpiry: { $lt: expiryThreshold },
        }),
        expired: await EmailAccount.countDocuments({
          isActive: true,
          tokenExpiry: { $lt: now },
        }),
        withErrors: await EmailAccount.countDocuments({
          isActive: true,
          errorCount: { $gt: 0 },
        }),
        healthy: await EmailAccount.countDocuments({
          isActive: true,
          tokenExpiry: { $gt: expiryThreshold },
          errorCount: 0,
        }),
      };

      // Stats par provider
      const providers = ["gmail", "outlook", "yahoo", "other"];
      for (const provider of providers) {
        stats.byProvider[provider] = {
          total: await EmailAccount.countDocuments({
            isActive: true,
            provider,
          }),
          needsRefresh: await EmailAccount.countDocuments({
            isActive: true,
            provider,
            tokenExpiry: { $lt: expiryThreshold },
          }),
          expired: await EmailAccount.countDocuments({
            isActive: true,
            provider,
            tokenExpiry: { $lt: now },
          }),
        };
      }

      return {
        stats,
        schedulerRunning: !!this.refreshInterval,
        lastUpdate: now,
      };
    } catch (error) {
      this.logger?.error("Erreur récupération stats refresh", error, {
        action: "refresh_stats_failed",
      });

      throw new SystemError(
        "Erreur lors de la récupération des statistiques de refresh",
        error
      );
    }
  }

  /**
   * 🧹 Cleanup accounts with persistent errors
   */
  static async cleanupFailedAccounts(maxErrors = 10) {
    try {
      const failedAccounts = await EmailAccount.find({
        isActive: true,
        errorCount: { $gte: maxErrors },
      });

      if (failedAccounts.length === 0) {
        return { deactivated: 0, message: "Aucun compte à nettoyer" };
      }

      // Désactiver les comptes avec trop d'erreurs
      const result = await EmailAccount.updateMany(
        {
          isActive: true,
          errorCount: { $gte: maxErrors },
        },
        {
          $set: { isActive: false },
        }
      );

      this.logger?.warn("Comptes avec erreurs persistantes désactivés", {
        deactivated: result.modifiedCount,
        maxErrors,
        accountIds: failedAccounts.map((acc) => acc._id.toString()),
      });

      return {
        deactivated: result.modifiedCount,
        accounts: failedAccounts.map((acc) => ({
          id: acc._id.toString(),
          email: acc.email,
          provider: acc.provider,
          errorCount: acc.errorCount,
        })),
      };
    } catch (error) {
      this.logger?.error("Erreur nettoyage comptes en erreur", error, {
        action: "cleanup_failed_accounts_error",
      });

      throw new SystemError(
        "Erreur lors du nettoyage des comptes en erreur",
        error
      );
    }
  }

  /**
   * 🔍 Check if scheduler is running
   */
  static isSchedulerRunning() {
    return !!this.refreshInterval;
  }

  /**
   * 📋 Get current configuration
   */
  static getConfiguration() {
    return {
      schedulerRunning: this.isSchedulerRunning(),
      gmailOAuth: GmailOAuthService.getStatus(),
      outlookOAuth: OutlookOAuthService.getStatus(),
      refreshThresholdMinutes: 30,
      maxErrorsBeforeDeactivation: 10,
    };
  }
}

export default TokenRefreshService;
