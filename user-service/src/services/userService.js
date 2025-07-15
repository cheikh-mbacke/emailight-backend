// ============================================================================
// src/services/userService.js - User management service (CORRIGÉ)
// ============================================================================

import mongoose from "mongoose";
import User from "../models/User.js";
import EmailAccount from "../models/EmailAccount.js";
import QuotaService from "./quotaService.js";
import AvatarService from "./avatarService.js";
import I18nService from "./i18nService.js";

// ✅ CORRECTION 1: Import du bon système d'erreurs
import {
  ErrorFactory,
  NotFoundError,
  ValidationError,
  SystemError,
  ConflictError,
} from "../utils/customError.js";

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

  /**
   * 🖼️ Upload et mise à jour de l'avatar utilisateur
   */
  static async updateUserAvatar(userId, fileData, request = null) {
    try {
      this.validateObjectId(userId);

      const user = await User.findById(userId);
      if (!user) {
        throw ErrorFactory.notFound(
          "Utilisateur introuvable",
          USER_ERRORS.USER_NOT_FOUND
        );
      }

      const userLanguage = I18nService.getUserLanguage(user);
      const oldAvatarUrl = user.profilePictureUrl;

      // Build base URL from request
      const baseUrl = this.buildBaseUrl(request);

      // Upload via AvatarService
      const uploadResult = await AvatarService.uploadAvatar(
        userId,
        fileData,
        baseUrl
      );

      // Update avatar URL in database
      user.profilePictureUrl = uploadResult.avatarUrl;
      await user.save();

      // Delete old avatar if it existed
      if (oldAvatarUrl) {
        try {
          await AvatarService.deleteAvatar(oldAvatarUrl);
        } catch (deleteError) {
          // Log but don't fail the upload
          this.logger?.warn(
            I18nService.getMessage("logs.oldAvatarDeleteFailed", userLanguage),
            deleteError,
            {
              userId: userId.toString(),
              oldAvatarUrl,
            }
          );
        }
      }

      this.logger?.user(
        I18nService.getMessage("logs.avatarUpdated", userLanguage),
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
        avatar: uploadResult,
        updated: true,
        updatedAt: new Date(),
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur lors de la mise à jour de l'avatar", error, {
        action: "update_user_avatar_failed",
        userId: userId?.toString(),
      });

      throw new SystemError(
        "Erreur lors de la mise à jour de l'avatar",
        error,
        { userId: userId?.toString() }
      );
    }
  }

  /**
   * 🗑️ Supprime l'avatar d'un utilisateur
   */
  static async deleteUserAvatar(userId) {
    try {
      this.validateObjectId(userId);

      const user = await User.findById(userId);
      if (!user) {
        throw ErrorFactory.notFound(
          "Utilisateur introuvable",
          USER_ERRORS.USER_NOT_FOUND
        );
      }

      const userLanguage = I18nService.getUserLanguage(user);

      if (!user.profilePictureUrl) {
        return {
          deleted: false,
          reason: I18nService.getMessage("user.noAvatar", userLanguage),
        };
      }

      const avatarUrl = user.profilePictureUrl;

      // Delete via AvatarService
      const deleteResult = await AvatarService.deleteAvatar(avatarUrl);

      if (deleteResult.deleted) {
        // Remove URL from database
        user.profilePictureUrl = null;
        await user.save();

        this.logger?.user(
          I18nService.getMessage("logs.avatarDeleted", userLanguage),
          { avatarUrl },
          {
            userId: userId.toString(),
            email: user.email,
            action: "avatar_deleted",
          }
        );
      }

      return {
        ...deleteResult,
        deletedAt: new Date(),
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur lors de la suppression de l'avatar", error, {
        action: "delete_user_avatar_failed",
        userId: userId?.toString(),
      });

      throw new SystemError(
        "Erreur lors de la suppression de l'avatar",
        error,
        { userId: userId?.toString() }
      );
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
  // 📧 GESTION DES COMPTES EMAIL
  // ==========================================

  /**
   * 📧 Liste des comptes email connectés
   */
  static async getUserEmailAccounts(userId, filters = {}) {
    try {
      this.validateObjectId(userId);

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
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error(
        "Erreur lors de la récupération des comptes email",
        error,
        {
          action: "get_user_email_accounts_failed",
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
   * 🔌 Déconnecte un compte email
   */
  static async disconnectEmailAccount(userId, accountId) {
    try {
      this.validateObjectId(userId);
      this.validateObjectId(accountId);

      const session = await mongoose.startSession();

      try {
        return await session.withTransaction(async () => {
          const emailAccount = await EmailAccount.findOne({
            _id: accountId,
            userId: userId,
          }).session(session);

          if (!emailAccount) {
            throw ErrorFactory.notFound(
              "Compte email introuvable",
              EMAIL_ACCOUNT_ERRORS.EMAIL_ACCOUNT_NOT_FOUND
            );
          }

          // Delete account
          await EmailAccount.findByIdAndDelete(accountId, { session });

          // Remove from user's list
          await User.findByIdAndUpdate(
            userId,
            { $pull: { connectedEmailAccounts: accountId } },
            { session }
          );

          const user = await User.findById(userId).session(session);
          const userLanguage = I18nService.getUserLanguage(user);

          this.logger?.user(
            I18nService.getMessage(
              "logs.emailAccountDisconnected",
              userLanguage
            ),
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
        });
      } finally {
        await session.endSession();
      }
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error(
        "Erreur lors de la déconnexion du compte email",
        error,
        {
          action: "disconnect_email_account_failed",
          userId: userId?.toString(),
          accountId: accountId?.toString(),
        }
      );

      throw new SystemError(
        "Erreur lors de la déconnexion du compte email",
        error,
        { userId: userId?.toString(), accountId: accountId?.toString() }
      );
    }
  }

  /**
   * 🏥 Vérification de santé d'un compte email
   */
  static async checkEmailAccountHealth(userId, accountId) {
    try {
      this.validateObjectId(userId);
      this.validateObjectId(accountId);

      const emailAccount = await EmailAccount.findOne({
        _id: accountId,
        userId: userId,
      });

      if (!emailAccount) {
        throw ErrorFactory.notFound(
          "Compte email introuvable",
          EMAIL_ACCOUNT_ERRORS.EMAIL_ACCOUNT_NOT_FOUND
        );
      }

      const user = await User.findById(userId);
      const userLanguage = I18nService.getUserLanguage(user);

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

      // Generate recommendations
      if (health.isTokenExpired) {
        health.recommendations.push(
          I18nService.getMessage("health.tokenExpired", userLanguage)
        );
      }
      if (health.errorCount >= 5) {
        health.recommendations.push(
          I18nService.getMessage("health.tooManyErrors", userLanguage)
        );
      }
      if (
        TIME_HELPERS.isExpired(
          health.lastUsed,
          SECURITY_INTERVALS.LAST_USED_WARNING_THRESHOLD
        )
      ) {
        health.recommendations.push(
          I18nService.getMessage("health.notUsedRecently", userLanguage)
        );
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

      this.logger?.error("Erreur lors de la vérification de santé", error, {
        action: "check_email_account_health_failed",
        userId: userId?.toString(),
        accountId: accountId?.toString(),
      });

      throw new SystemError(
        "Erreur lors de la vérification de santé du compte email",
        error,
        { userId: userId?.toString(), accountId: accountId?.toString() }
      );
    }
  }

  /**
   * 🧹 Nettoyage des comptes email inactifs
   */
  static async cleanupInactiveEmailAccounts(userId) {
    try {
      this.validateObjectId(userId);

      const inactiveThreshold = new Date(
        Date.now() - SECURITY_INTERVALS.INACTIVE_ACCOUNT_THRESHOLD
      );

      const result = await EmailAccount.updateMany(
        {
          userId,
          $or: [
            { tokenExpiry: { $lt: inactiveThreshold } },
            { errorCount: { $gte: 10 } },
            { lastUsed: { $lt: inactiveThreshold } },
          ],
        },
        {
          $set: { isActive: false },
        }
      );

      if (result.modifiedCount > 0) {
        const user = await User.findById(userId);
        const userLanguage = I18nService.getUserLanguage(user);

        this.logger?.user(
          I18nService.getMessage("logs.accountsCleaned", userLanguage),
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
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur lors du nettoyage des comptes", error, {
        action: "cleanup_inactive_email_accounts_failed",
        userId: userId?.toString(),
      });

      throw new SystemError(
        "Erreur lors du nettoyage des comptes email inactifs",
        error,
        { userId: userId?.toString() }
      );
    }
  }

  // ==========================================
  // 🔐 LOGIQUE MÉTIER SÉCURITÉ (simplifiée)
  // ==========================================

  /**
   * Vérifie si le compte est verrouillé
   */
  static isAccountLocked(user) {
    return !!(
      user.security.accountLockedUntil &&
      user.security.accountLockedUntil > Date.now()
    );
  }

  /**
   * Obtient le score de sécurité
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

  // ==========================================
  // 🔧 MÉTHODES UTILITAIRES PRIVÉES
  // ==========================================

  /**
   * Valide un ObjectId MongoDB
   */
  static validateObjectId(id, fieldName = "ID") {
    if (!id || typeof id !== "string") {
      throw ErrorFactory.validation(`${fieldName} est requis`, {
        field: fieldName.toLowerCase(),
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ErrorFactory.validation(`Format ${fieldName} invalide`, {
        field: fieldName.toLowerCase(),
        provided: id,
      });
    }
  }

  /**
   * Valide un nom d'utilisateur
   */
  static validateName(name) {
    if (!name || typeof name !== "string") {
      throw ErrorFactory.validation("Le nom est requis", { field: "name" });
    }

    const trimmedName = name.trim();

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      throw ErrorFactory.validation(
        "Le nom doit contenir entre 2 et 100 caractères",
        {
          field: "name",
          minLength: 2,
          maxLength: 100,
          provided: trimmedName.length,
        }
      );
    }

    // Validation de caractères (optionnelle - selon vos besoins)
    if (!/^[a-zA-ZÀ-ÿ\s\-']+$/.test(trimmedName)) {
      throw ErrorFactory.validation(
        "Le nom contient des caractères invalides",
        {
          field: "name",
          allowedPattern: "lettres, espaces, tirets, apostrophes",
        }
      );
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
  // 🔍 MÉTHODES DE RECHERCHE STATIQUES
  // ==========================================

  /**
   * Trouve un utilisateur par Google ID
   */
  static async findByGoogleId(googleId) {
    try {
      if (!googleId) {
        throw ErrorFactory.validation("Google ID est requis", {
          field: "googleId",
        });
      }

      return await User.findOne({ googleId, isActive: true });
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur lors de la recherche par Google ID", error, {
        action: "find_user_by_google_id_failed",
        googleId,
      });

      throw new SystemError("Erreur lors de la recherche utilisateur", error, {
        googleId,
      });
    }
  }

  /**
   * Trouve un utilisateur par email pour liaison OAuth
   */
  static async findForOAuthLinking(email) {
    try {
      if (!email) {
        throw ErrorFactory.validation("Email est requis", { field: "email" });
      }

      return await User.findOne({
        email: email.toLowerCase().trim(),
        isActive: true,
      });
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error(
        "Erreur lors de la recherche pour liaison OAuth",
        error,
        {
          action: "find_user_for_oauth_linking_failed",
          email: email?.toLowerCase(),
        }
      );

      throw new SystemError("Erreur lors de la recherche utilisateur", error, {
        email: email?.toLowerCase(),
      });
    }
  }

  /**
   * Trouve un utilisateur par ID avec gestion d'erreur
   */
  static async findById(userId) {
    try {
      this.validateObjectId(userId, "User ID");

      const user = await User.findById(userId);
      if (!user) {
        throw ErrorFactory.notFound(
          "Utilisateur introuvable",
          USER_ERRORS.USER_NOT_FOUND
        );
      }

      return user;
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur lors de la recherche par ID", error, {
        action: "find_user_by_id_failed",
        userId: userId?.toString(),
      });

      throw new SystemError("Erreur lors de la recherche utilisateur", error, {
        userId: userId?.toString(),
      });
    }
  }

  /**
   * Trouve un utilisateur par email
   */
  static async findByEmail(email) {
    try {
      if (!email) {
        throw ErrorFactory.validation("Email est requis", { field: "email" });
      }

      return await User.findOne({
        email: email.toLowerCase().trim(),
        isActive: true,
      });
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur lors de la recherche par email", error, {
        action: "find_user_by_email_failed",
        email: email?.toLowerCase(),
      });

      throw new SystemError("Erreur lors de la recherche utilisateur", error, {
        email: email?.toLowerCase(),
      });
    }
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

  /**
   * 🧹 Nettoyage global des données utilisateur
   */
  static async performMaintenance() {
    try {
      const maintenanceResults = {
        timestamp: new Date(),
        tasks: {},
      };

      // 1. Reset daily quotas
      try {
        const quotaReset = await QuotaService.resetDailyQuota();
        maintenanceResults.tasks.quotaReset = {
          success: true,
          resetCount: quotaReset.resetCount,
        };
      } catch (quotaError) {
        maintenanceResults.tasks.quotaReset = {
          success: false,
          error: quotaError.message,
        };
      }

      // 2. Cleanup orphaned avatar files
      try {
        const avatarCleanup = await AvatarService.cleanupOrphanedFiles();
        maintenanceResults.tasks.avatarCleanup = {
          success: true,
          ...avatarCleanup,
        };
      } catch (avatarError) {
        maintenanceResults.tasks.avatarCleanup = {
          success: false,
          error: avatarError.message,
        };
      }

      // 3. Cleanup expired tokens
      try {
        const now = new Date();
        const tokenCleanup = await User.updateMany(
          {
            $or: [
              { emailVerificationExpires: { $lt: now } },
              { passwordResetExpires: { $lt: now } },
            ],
          },
          {
            $unset: {
              emailVerificationToken: 1,
              emailVerificationExpires: 1,
              passwordResetToken: 1,
              passwordResetExpires: 1,
            },
          }
        );

        maintenanceResults.tasks.tokenCleanup = {
          success: true,
          cleanedTokens: tokenCleanup.modifiedCount,
        };
      } catch (tokenError) {
        maintenanceResults.tasks.tokenCleanup = {
          success: false,
          error: tokenError.message,
        };
      }

      // 4. Unlock expired accounts
      try {
        const accountUnlock = await User.updateMany(
          {
            "security.accountLockedUntil": { $lt: new Date() },
          },
          {
            $unset: {
              "security.accountLockedUntil": 1,
              "security.failedLoginAttempts": 1,
            },
          }
        );

        maintenanceResults.tasks.accountUnlock = {
          success: true,
          unlockedAccounts: accountUnlock.modifiedCount,
        };
      } catch (unlockError) {
        maintenanceResults.tasks.accountUnlock = {
          success: false,
          error: unlockError.message,
        };
      }

      this.logger?.info(
        "User service maintenance completed",
        maintenanceResults,
        { action: "user_service_maintenance_completed" }
      );

      return maintenanceResults;
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur lors de la maintenance", error, {
        action: "perform_user_service_maintenance_failed",
      });

      throw new SystemError(
        "Erreur lors de la maintenance du service utilisateur",
        error
      );
    }
  }
}

export default UserService;
