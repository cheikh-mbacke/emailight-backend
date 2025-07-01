// ============================================================================
// 📁 src/services/userService.js - User management service (MISE À JOUR)
// ============================================================================

import User from "../models/User.js";
import EmailAccount from "../models/EmailAccount.js";
import FileUploadService from "./fileUploadService.js";
import {
  NotFoundError,
  ValidationError,
  SystemError,
} from "../utils/customError.js";
import { USER_ERRORS, EMAIL_ACCOUNT_ERRORS } from "../utils/errorCodes.js";

/**
 * 👤 User service
 */
class UserService {
  // ✅ Injection du logger
  static setLogger(injectedLogger) {
    this.logger = injectedLogger;
    // Injecter le logger dans le service de fichiers aussi
    FileUploadService.setLogger(injectedLogger);
  }

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
        throw new NotFoundError(
          "Utilisateur introuvable",
          USER_ERRORS.USER_NOT_FOUND
        );
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
      if (error.isOperational) {
        throw error;
      }

      this.logger.error(
        "Erreur lors de la récupération du profil utilisateur",
        error,
        {
          action: "get_user_profile_failed",
          userId: userId?.toString(),
        }
      );

      throw new SystemError("Erreur lors de la récupération du profil", error, {
        userId: userId?.toString(),
      });
    }
  }

  /**
   * Update a user's name
   */
  static async updateUserName(userId, name) {
    try {
      if (!name || name.trim().length === 0) {
        throw new ValidationError(
          "Le nom ne peut pas être vide",
          USER_ERRORS.INVALID_NAME
        );
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { name: name.trim() },
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new NotFoundError(
          "Utilisateur introuvable",
          USER_ERRORS.USER_NOT_FOUND
        );
      }

      this.logger.user(
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
      if (error.isOperational) {
        throw error;
      }

      this.logger.error("Erreur lors de la mise à jour du nom", error, {
        action: "update_name_failed",
        userId: userId?.toString(),
      });

      throw new SystemError("Erreur lors de la mise à jour du nom", error, {
        userId: userId?.toString(),
      });
    }
  }

  /**
   * 🖼️ Upload and update user avatar
   */
  static async updateUserAvatar(userId, fileData, request = null) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new NotFoundError(
          "Utilisateur introuvable",
          USER_ERRORS.USER_NOT_FOUND
        );
      }

      // Sauvegarder l'ancien avatar pour suppression
      const oldAvatarUrl = user.profilePictureUrl;

      // 🔥 CONSTRUIRE L'URL DE BASE depuis la requête
      let baseUrl = "http://localhost:3001"; // fallback

      if (request) {
        const protocol = request.headers["x-forwarded-proto"] || "http";
        const host = request.headers.host || "localhost:3001";
        baseUrl = `${protocol}://${host}`;
      }

      // Upload du nouvel avatar avec baseUrl
      const uploadResult = await FileUploadService.uploadAvatar(
        userId,
        fileData,
        baseUrl
      );

      // Mettre à jour l'URL de l'avatar en base
      user.profilePictureUrl = uploadResult.avatarUrl;
      await user.save();

      // Supprimer l'ancien avatar si il existait et n'était pas une URL externe
      if (oldAvatarUrl && oldAvatarUrl.includes("/uploads/")) {
        try {
          await FileUploadService.deleteAvatar(oldAvatarUrl);
        } catch (deleteError) {
          // Log mais ne pas faire échouer l'upload
          this.logger.warn(
            "Impossible de supprimer l'ancien avatar",
            deleteError,
            {
              userId: userId.toString(),
              oldAvatarUrl,
            }
          );
        }
      }

      this.logger.user(
        "Avatar mis à jour",
        {
          fileName: uploadResult.fileName,
          fileSize: uploadResult.fileSize,
          oldAvatarUrl: oldAvatarUrl,
          newAvatarUrl: uploadResult.avatarUrl,
        },
        {
          userId: userId.toString(),
          email: user.email,
          action: "avatar_updated",
        }
      );

      return {
        user: user.profile,
        avatar: {
          url: uploadResult.avatarUrl,
          fileName: uploadResult.fileName,
          fileSize: uploadResult.fileSize,
          uploadedAt: uploadResult.uploadedAt,
        },
        updated: true,
        updatedAt: new Date(),
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger.error("Erreur lors de la mise à jour de l'avatar", error, {
        action: "update_avatar_failed",
        userId: userId?.toString(),
      });

      throw new SystemError(
        "Erreur lors de la mise à jour de l'avatar",
        error,
        {
          userId: userId?.toString(),
        }
      );
    }
  }
  /**
   * 🗑️ Delete user avatar
   */
  static async deleteUserAvatar(userId) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new NotFoundError(
          "Utilisateur introuvable",
          USER_ERRORS.USER_NOT_FOUND
        );
      }

      if (!user.profilePictureUrl) {
        return {
          deleted: false,
          reason: "Aucun avatar à supprimer",
        };
      }

      const avatarUrl = user.profilePictureUrl;

      // Supprimer le fichier si c'est un upload local
      if (avatarUrl.startsWith("/uploads/")) {
        await FileUploadService.deleteAvatar(avatarUrl);
      }

      // Supprimer l'URL de la base de données
      user.profilePictureUrl = null;
      await user.save();

      this.logger.user(
        "Avatar supprimé",
        { avatarUrl },
        {
          userId: userId.toString(),
          email: user.email,
          action: "avatar_deleted",
        }
      );

      return {
        deleted: true,
        deletedAvatar: avatarUrl,
        deletedAt: new Date(),
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger.error("Erreur lors de la suppression de l'avatar", error, {
        action: "delete_avatar_failed",
        userId: userId?.toString(),
      });

      throw new SystemError(
        "Erreur lors de la suppression de l'avatar",
        error,
        {
          userId: userId?.toString(),
        }
      );
    }
  }

  /**
   * 🗑️ Delete user account and all associated data (GDPR)
   */
  static async deleteUserAccount(userId) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new NotFoundError(
          "Utilisateur introuvable",
          USER_ERRORS.USER_NOT_FOUND
        );
      }

      const userEmail = user.email;
      const userAvatarUrl = user.profilePictureUrl;

      // 1. Supprimer tous les comptes email connectés
      const emailAccountsResult = await EmailAccount.deleteMany({ userId });

      // 2. Supprimer l'avatar si il existe
      if (userAvatarUrl && userAvatarUrl.startsWith("/uploads/")) {
        try {
          await FileUploadService.deleteAvatar(userAvatarUrl);
        } catch (avatarError) {
          this.logger.warn(
            "Impossible de supprimer l'avatar lors de la suppression du compte",
            avatarError
          );
        }
      }

      // 3. Supprimer l'utilisateur
      await User.findByIdAndDelete(userId);

      this.logger.user(
        "Compte utilisateur supprimé définitivement",
        {
          email: userEmail,
          emailAccountsDeleted: emailAccountsResult.deletedCount,
          avatarDeleted: !!userAvatarUrl,
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
          avatar: !!userAvatarUrl,
          preferences: true,
          security: true,
        },
        gdprCompliant: true,
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger.error(
        "Erreur lors de la suppression définitive du compte",
        error,
        {
          action: "permanent_account_deletion_failed",
          userId: userId?.toString(),
        }
      );

      throw new SystemError(
        "Erreur lors de la suppression définitive du compte",
        error,
        {
          userId: userId?.toString(),
        }
      );
    }
  }

  /**
   * Get user usage statistics
   */
  static async getUserStats(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError(
          "Utilisateur introuvable",
          USER_ERRORS.USER_NOT_FOUND
        );
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
      if (error.isOperational) {
        throw error;
      }

      this.logger.error(
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
      this.logger.error(
        "Erreur lors de la récupération des comptes email",
        error,
        {
          action: "get_email_accounts_failed",
          userId: userId?.toString(),
        }
      );

      throw new SystemError(
        "Erreur lors de la récupération des comptes email",
        error,
        { userId: userId?.toString() }
      );
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
        throw new NotFoundError(
          "Ce compte email n'existe pas ou ne vous appartient pas",
          EMAIL_ACCOUNT_ERRORS.EMAIL_ACCOUNT_NOT_FOUND
        );
      }

      // Delete account
      await EmailAccount.findByIdAndDelete(accountId);

      // Remove from user's list
      await User.findByIdAndUpdate(userId, {
        $pull: { connectedEmailAccounts: accountId },
      });

      this.logger.user(
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
      if (error.isOperational) {
        throw error;
      }

      this.logger.error(
        "Erreur lors de la déconnexion du compte email",
        error,
        {
          action: "disconnect_email_account_failed",
          userId: userId?.toString(),
          accountId: accountId?.toString(),
        }
      );

      throw new SystemError("Erreur lors de la déconnexion du compte", error, {
        userId: userId?.toString(),
        accountId: accountId?.toString(),
      });
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
        throw new NotFoundError(
          "Ce compte email n'existe pas ou ne vous appartient pas",
          EMAIL_ACCOUNT_ERRORS.EMAIL_ACCOUNT_NOT_FOUND
        );
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
      if (error.isOperational) {
        throw error;
      }

      this.logger.error("Erreur lors du test de santé du compte email", error, {
        action: "email_account_health_check_failed",
        userId: userId?.toString(),
        accountId: accountId?.toString(),
      });

      throw new SystemError("Erreur lors du test de santé du compte", error, {
        userId: userId?.toString(),
        accountId: accountId?.toString(),
      });
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
        this.logger.user(
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
      this.logger.error("Erreur lors du nettoyage des comptes email", error, {
        action: "email_accounts_cleanup_failed",
        userId: userId?.toString(),
      });

      throw new SystemError("Erreur lors du nettoyage des comptes", error, {
        userId: userId?.toString(),
      });
    }
  }
}

export default UserService;
