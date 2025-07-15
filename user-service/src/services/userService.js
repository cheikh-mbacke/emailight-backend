// ============================================================================
// src/services/userService.js - User management service (CORRIGÉ)
// ============================================================================

import mongoose from "mongoose";
import User from "../models/User.js";
import EmailAccount from "../models/EmailAccount.js";
import QuotaService from "./quotaService.js";
import AvatarService from "./userAvatarService.js";
import I18nService from "./i18nService.js";

// ✅ CORRECTION 1: Import du bon système d'erreurs
import {
  ErrorFactory,
  NotFoundError,
  SystemError,
  ConflictError,
} from "../utils/customError.js";
import {
  VALIDATION_HELPERS,
  VALIDATION_RULES,
} from "../constants/validationRules.js";

import { USER_ERRORS, EMAIL_ACCOUNT_ERRORS } from "../utils/errorCodes.js";
import {
  EMAIL_LIMITS,
  SECURITY,
  SUBSCRIPTION_STATUS,
} from "../constants/enums.js";

// ✅ CORRECTION 2: Import unique des constantes temporelles
import {
  SECURITY_INTERVALS,
  DURATION,
  TIME_HELPERS,
} from "../constants/timeConstants.js";

/**
 * 👤 Service de gestion des utilisateurs - Version corrigée
 * Responsabilités : CRUD utilisateur, logique métier, orchestration des services
 */
class UserService {
  // Logger injection
  static setLogger(injectedLogger) {
    this.logger = injectedLogger;
    QuotaService.setLogger(injectedLogger);
    AvatarService.setLogger(injectedLogger);
  }

  // ==========================================
  // 👤 GESTION DU PROFIL UTILISATEUR
  // ==========================================

  /**
   * 📋 Récupère le profil complet d'un utilisateur
   */
  static async getUserProfile(userId) {
    // ✅ CORRECTION 3: Utilisation du bon système d'erreurs sans safeExecute
    try {
      this.validateObjectId(userId);

      const user = await User.findById(userId).populate(
        "connectedEmailAccounts",
        "email provider isActive lastUsed emailsSent healthStatus"
      );

      if (!user) {
        throw ErrorFactory.notFound(
          "Utilisateur introuvable",
          USER_ERRORS.USER_NOT_FOUND
        );
      }

      const userLanguage = I18nService.getUserLanguage(user);
      const quotaInfo = await QuotaService.getQuotaInfo(
        userId,
        user.preferences?.timezone
      );

      this.logger?.user(
        "Profil utilisateur récupéré",
        {
          userId: userId.toString(),
          hasQuotaInfo: !!quotaInfo,
          connectedAccountsCount: user.connectedEmailAccounts.length,
        },
        {
          userId: userId.toString(),
          action: "get_user_profile",
        }
      );

      return {
        profile: user.profile,
        preferences: user.preferences,
        subscription: {
          status: user.subscriptionStatus,
          endsAt: user.subscriptionEndsAt,
        },
        security: {
          isEmailVerified: user.isEmailVerified,
          lastActiveAt: user.lastActiveAt,
          ...quotaInfo,
        },
        connectedAccounts: user.connectedEmailAccounts,
        stats: {
          accountCreatedAt: user.createdAt,
          totalConnectedAccounts: user.connectedEmailAccounts.length,
          isActive: user.isActive,
        },
      };
    } catch (error) {
      // Si c'est déjà une erreur opérationnelle, on la re-lance
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur lors de la récupération du profil", error, {
        action: "get_user_profile_failed",
        userId: userId?.toString(),
      });

      throw new SystemError(
        "Erreur lors de la récupération du profil utilisateur",
        error,
        { userId: userId?.toString() }
      );
    }
  }

  /**
   * ✏️ Met à jour le nom d'un utilisateur
   */
  static async updateUserName(userId, name) {
    try {
      this.validateObjectId(userId);
      this.validateName(name);

      const user = await User.findByIdAndUpdate(
        userId,
        { name: name.trim() },
        { new: true, runValidators: true }
      );

      if (!user) {
        throw ErrorFactory.notFound(
          "Utilisateur introuvable",
          USER_ERRORS.USER_NOT_FOUND
        );
      }

      const userLanguage = I18nService.getUserLanguage(user);

      this.logger?.user(
        I18nService.getMessage("logs.nameUpdated", userLanguage),
        {
          oldName: user.name,
          newName: name.trim(),
        },
        {
          userId: userId.toString(),
          email: user.email,
          action: "name_updated",
        }
      );

      return {
        user: user.profile,
        updated: true,
        updatedAt: new Date(),
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur lors de la mise à jour du nom", error, {
        action: "update_user_name_failed",
        userId: userId?.toString(),
      });

      throw new SystemError("Erreur lors de la mise à jour du nom", error, {
        userId: userId?.toString(),
      });
    }
  }

  // ==========================================
  // 🗑️ SUPPRESSION DE COMPTE
  // ==========================================

  /**
   * 💥 Suppression complète du compte utilisateur (GDPR)
   */
  static async deleteUserAccount(userId) {
    try {
      this.validateObjectId(userId);

      // Utilisation d'une transaction pour la cohérence
      const session = await mongoose.startSession();

      try {
        return await session.withTransaction(async () => {
          const user = await User.findById(userId).session(session);
          if (!user) {
            throw ErrorFactory.notFound(
              "Utilisateur introuvable",
              USER_ERRORS.USER_NOT_FOUND
            );
          }

          const userLanguage = I18nService.getUserLanguage(user);
          const userEmail = user.email;
          const userAvatarUrl = user.profilePictureUrl;

          // 1. Delete all connected email accounts
          const emailAccountsResult = await EmailAccount.deleteMany(
            { userId },
            { session }
          );

          // 2. Delete avatar if it exists
          let avatarDeleted = false;
          if (userAvatarUrl) {
            try {
              const deleteResult =
                await AvatarService.deleteAvatar(userAvatarUrl);
              avatarDeleted = deleteResult.deleted;
            } catch (avatarError) {
              this.logger?.warn(
                I18nService.getMessage("logs.avatarDeleteFailed", userLanguage),
                avatarError
              );
            }
          }

          // 3. Delete user
          await User.findByIdAndDelete(userId, { session });

          this.logger?.user(
            I18nService.getMessage("logs.accountDeleted", userLanguage),
            {
              email: userEmail,
              emailAccountsDeleted: emailAccountsResult.deletedCount,
              avatarDeleted,
              gdprCompliance: true,
            },
            {
              userId: userId.toString(),
              email: userEmail,
              action: "account_permanently_deleted",
            }
          );

          return {
            accountDeleted: true,
            deletedAt: new Date(),
            email: userEmail,
            deletedData: {
              emailAccounts: emailAccountsResult.deletedCount,
              avatar: avatarDeleted,
              preferences: true,
              security: true,
            },
            gdprCompliant: true,
          };
        });
      } finally {
        await session.endSession();
      }
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur lors de la suppression du compte", error, {
        action: "delete_user_account_failed",
        userId: userId?.toString(),
      });

      throw new SystemError("Erreur lors de la suppression du compte", error, {
        userId: userId?.toString(),
      });
    }
  }

  // ==========================================
  // 📊 STATISTIQUES ET MONITORING
  // ==========================================

  /**
   * 📈 Statistiques d'utilisation utilisateur
   */
  static async getUserStats(userId) {
    try {
      this.validateObjectId(userId);

      const user = await User.findById(userId);
      if (!user) {
        throw ErrorFactory.notFound(
          "Utilisateur introuvable",
          USER_ERRORS.USER_NOT_FOUND
        );
      }

      // Stats from connected email accounts
      const emailAccounts = await EmailAccount.find({ userId });
      const quotaInfo = await QuotaService.getQuotaInfo(
        userId,
        user.preferences?.timezone
      );

      const emailStats = {
        totalAccounts: emailAccounts.length,
        activeAccounts: emailAccounts.filter((acc) => acc.isActive).length,
        totalEmailsSent: emailAccounts.reduce(
          (sum, acc) => sum + acc.emailsSent,
          0
        ),
        providers: emailAccounts.reduce((acc, account) => {
          acc[account.provider] = (acc[account.provider] || 0) + 1;
          return acc;
        }, {}),
      };

      return {
        user: {
          memberSince: user.createdAt,
          lastActive: user.lastActiveAt,
          subscriptionStatus: user.subscriptionStatus,
          isEmailVerified: user.isEmailVerified,
        },
        usage: quotaInfo,
        emailAccounts: emailStats,
        security: {
          failedLoginAttempts: user.security.failedLoginAttempts,
          isAccountLocked: this.isAccountLocked(user),
          lastPasswordChange: user.security.passwordChangedAt,
          securityScore: this.getSecurityScore(user),
        },
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error(
        "Erreur lors de la récupération des statistiques",
        error,
        {
          action: "get_user_stats_failed",
          userId: userId?.toString(),
        }
      );

      throw new SystemError(
        "Erreur lors de la récupération des statistiques",
        error,
        { userId: userId?.toString() }
      );
    }
  }

  // ==========================================
  // 🔧 MÉTHODES UTILITAIRES PRIVÉES
  // ==========================================

  /**
   * Valide un ObjectId MongoDB
   * ✅ CORRIGÉ: Utilise les helpers centralisés
   */
  static validateObjectId(id, fieldName = "ID") {
    if (!VALIDATION_HELPERS.isObjectIdValid(id)) {
      throw ErrorFactory.validation(`${fieldName} invalide`, {
        field: fieldName.toLowerCase(),
        provided: id,
      });
    }
  }

  /**
   * Valide un nom d'utilisateur
   * ✅ CORRIGÉ: Utilise les helpers centralisés
   */
  static validateName(name) {
    if (
      !VALIDATION_HELPERS.isLengthValid(name, 2, 100) ||
      !VALIDATION_HELPERS.matchesPattern(name, VALIDATION_RULES.NAME.PATTERN)
    ) {
      throw ErrorFactory.validation("Nom invalide", { field: "name" });
    }
  }

  /**
   * Construit l'URL de base depuis la requête
   */
  static buildBaseUrl(request) {
    if (!request) {
      return process.env.BASE_URL || "http://localhost:3001";
    }

    const protocol =
      request.headers["x-forwarded-proto"] ||
      (request.headers["x-forwarded-ssl"] === "on" ? "https" : "http");
    const host = request.headers.host || "localhost:3001";

    return `${protocol}://${host}`;
  }

  // ==========================================
  // 📊 MÉTHODES D'ADMINISTRATION
  // ==========================================

  /**
   * 🏥 Vérification de santé du service utilisateur
   */
  static async healthCheck() {
    try {
      const health = {
        status: "healthy",
        timestamp: new Date(),
        services: {},
        metrics: {},
      };

      // Test de connectivité MongoDB
      try {
        await User.findOne().limit(1);
        health.services.database = "healthy";
      } catch (dbError) {
        health.services.database = "error";
        health.status = "degraded";
      }

      // Vérification QuotaService
      try {
        const quotaHealth = await QuotaService.healthCheck();
        health.services.quota = quotaHealth.status;
        if (quotaHealth.status !== "healthy") {
          health.status = "degraded";
        }
      } catch (quotaError) {
        health.services.quota = "error";
        health.status = "degraded";
      }

      // Vérification AvatarService
      try {
        const avatarHealth = await AvatarService.healthCheck();
        health.services.avatar = avatarHealth.status;
        if (avatarHealth.status !== "healthy") {
          health.status = "degraded";
        }
      } catch (avatarError) {
        health.services.avatar = "error";
        health.status = "degraded";
      }

      // Métriques utilisateurs
      try {
        const totalUsers = await User.countDocuments({ isActive: true });
        const lockedUsers = await User.countDocuments({
          isActive: true,
          "security.accountLockedUntil": { $gt: new Date() },
        });

        health.metrics = {
          totalActiveUsers: totalUsers,
          lockedUsers,
          lockRate: totalUsers > 0 ? (lockedUsers / totalUsers) * 100 : 0,
        };
      } catch (metricsError) {
        health.metrics = { error: "Failed to collect metrics" };
      }

      return health;
    } catch (error) {
      this.logger?.error("User service health check failed", error, {
        action: "user_service_health_check_failed",
      });

      return {
        status: "error",
        timestamp: new Date(),
        error: error.message,
      };
    }
  }

  /**
   * 📊 Statistiques globales des utilisateurs (admin)
   */
  static async getGlobalStats() {
    try {
      const stats = await User.aggregate([
        {
          $facet: {
            // Statistiques par statut d'abonnement
            bySubscription: [
              { $match: { isActive: true } },
              { $group: { _id: "$subscriptionStatus", count: { $sum: 1 } } },
            ],

            // Statistiques par provider d'auth
            byAuthProvider: [
              { $match: { isActive: true } },
              { $group: { _id: "$authProvider", count: { $sum: 1 } } },
            ],

            // Utilisateurs créés par mois (12 derniers mois)
            createdByMonth: [
              {
                $match: {
                  createdAt: {
                    $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
                  },
                },
              },
              {
                $group: {
                  _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" },
                  },
                  count: { $sum: 1 },
                },
              },
              { $sort: { "_id.year": 1, "_id.month": 1 } },
            ],

            // Comptes verrouillés
            securityMetrics: [
              {
                $match: { isActive: true },
              },
              {
                $group: {
                  _id: null,
                  totalUsers: { $sum: 1 },
                  lockedUsers: {
                    $sum: {
                      $cond: [
                        { $gt: ["$security.accountLockedUntil", new Date()] },
                        1,
                        0,
                      ],
                    },
                  },
                  avgFailedAttempts: {
                    $avg: "$security.failedLoginAttempts",
                  },
                  maxFailedAttempts: {
                    $max: "$security.failedLoginAttempts",
                  },
                },
              },
            ],
          },
        },
      ]);

      return {
        timestamp: new Date(),
        ...stats[0],
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error(
        "Erreur lors de la récupération des statistiques globales",
        error,
        {
          action: "get_global_user_stats_failed",
        }
      );

      throw new SystemError(
        "Erreur lors de la récupération des statistiques globales",
        error
      );
    }
  }
}

export default UserService;
