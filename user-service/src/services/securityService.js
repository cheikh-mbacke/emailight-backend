// ============================================================================
// 📁 src/services/securityService.js - Gestion de la sécurité utilisateur
// ============================================================================

import User from "../models/User.js";
import I18nService from "./i18nService.js";
import { ErrorFactory, SystemError } from "../utils/customError.js";
import { USER_ERRORS } from "../utils/errorCodes.js";
import { SECURITY_INTERVALS } from "../constants/timeConstants.js";

class SecurityService {
  static setLogger(injectedLogger) {
    this.logger = injectedLogger;
  }

  /**
   * 🔒 Vérifie si le compte est verrouillé
   */
  static isAccountLocked(user) {
    return !!(
      user.security.accountLockedUntil &&
      user.security.accountLockedUntil > Date.now()
    );
  }

  /**
   * 📊 Obtient le score de sécurité
   */
  static getSecurityScore(user) {
    if (user.security.getSecurityScore) {
      return user.security.getSecurityScore();
    }

    // Fallback calculation if method not available
    let score = 100;
    score -= user.security.failedLoginAttempts * 5;
    if (this.isAccountLocked(user)) score -= 20;
    score -= user.security.reportCount * 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 🔐 Verrouille un compte utilisateur
   */
  static async lockAccount(
    userId,
    reason = "security_violation",
    duration = SECURITY_INTERVALS.ACCOUNT_LOCK_DURATION
  ) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw ErrorFactory.notFound(
          "Utilisateur introuvable",
          USER_ERRORS.USER_NOT_FOUND
        );
      }

      const lockUntil = new Date(Date.now() + duration);

      user.security.accountLockedUntil = lockUntil;
      user.security.lockReason = reason;
      user.security.lockedAt = new Date();

      await user.save();

      const userLanguage = I18nService.getUserLanguage(user);

      this.logger?.user(
        I18nService.getMessage("logs.accountLocked", userLanguage),
        {
          reason,
          lockUntil,
          duration: duration / 1000 / 60, // minutes
        },
        {
          userId: userId.toString(),
          email: user.email,
          action: "account_locked",
        }
      );

      return {
        locked: true,
        lockUntil,
        reason,
        lockedAt: new Date(),
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur lors du verrouillage du compte", error, {
        action: "lock_account_failed",
        userId: userId?.toString(),
      });

      throw new SystemError("Erreur lors du verrouillage du compte", error, {
        userId: userId?.toString(),
      });
    }
  }

  /**
   * 🔓 Déverrouille un compte utilisateur
   */
  static async unlockAccount(userId, reason = "manual_unlock") {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw ErrorFactory.notFound(
          "Utilisateur introuvable",
          USER_ERRORS.USER_NOT_FOUND
        );
      }

      const wasLocked = this.isAccountLocked(user);

      user.security.accountLockedUntil = null;
      user.security.lockReason = null;
      user.security.lockedAt = null;
      user.security.failedLoginAttempts = 0; // Reset failed attempts

      await user.save();

      const userLanguage = I18nService.getUserLanguage(user);

      this.logger?.user(
        I18nService.getMessage("logs.accountUnlocked", userLanguage),
        {
          reason,
          wasLocked,
        },
        {
          userId: userId.toString(),
          email: user.email,
          action: "account_unlocked",
        }
      );

      return {
        unlocked: true,
        wasLocked,
        reason,
        unlockedAt: new Date(),
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur lors du déverrouillage du compte", error, {
        action: "unlock_account_failed",
        userId: userId?.toString(),
      });

      throw new SystemError("Erreur lors du déverrouillage du compte", error, {
        userId: userId?.toString(),
      });
    }
  }

  /**
   * 📈 Incrémente les tentatives de connexion échouées
   */
  static async incrementFailedLoginAttempts(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw ErrorFactory.notFound(
          "Utilisateur introuvable",
          USER_ERRORS.USER_NOT_FOUND
        );
      }

      user.security.failedLoginAttempts =
        (user.security.failedLoginAttempts || 0) + 1;

      // Auto-lock if too many failed attempts
      if (user.security.failedLoginAttempts >= 5) {
        await this.lockAccount(userId, "too_many_failed_attempts");
        return {
          failedAttempts: user.security.failedLoginAttempts,
          accountLocked: true,
        };
      }

      await user.save();

      this.logger?.warn(
        "Failed login attempt recorded",
        {
          failedAttempts: user.security.failedLoginAttempts,
          email: user.email,
        },
        {
          userId: userId.toString(),
          action: "failed_login_attempt",
        }
      );

      return {
        failedAttempts: user.security.failedLoginAttempts,
        accountLocked: false,
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error(
        "Erreur lors de l'incrémentation des tentatives échouées",
        error,
        {
          action: "increment_failed_login_attempts_failed",
          userId: userId?.toString(),
        }
      );

      throw new SystemError(
        "Erreur lors de l'incrémentation des tentatives échouées",
        error,
        { userId: userId?.toString() }
      );
    }
  }

  /**
   * ✅ Réinitialise les tentatives de connexion échouées
   */
  static async resetFailedLoginAttempts(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw ErrorFactory.notFound(
          "Utilisateur introuvable",
          USER_ERRORS.USER_NOT_FOUND
        );
      }

      const hadFailedAttempts = user.security.failedLoginAttempts > 0;

      user.security.failedLoginAttempts = 0;
      await user.save();

      if (hadFailedAttempts) {
        this.logger?.info(
          "Failed login attempts reset",
          {
            email: user.email,
          },
          {
            userId: userId.toString(),
            action: "failed_login_attempts_reset",
          }
        );
      }

      return {
        reset: true,
        hadFailedAttempts,
        resetAt: new Date(),
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error(
        "Erreur lors de la réinitialisation des tentatives échouées",
        error,
        {
          action: "reset_failed_login_attempts_failed",
          userId: userId?.toString(),
        }
      );

      throw new SystemError(
        "Erreur lors de la réinitialisation des tentatives échouées",
        error,
        { userId: userId?.toString() }
      );
    }
  }

  /**
   * 🚨 Signale un utilisateur
   */
  static async reportUser(userId, reporterId, reason, details = null) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw ErrorFactory.notFound(
          "Utilisateur introuvable",
          USER_ERRORS.USER_NOT_FOUND
        );
      }

      user.security.reportCount = (user.security.reportCount || 0) + 1;
      user.security.reports = user.security.reports || [];

      user.security.reports.push({
        reporterId,
        reason,
        details,
        reportedAt: new Date(),
      });

      await user.save();

      this.logger?.warn(
        "User reported",
        {
          reportedUser: user.email,
          reporterId: reporterId?.toString(),
          reason,
          reportCount: user.security.reportCount,
        },
        {
          userId: userId.toString(),
          action: "user_reported",
        }
      );

      return {
        reported: true,
        reportCount: user.security.reportCount,
        reportedAt: new Date(),
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur lors du signalement de l'utilisateur", error, {
        action: "report_user_failed",
        userId: userId?.toString(),
        reporterId: reporterId?.toString(),
      });

      throw new SystemError(
        "Erreur lors du signalement de l'utilisateur",
        error,
        { userId: userId?.toString(), reporterId: reporterId?.toString() }
      );
    }
  }

  /**
   * 🧹 Déverrouille automatiquement les comptes expirés
   */
  static async unlockExpiredAccounts() {
    try {
      const result = await User.updateMany(
        {
          "security.accountLockedUntil": { $lt: new Date() },
        },
        {
          $unset: {
            "security.accountLockedUntil": 1,
            "security.lockReason": 1,
            "security.lockedAt": 1,
            "security.failedLoginAttempts": 1,
          },
        }
      );

      if (result.modifiedCount > 0) {
        this.logger?.info(
          "Expired accounts unlocked",
          {
            unlockedCount: result.modifiedCount,
          },
          {
            action: "expired_accounts_unlocked",
          }
        );
      }

      return {
        unlockedCount: result.modifiedCount,
        unlockedAt: new Date(),
      };
    } catch (error) {
      this.logger?.error("Erreur lors du déverrouillage automatique", error, {
        action: "unlock_expired_accounts_failed",
      });

      throw new SystemError(
        "Erreur lors du déverrouillage automatique des comptes",
        error
      );
    }
  }

  /**
   * 📊 Obtient les statistiques de sécurité
   */
  static async getSecurityStats() {
    try {
      const stats = await User.aggregate([
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
            avgSecurityScore: {
              $avg: {
                $subtract: [
                  100,
                  {
                    $add: [
                      { $multiply: ["$security.failedLoginAttempts", 5] },
                      { $multiply: ["$security.reportCount", 10] },
                    ],
                  },
                ],
              },
            },
            reportedUsers: {
              $sum: {
                $cond: [{ $gt: ["$security.reportCount", 0] }, 1, 0],
              },
            },
          },
        },
      ]);

      return {
        timestamp: new Date(),
        ...stats[0],
      };
    } catch (error) {
      this.logger?.error(
        "Erreur lors de la récupération des statistiques de sécurité",
        error,
        {
          action: "get_security_stats_failed",
        }
      );

      throw new SystemError(
        "Erreur lors de la récupération des statistiques de sécurité",
        error
      );
    }
  }

  /**
   * 🔍 Obtient l'historique de sécurité d'un utilisateur
   */
  static async getUserSecurityHistory(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw ErrorFactory.notFound(
          "Utilisateur introuvable",
          USER_ERRORS.USER_NOT_FOUND
        );
      }

      return {
        userId: user._id,
        email: user.email,
        security: {
          score: this.getSecurityScore(user),
          isLocked: this.isAccountLocked(user),
          failedLoginAttempts: user.security.failedLoginAttempts || 0,
          reportCount: user.security.reportCount || 0,
          accountLockedUntil: user.security.accountLockedUntil,
          lockReason: user.security.lockReason,
          lockedAt: user.security.lockedAt,
          reports: user.security.reports || [],
        },
        retrievedAt: new Date(),
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error(
        "Erreur lors de la récupération de l'historique de sécurité",
        error,
        {
          action: "get_user_security_history_failed",
          userId: userId?.toString(),
        }
      );

      throw new SystemError(
        "Erreur lors de la récupération de l'historique de sécurité",
        error,
        { userId: userId?.toString() }
      );
    }
  }
}

export default SecurityService;
