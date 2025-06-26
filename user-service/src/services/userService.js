// ============================================================================
// 📁 src/services/userService.js - User management service
// ============================================================================

const User = require("../models/User");
const EmailAccount = require("../models/EmailAccount");
const { logger } = require("../utils/logger");

/**
 * 👤 User service
 */
class UserService {
  /**
   * Get full user profile
   */
  static async getUserProfile(userId) {
    try {
      const user = await User.findById(userId).populate(
        "connectedEmailAccounts",
        "email provider isActive lastUsed emailsSent healthStatus"
      );

      if (!user) {
        const error = new Error("Utilisateur introuvable");
        error.statusCode = 404;
        error.code = "USER_NOT_FOUND";
        throw error;
      }

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
          canSendEmail: user.canSendEmail(),
          emailsSentToday: user.security.emailsSentToday,
        },
        connectedAccounts: user.connectedEmailAccounts,
        stats: {
          accountCreatedAt: user.createdAt,
          totalConnectedAccounts: user.connectedEmailAccounts.length,
          isActive: user.isActive,
        },
      };
    } catch (error) {
      if (error.statusCode) throw error;

      logger.error(
        "Erreur lors de la récupération du profil utilisateur",
        error,
        {
          action: "get_user_profile_failed",
          userId: userId?.toString(),
        }
      );

      const serviceError = new Error(
        "Erreur lors de la récupération du profil"
      );
      serviceError.statusCode = 500;
      throw serviceError;
    }
  }

  /**
   * Update a user's name
   */
  static async updateUserName(userId, name) {
    try {
      if (!name || name.trim().length === 0) {
        const error = new Error("Le nom ne peut pas être vide");
        error.statusCode = 400;
        error.code = "INVALID_NAME";
        throw error;
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { name: name.trim() },
        { new: true, runValidators: true }
      );

      if (!user) {
        const error = new Error("Utilisateur introuvable");
        error.statusCode = 404;
        throw error;
      }

      logger.user(
        "Nom utilisateur mis à jour",
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
      if (error.statusCode) throw error;

      logger.error("Erreur lors de la mise à jour du nom", error, {
        action: "update_name_failed",
        userId: userId?.toString(),
      });

      const serviceError = new Error("Erreur lors de la mise à jour du nom");
      serviceError.statusCode = 500;
      throw serviceError;
    }
  }

  /**
   * Get user usage statistics
   */
  static async getUserStats(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        const error = new Error("Utilisateur introuvable");
        error.statusCode = 404;
        throw error;
      }

      // Stats from connected email accounts
      const emailAccounts = await EmailAccount.find({ userId });

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

      const dailyLimits = {
        free: 50,
        premium: 500,
        enterprise: 5000,
      };

      return {
        user: {
          memberSince: user.createdAt,
          lastActive: user.lastActiveAt,
          subscriptionStatus: user.subscriptionStatus,
          isEmailVerified: user.isEmailVerified,
        },
        usage: {
          emailsSentToday: user.security.emailsSentToday,
          dailyLimit: dailyLimits[user.subscriptionStatus],
          remainingEmails: Math.max(
            0,
            dailyLimits[user.subscriptionStatus] - user.security.emailsSentToday
          ),
          canSendEmail: user.canSendEmail(),
        },
        emailAccounts: emailStats,
        security: {
          failedLoginAttempts: user.security.failedLoginAttempts,
          isAccountLocked: user.isAccountLocked(),
          lastPasswordChange: user.security.passwordChangedAt,
        },
      };
    } catch (error) {
      if (error.statusCode) throw error;

      logger.error("Erreur lors de la récupération des statistiques", error, {
        action: "get_user_stats_failed",
        userId: userId?.toString(),
      });

      const serviceError = new Error(
        "Erreur lors de la récupération des statistiques"
      );
      serviceError.statusCode = 500;
      throw serviceError;
    }
  }

  /**
   * Get connected email accounts for a user
   */
  static async getUserEmailAccounts(userId, filters = {}) {
    try {
      const { active, provider } = filters;

      let query = { userId };

      if (active !== undefined) {
        query.isActive = active;
      }

      if (provider) {
        query.provider = provider;
      }

      const emailAccounts = await EmailAccount.find(query)
        .select("-accessToken -refreshToken")
        .sort({ lastUsed: -1 });

      const accounts = emailAccounts.map((account) => account.secureInfo);

      return {
        accounts,
        total: accounts.length,
        summary: {
          active: accounts.filter((acc) => acc.isActive).length,
          healthy: accounts.filter((acc) => acc.healthStatus === "healthy")
            .length,
          needsAttention: accounts.filter((acc) =>
            ["token_expired", "errors"].includes(acc.healthStatus)
          ).length,
        },
      };
    } catch (error) {
      logger.error("Erreur lors de la récupération des comptes email", error, {
        action: "get_email_accounts_failed",
        userId: userId?.toString(),
      });

      const serviceError = new Error(
        "Erreur lors de la récupération des comptes email"
      );
      serviceError.statusCode = 500;
      throw serviceError;
    }
  }

  /**
   * Disconnect an email account
   */
  static async disconnectEmailAccount(userId, accountId) {
    try {
      const emailAccount = await EmailAccount.findOne({
        _id: accountId,
        userId: userId,
      });

      if (!emailAccount) {
        const error = new Error(
          "Ce compte email n'existe pas ou ne vous appartient pas"
        );
        error.statusCode = 404;
        error.code = "EMAIL_ACCOUNT_NOT_FOUND";
        throw error;
      }

      // Delete account
      await EmailAccount.findByIdAndDelete(accountId);

      // Remove from user's list
      await User.findByIdAndUpdate(userId, {
        $pull: { connectedEmailAccounts: accountId },
      });

      logger.user(
        "Compte email déconnecté",
        {
          email: emailAccount.email,
          provider: emailAccount.provider,
        },
        {
          userId: userId.toString(),
          action: "email_account_disconnected",
        }
      );

      return {
        disconnectedAccount: {
          email: emailAccount.email,
          provider: emailAccount.provider,
        },
        disconnectedAt: new Date(),
      };
    } catch (error) {
      if (error.statusCode) throw error;

      logger.error("Erreur lors de la déconnexion du compte email", error, {
        action: "disconnect_email_account_failed",
        userId: userId?.toString(),
        accountId: accountId?.toString(),
      });

      const serviceError = new Error("Erreur lors de la déconnexion du compte");
      serviceError.statusCode = 500;
      throw serviceError;
    }
  }

  /**
   * Check the health of an email account
   */
  static async checkEmailAccountHealth(userId, accountId) {
    try {
      const emailAccount = await EmailAccount.findOne({
        _id: accountId,
        userId: userId,
      });

      if (!emailAccount) {
        const error = new Error(
          "Ce compte email n'existe pas ou ne vous appartient pas"
        );
        error.statusCode = 404;
        error.code = "EMAIL_ACCOUNT_NOT_FOUND";
        throw error;
      }

      // Health diagnostics
      const health = {
        status: emailAccount.healthStatus,
        isActive: emailAccount.isActive,
        isTokenExpired: emailAccount.isTokenExpired(),
        errorCount: emailAccount.errorCount,
        lastError: emailAccount.lastError,
        lastUsed: emailAccount.lastUsed,
        recommendations: [],
      };

      if (health.isTokenExpired) {
        health.recommendations.push("Token expiré - reconnexion nécessaire");
      }
      if (health.errorCount >= 5) {
        health.recommendations.push(
          "Trop d'erreurs - vérifier la configuration"
        );
      }
      if (
        !health.lastUsed ||
        Date.now() - health.lastUsed.getTime() > 30 * 24 * 60 * 60 * 1000
      ) {
        health.recommendations.push("Compte non utilisé depuis 30 jours");
      }

      return {
        account: {
          email: emailAccount.email,
          provider: emailAccount.provider,
        },
        health,
      };
    } catch (error) {
      if (error.statusCode) throw error;

      logger.error("Erreur lors du test de santé du compte email", error, {
        action: "email_account_health_check_failed",
        userId: userId?.toString(),
        accountId: accountId?.toString(),
      });

      const serviceError = new Error("Erreur lors du test de santé du compte");
      serviceError.statusCode = 500;
      throw serviceError;
    }
  }

  /**
   * Cleanup inactive email accounts (maintenance task)
   */
  static async cleanupInactiveEmailAccounts(userId) {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const result = await EmailAccount.updateMany(
        {
          userId,
          $or: [
            { tokenExpiry: { $lt: thirtyDaysAgo } },
            { errorCount: { $gte: 10 } },
            { lastUsed: { $lt: thirtyDaysAgo } },
          ],
        },
        {
          $set: { isActive: false },
        }
      );

      if (result.modifiedCount > 0) {
        logger.user(
          "Comptes email inactifs nettoyés",
          {
            accountsDeactivated: result.modifiedCount,
          },
          {
            userId: userId.toString(),
            action: "email_accounts_cleanup",
          }
        );
      }

      return {
        accountsDeactivated: result.modifiedCount,
        cleanupDate: new Date(),
      };
    } catch (error) {
      logger.error("Erreur lors du nettoyage des comptes email", error, {
        action: "email_accounts_cleanup_failed",
        userId: userId?.toString(),
      });

      const serviceError = new Error("Erreur lors du nettoyage des comptes");
      serviceError.statusCode = 500;
      throw serviceError;
    }
  }
}

module.exports = UserService;
