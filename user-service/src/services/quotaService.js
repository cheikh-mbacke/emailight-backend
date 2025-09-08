// ============================================================================
// src/services/quotaService.js - Service de gestion des quotas email
// ============================================================================

import User from "../models/User.js";
import I18nService from "./i18nService.js";
import { ErrorFactory, QuotaExceededError } from "../utils/customError.js";
import { USER_ERRORS, QUOTA_ERRORS } from "../utils/errorCodes.js";
import { EMAIL_LIMITS, SUBSCRIPTION_STATUS } from "../constants/enums.js";

/**
 * 🎯 Service de gestion des quotas email
 * Gère les limites d'envoi avec opérations atomiques pour éviter les race conditions
 */
class QuotaService {
  // Logger injection
  static setLogger(injectedLogger) {
    this.logger = injectedLogger;
  }

  /**
   * 🔒 Vérifie et consomme un quota email de manière atomique
   * @param {string} userId - ID de l'utilisateur
   * @param {string} userTimezone - Timezone de l'utilisateur (défaut: Europe/Paris)
   * @returns {Promise<{canSend: boolean, quotaInfo: object}>}
   */
  static async consumeEmailQuota(userId, userTimezone = "Europe/Paris") {
    try {
      const todayKey = this.getTodayKey(userTimezone);

      // 🔒 Opération atomique : vérifier et incrémenter en une seule requête
      const result = await User.findOneAndUpdate(
        {
          _id: userId,
          isActive: true,
          // Conditions pour pouvoir envoyer un email
          $or: [
            // Cas 1: Premier email du jour (pas de date ou date différente)
            { "security.lastEmailSentDate": { $exists: false } },
            { "security.lastEmailSentDate": null },
            { "security.lastEmailSentKey": { $ne: todayKey } },
            // Cas 2: Même jour mais sous la limite
            {
              "security.lastEmailSentKey": todayKey,
              $expr: {
                $lt: [
                  "$security.emailsSentToday",
                  this.getSubscriptionLimit("$subscriptionStatus"),
                ],
              },
            },
          ],
        },
        [
          {
            $set: {
              "security.lastEmailSentDate": new Date(),
              "security.lastEmailSentKey": todayKey,
              "security.emailsSentToday": {
                $cond: {
                  if: { $eq: ["$security.lastEmailSentKey", todayKey] },
                  then: { $add: ["$security.emailsSentToday", 1] },
                  else: 1, // Premier email du jour
                },
              },
            },
          },
        ],
        {
          new: true,
          projection: {
            subscriptionStatus: 1,
            "security.emailsSentToday": 1,
            "security.lastEmailSentKey": 1,
            preferences: 1,
          },
        }
      );

      if (!result) {
        // L'utilisateur n'existe pas ou a atteint sa limite
        const user = await User.findById(userId).select(
          "subscriptionStatus security.emailsSentToday security.lastEmailSentKey preferences"
        );

        if (!result) {
          throw ErrorFactory.notFound(
            "User not found",
            USER_ERRORS.USER_NOT_FOUND,
            { userId }
          );
        }

        // Utilisateur trouvé mais quota atteint
        const quotaInfo = this.getQuotaInfo(user, userTimezone);
        const userLanguage = I18nService.getUserLanguage(user);

        this.logger.warn(
          I18nService.getMessage("logs.quotaExceeded", userLanguage),
          {
            userId: userId.toString(),
            quotaInfo,
          },
          {
            action: "email_quota_exceeded",
            userId: userId.toString(),
          }
        );

        return {
          canSend: false,
          quotaInfo,
          reason: I18nService.getMessage("quota.exceeded", userLanguage),
        };
      }

      // ✅ Quota consommé avec succès
      const quotaInfo = this.getQuotaInfo(result, userTimezone);
      const userLanguage = I18nService.getUserLanguage(result);

      this.logger.debug(
        I18nService.getMessage("logs.quotaConsumed", userLanguage),
        {
          userId: userId.toString(),
          quotaInfo,
        },
        {
          action: "email_quota_consumed",
          userId: userId.toString(),
        }
      );

      return {
        canSend: true,
        quotaInfo,
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger.error("Error consuming email quota", error, {
        action: "consume_email_quota_failed",
        userId: userId?.toString(),
      });

      throw new SystemError("Error processing email quota", error, {
        userId: userId?.toString(),
      });
    }
  }

  /**
   * 📊 Obtient les informations de quota sans les modifier
   * @param {string} userId - ID de l'utilisateur
   * @param {string} userTimezone - Timezone de l'utilisateur
   * @returns {Promise<object>} Informations de quota
   */
  static async getQuotaInfo(userId, userTimezone = "Europe/Paris") {
    try {
      const user = await User.findById(userId).select(
        "subscriptionStatus security.emailsSentToday security.lastEmailSentKey preferences"
      );

      if (!user) {
        const userLanguage = I18nService.getAvailableLanguages().FR;
        throw ErrorFactory.validation(
          I18nService.getMessage("user.notFound", userLanguage),
          USER_ERRORS.USER_NOT_FOUND
        );
      }

      return this.getQuotaInfo(user, userTimezone);
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger.error("Error retrieving quota info", error, {
        action: "get_quota_info_failed",
        userId: userId?.toString(),
      });

      throw new SystemError("Error retrieving quota information", error, {
        userId: userId?.toString(),
      });
    }
  }

  /**
   * 🔄 Remet à zéro le quota quotidien (tâche de maintenance)
   * @param {string} userId - ID de l'utilisateur (optionnel, pour tous si non fourni)
   * @param {string} userTimezone - Timezone pour le calcul
   * @returns {Promise<{resetCount: number}>}
   */
  static async resetDailyQuota(userId = null, userTimezone = "Europe/Paris") {
    try {
      const todayKey = this.getTodayKey(userTimezone);

      let query = {
        isActive: true,
        "security.lastEmailSentKey": { $ne: todayKey },
        "security.emailsSentToday": { $gt: 0 },
      };

      if (userId) {
        query._id = userId;
      }

      const result = await User.updateMany(query, {
        $set: {
          "security.emailsSentToday": 0,
        },
        $unset: {
          "security.lastEmailSentKey": 1,
        },
      });

      this.logger.info(
        `Daily quota reset completed`,
        {
          resetCount: result.modifiedCount,
          timezone: userTimezone,
          todayKey,
        },
        {
          action: "daily_quota_reset",
          resetCount: result.modifiedCount,
        }
      );

      return {
        resetCount: result.modifiedCount,
        timezone: userTimezone,
        resetDate: new Date(),
      };
    } catch (error) {
      this.logger.error("Error resetting daily quota", error, {
        action: "reset_daily_quota_failed",
        userId: userId?.toString(),
      });

      throw new SystemError("Error resetting daily quota", error, {
        userId: userId?.toString(),
      });
    }
  }

  /**
   * 📈 Obtient les statistiques de quota pour plusieurs utilisateurs
   * @param {Array<string>} userIds - IDs des utilisateurs
   * @param {string} userTimezone - Timezone
   * @returns {Promise<Array>} Statistiques de quota
   */
  static async getBulkQuotaStats(userIds, userTimezone = "Europe/Paris") {
    try {
      const users = await User.find({
        _id: { $in: userIds },
        isActive: true,
      }).select(
        "_id subscriptionStatus security.emailsSentToday security.lastEmailSentKey preferences"
      );

      return users.map((user) => ({
        userId: user._id.toString(),
        quotaInfo: this.getQuotaInfo(user, userTimezone),
      }));
    } catch (error) {
      this.logger.error("Error retrieving bulk quota stats", error, {
        action: "get_bulk_quota_stats_failed",
        userCount: userIds?.length,
      });

      throw new SystemError("Error retrieving bulk quota statistics", error, {
        userCount: userIds?.length,
      });
    }
  }

  // ==========================================
  // 🔧 MÉTHODES UTILITAIRES PRIVÉES
  // ==========================================

  /**
   * 📅 Génère une clé unique pour le jour actuel dans la timezone donnée
   * Format: YYYY-MM-DD-TZ (ex: 2024-12-25-Europe/Paris)
   */
  static getTodayKey(timezone = "Europe/Paris") {
    try {
      const today = new Date();
      const options = {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      };

      const dateStr = today.toLocaleDateString("en-CA", options); // Format YYYY-MM-DD
      return `${dateStr}-${timezone}`;
    } catch (error) {
      // Fallback si timezone invalide
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0]; // YYYY-MM-DD
      return `${dateStr}-UTC`;
    }
  }

  /**
   * 📊 Calcule les informations de quota pour un utilisateur
   */
  static getQuotaInfo(user, userTimezone = "Europe/Paris") {
    const todayKey = this.getTodayKey(userTimezone);
    const limit = EMAIL_LIMITS[user.subscriptionStatus] || EMAIL_LIMITS.free;

    // ✅ CORRIGÉ: Gestion sécurisée de user.security
    if (!user.security) {
      // Si security n'existe pas, initialiser avec des valeurs par défaut
      return {
        subscription: user.subscriptionStatus || "free",
        dailyLimit: limit,
        used: 0,
        remaining: limit,
        canSend: true,
        timezone: userTimezone,
        todayKey,
        resetTime: this.getNextResetTime(userTimezone),
      };
    }

    // Si c'est un nouveau jour, le compteur est remis à 0
    const emailsSentToday =
      user.security.lastEmailSentKey === todayKey
        ? user.security.emailsSentToday || 0
        : 0;

    const remaining = Math.max(0, limit - emailsSentToday);
    const canSend = remaining > 0;

    return {
      subscription: user.subscriptionStatus,
      dailyLimit: limit,
      used: emailsSentToday,
      remaining,
      canSend,
      timezone: userTimezone,
      todayKey,
      resetTime: this.getNextResetTime(userTimezone),
    };
  }

  /**
   * 🕐 Calcule l'heure du prochain reset (minuit dans la timezone utilisateur)
   */
  static getNextResetTime(timezone = "Europe/Paris") {
    try {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Créer une date à minuit dans la timezone utilisateur
      const resetTime = new Date(
        tomorrow.toLocaleDateString("en-CA", { timeZone: timezone }) +
          "T00:00:00"
      );

      return resetTime;
    } catch (error) {
      // Fallback UTC
      const tomorrow = new Date();
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);
      return tomorrow;
    }
  }

  /**
   * 💰 Obtient la limite d'abonnement (pour utilisation dans MongoDB aggregation)
   */
  static getSubscriptionLimit(subscriptionField) {
    return {
      $switch: {
        branches: [
          {
            case: { $eq: [subscriptionField, SUBSCRIPTION_STATUS.PREMIUM] },
            then: EMAIL_LIMITS.premium,
          },
          {
            case: { $eq: [subscriptionField, SUBSCRIPTION_STATUS.ENTERPRISE] },
            then: EMAIL_LIMITS.enterprise,
          },
        ],
        default: EMAIL_LIMITS.free,
      },
    };
  }

  /**
   * 🏥 Vérifie la santé du système de quotas
   * @returns {Promise<object>} Rapport de santé
   */
  static async healthCheck() {
    try {
      const stats = await User.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: "$subscriptionStatus",
            count: { $sum: 1 },
            totalEmailsSent: { $sum: "$security.emailsSentToday" },
            avgEmailsSent: { $avg: "$security.emailsSentToday" },
          },
        },
      ]);

      const totalUsers = await User.countDocuments({ isActive: true });
      const usersAtLimit = await User.countDocuments({
        isActive: true,
        $expr: {
          $gte: [
            "$security.emailsSentToday",
            this.getSubscriptionLimit("$subscriptionStatus"),
          ],
        },
      });

      return {
        status: "healthy",
        timestamp: new Date(),
        metrics: {
          totalActiveUsers: totalUsers,
          usersAtLimit,
          utilizationRate:
            totalUsers > 0 ? (usersAtLimit / totalUsers) * 100 : 0,
          bySubscription: stats,
        },
      };
    } catch (error) {
      this.logger.error("Error during quota health check", error, {
        action: "quota_health_check_failed",
      });

      return {
        status: "error",
        timestamp: new Date(),
        error: error.message,
      };
    }
  }
}

export default QuotaService;
