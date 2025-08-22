// ============================================================================
// 📁 authService.js - Corrections des problèmes identifiés
// ============================================================================

import User from "../models/User.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../config/env.js";
import {
  ConflictError,
  AuthError,
  NotFoundError,
  SystemError,
  ValidationError,
} from "../utils/customError.js";
import { AUTH_ERRORS, USER_ERRORS } from "../utils/errorCodes.js";
import TokenBlacklistService from "./tokenBlacklistService.js";
import EmailAccount from "../models/EmailAccount.js";
import fs from "fs/promises";
import path from "path";
import I18nService from "./i18nService.js";
import SecurityService from "./securityService.js";

// 🌍 Langue par défaut pour les erreurs système
let defaultLanguage = "FR";

/**
 * 🔐 Authentication service
 */
class AuthService {
  static setLogger(injectedLogger) {
    this.logger = injectedLogger;
  }

  /**
   * 🌍 Définir la langue par défaut pour les erreurs
   */
  static setLanguage(language) {
    defaultLanguage = language;
  }

  /**
   * Register a new user
   * ✅ CORRIGÉ: Validation déléguée au middleware Joi
   */
  static async registerUser(userData, language = defaultLanguage) {
    // ✅ FIX: Validation déjà effectuée par le middleware Joi
    // Les données sont déjà validées, nettoyées et typées
    const { name, email, password } = userData;

    try {
      // ✅ FIX: Race condition résolue - utilisation de l'index unique MongoDB
      // MongoDB garantit l'atomicité avec l'index unique sur email
      // Si deux requêtes simultanées tentent de créer le même email,
      // MongoDB rejettera automatiquement la seconde avec une erreur de duplicata

      const user = new User({
        name,
        email,
        password,
        authProvider: "email",
      });

      await user.save();

      this.logger.auth(
        "Nouvel utilisateur créé",
        { email: user.email, userId: user._id },
        { userId: user._id.toString(), action: "user_registered" }
      );

      return { user: user.profile, isNew: true };
    } catch (error) {
      // Gestion spécifique de l'erreur de duplicata MongoDB
      if (error.code === 11000 || error.name === "MongoServerError") {
        // Index unique violation - utilisateur existe déjà
        throw new ConflictError(
          I18nService.getMessage("auth.user_exists", language),
          AUTH_ERRORS.USER_EXISTS
        );
      }

      if (error.isOperational) {
        throw error;
      }

      this.logger.error("Erreur lors de la création d'utilisateur", error, {
        action: "user_registration_failed",
        email: email?.toLowerCase(),
      });

      throw new SystemError("Erreur lors de la création du compte", error, {
        email: email?.toLowerCase(),
      });
    }
  }

  /**
   * Authenticate a user
   * ✅ CORRIGÉ: Validation déléguée au middleware Joi
   */
  static async authenticateUser(credentials, language = defaultLanguage) {
    // ✅ FIX: Validation déjà effectuée par le middleware Joi
    // Les données sont déjà validées, nettoyées et typées
    const { email, password } = credentials;

    try {
      // Find user with password
      const user = await User.findOne({ email: email.toLowerCase() }).select(
        "+password"
      );

      if (!user) {
        throw new AuthError(
          I18nService.getMessage("auth.invalid_credentials", language),
          AUTH_ERRORS.INVALID_CREDENTIALS
        );
      }

      // Check if account is locked
      if (SecurityService.isAccountLocked(user)) {
        throw new AuthError(
          I18nService.getMessage("auth.account_locked", language),
          AUTH_ERRORS.ACCOUNT_LOCKED
        );
      }

      // Validate password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        // Increment failed attempts
        await user.incLoginAttempts();

        this.logger.warn(
          "Tentative de connexion échouée",
          {
            email: user.email,
            attempts: user.security.failedLoginAttempts + 1,
          },
          { userId: user._id.toString(), action: "login_failed" }
        );

        throw new AuthError(
          I18nService.getMessage("auth.invalid_credentials", language),
          AUTH_ERRORS.INVALID_CREDENTIALS
        );
      }

      // Check if account is active
      if (!user.isActive) {
        throw new AuthError(
          I18nService.getMessage("auth.account_disabled", language),
          AUTH_ERRORS.ACCOUNT_DISABLED
        );
      }

      // Reset failed login attempts
      await user.resetLoginAttempts();

      this.logger.auth(
        "Connexion réussie",
        { email: user.email, lastLogin: user.lastActiveAt },
        {
          userId: user._id.toString(),
          email: user.email,
          action: "login_success",
        }
      );

      return {
        user: user.profile,
        isLocked: false,
        lastLogin: user.lastActiveAt,
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger.error("Erreur lors de l'authentification", error, {
        action: "authentication_failed",
        email: email?.toLowerCase(),
      });

      throw new SystemError("Erreur lors de la connexion", error, {
        email: email?.toLowerCase(),
      });
    }
  }

  /**
   * 🔄 Generate access and refresh tokens
   */
  static generateTokens(userId) {
    // ✅ FIX: Validation déjà effectuée par le middleware Joi
    // userId est déjà validé par le middleware d'authentification

    try {
      const accessToken = jwt.sign(
        { userId, type: "access" },
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRES_IN }
      );

      const refreshToken = jwt.sign(
        { userId, type: "refresh" },
        config.JWT_SECRET,
        { expiresIn: config.JWT_REFRESH_EXPIRES_IN }
      );

      return { accessToken, refreshToken };
    } catch (error) {
      this.logger.error("Erreur lors de la génération des tokens", error, {
        action: "token_generation_failed",
        userId: userId?.toString(),
      });

      throw new SystemError("Erreur lors de la génération des tokens", error, {
        userId: userId?.toString(),
      });
    }
  }

  /**
   * 🔄 Refresh access token using refresh token
   * ✅ CORRIGÉ: Gestion d'erreurs JWT plus précise
   */
  static async refreshAccessToken(refreshToken, language = defaultLanguage) {
    // ✅ FIX 1: Defensive programming
    if (!refreshToken || typeof refreshToken !== "string") {
      throw new ValidationError(
        I18nService.getMessage("auth.refresh_token_required", language),
        "MISSING_REFRESH_TOKEN"
      );
    }

    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

      if (decoded.type !== "refresh") {
        throw new AuthError(
          I18nService.getMessage("auth.refresh_token_invalid", language),
          AUTH_ERRORS.INVALID_TOKEN
        );
      }

      // Find user
      const user = await User.findById(decoded.userId);

      if (!user) {
        throw new NotFoundError(
          I18nService.getMessage("user.not_found", language),
          USER_ERRORS.USER_NOT_FOUND
        );
      }

      if (!user.isActive) {
        throw new AuthError(
          I18nService.getMessage("auth.account_disabled", language),
          AUTH_ERRORS.ACCOUNT_DISABLED
        );
      }

      if (SecurityService.isAccountLocked(user)) {
        throw new AuthError(
          I18nService.getMessage("auth.account_locked", language),
          AUTH_ERRORS.ACCOUNT_LOCKED
        );
      }

      // Generate new tokens
      const tokens = this.generateTokens(user._id);

      this.logger.auth(
        "Token rafraîchi avec succès",
        { userId: user._id, email: user.email },
        {
          userId: user._id.toString(),
          email: user.email,
          action: "token_refreshed",
        }
      );

      return {
        user: user.profile,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: config.JWT_EXPIRES_IN,
      };
    } catch (error) {
      // ✅ FIX 4: Gestion d'erreurs JWT plus précise
      if (error.name === "JsonWebTokenError") {
        // Token malformé, signature invalide, etc.
        if (error.message.includes("invalid signature")) {
          throw new AuthError(
            I18nService.getMessage("auth.token_invalid", language),
            AUTH_ERRORS.INVALID_TOKEN
          );
        } else if (error.message.includes("malformed")) {
          throw new AuthError(
            I18nService.getMessage("auth.token_invalid", language),
            AUTH_ERRORS.INVALID_TOKEN
          );
        } else {
          throw new AuthError(
            I18nService.getMessage("auth.refresh_token_invalid", language),
            AUTH_ERRORS.INVALID_TOKEN
          );
        }
      }

      if (error.name === "TokenExpiredError") {
        throw new AuthError(
          I18nService.getMessage("auth.refresh_token_expired", language),
          AUTH_ERRORS.TOKEN_EXPIRED
        );
      }

      if (error.name === "NotBeforeError") {
        throw new AuthError(
          I18nService.getMessage("auth.token_invalid", language),
          AUTH_ERRORS.INVALID_TOKEN
        );
      }

      if (error.isOperational) {
        throw error;
      }

      this.logger.error("Erreur lors du rafraîchissement du token", error, {
        action: "token_refresh_failed",
      });

      throw new SystemError("Erreur lors du rafraîchissement du token", error);
    }
  }

  /**
   * Change password
   * ✅ Amélioré avec defensive programming
   */
  static async changePassword(userId, passwordData) {
    // ✅ FIX: Validation déjà effectuée par le middleware Joi
    // userId est validé par le middleware d'authentification
    // passwordData est validé par le schéma changePassword
    const { currentPassword, newPassword } = passwordData;

    try {
      // Get user with password
      const user = await User.findById(userId).select("+password");

      if (!user) {
        throw new NotFoundError(
          "Utilisateur introuvable",
          USER_ERRORS.USER_NOT_FOUND
        );
      }

      // Check if user has a password (OAuth users might not)
      if (!user.password) {
        throw new AuthError(
          "Ce compte utilise une authentification externe",
          "EXTERNAL_AUTH_ACCOUNT"
        );
      }

      // Check current password
      const isCurrentPasswordValid = await user.comparePassword(
        currentPassword
      );
      if (!isCurrentPasswordValid) {
        throw new AuthError(
          "Le mot de passe actuel est incorrect",
          AUTH_ERRORS.INVALID_CURRENT_PASSWORD
        );
      }

      // Update password
      user.password = newPassword;
      await user.save();

      this.logger.auth(
        "Mot de passe changé",
        { email: user.email },
        {
          userId: user._id.toString(),
          email: user.email,
          action: "password_changed",
        }
      );

      return {
        passwordChanged: true,
        changedAt: user.security.passwordChangedAt,
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger.error("Erreur lors du changement de mot de passe", error, {
        action: "password_change_failed",
        userId: userId?.toString(),
      });

      throw new SystemError(
        "Erreur lors du changement de mot de passe",
        error,
        { userId: userId?.toString() }
      );
    }
  }

  /**
   * Generate password reset token - AVEC protection timing attack
   * ✅ CORRIGÉ: Validation déléguée au middleware Joi
   */
  static async generatePasswordResetToken(email) {
    // ✅ FIX: Validation déjà effectuée par le middleware Joi
    // email est déjà validé et nettoyé

    try {
      // ✅ CORRECTION: Toujours faire le même traitement pour éviter timing attack
      const startTime = Date.now();

      const user = await User.findOne({ email: email.toLowerCase() });

      // Générer un token dans tous les cas (même si user n'existe pas)
      const resetToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      if (user) {
        // Utilisateur existe : sauvegarder le vrai token
        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        this.logger.auth(
          "Token de réinitialisation généré",
          { email: user.email },
          {
            userId: user._id.toString(),
            email: user.email,
            action: "password_reset_token_generated",
          }
        );
      } else {
        // ✅ Utilisateur n'existe pas : simuler la même durée de traitement
        // Faire une opération factice pour prendre du temps
        await new Promise((resolve) =>
          setTimeout(resolve, Math.random() * 50 + 50)
        );
      }

      // ✅ S'assurer que la réponse prend au minimum le même temps
      const minProcessingTime = 100; // 100ms minimum
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < minProcessingTime) {
        await new Promise((resolve) =>
          setTimeout(resolve, minProcessingTime - elapsedTime)
        );
      }

      // ✅ Toujours retourner la même réponse (ne pas révéler si l'email existe)
      return {
        emailSent: true,
        message:
          "Si cette adresse email existe, un lien de réinitialisation a été envoyé",
        // En développement seulement, retourner le token si l'user existe
        ...(process.env.NODE_ENV === "development" &&
          user && {
            resetToken,
            expiresAt: user.passwordResetExpires,
          }),
      };
    } catch (error) {
      this.logger.error(
        "Erreur lors de la génération du token de réinitialisation",
        error,
        {
          action: "password_reset_token_failed",
          email: email?.toLowerCase(),
        }
      );

      throw new SystemError(
        "Erreur lors de la demande de réinitialisation",
        error,
        { email: email?.toLowerCase() }
      );
    }
  }

  /**
   * Reset password using token
   * ✅ CORRIGÉ: Validation déléguée au middleware Joi
   */
  static async resetPasswordWithToken(tokenData) {
    // ✅ FIX: Validation déjà effectuée par le middleware Joi
    // tokenData est déjà validé par le schéma resetPassword
    const { token, password } = tokenData;

    try {
      // Hash the token for comparison
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      // Find user with valid token
      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
      });

      if (!user) {
        throw new AuthError(
          "Token de réinitialisation invalide ou expiré",
          AUTH_ERRORS.INVALID_RESET_TOKEN
        );
      }

      // Update password
      user.password = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;

      await user.save();

      this.logger.auth(
        "Mot de passe réinitialisé avec token",
        { email: user.email },
        {
          userId: user._id.toString(),
          email: user.email,
          action: "password_reset_completed",
        }
      );

      return {
        passwordReset: true,
        user: user.profile,
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger.error("Erreur lors de la réinitialisation par token", error, {
        action: "password_reset_failed",
      });

      throw new SystemError(
        "Erreur lors de la réinitialisation du mot de passe",
        error
      );
    }
  }

  /**
   * Delete user account (GDPR)
   * ✅ CORRIGÉ: Validation déléguée au middleware Joi
   */
  static async deleteUserAccount(userId) {
    // ✅ FIX: Validation déjà effectuée par le middleware Joi
    // userId est validé par le middleware d'authentification

    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new NotFoundError(
          "Utilisateur introuvable",
          USER_ERRORS.USER_NOT_FOUND
        );
      }

      // Supprimer l'utilisateur et ses données associées
      await this.deleteAllUserData(userId);

      this.logger.auth(
        "Compte utilisateur supprimé",
        { email: user.email, deletedAt: new Date() },
        {
          userId: userId.toString(),
          email: user.email,
          action: "account_deleted",
        }
      );

      return {
        accountDeleted: true,
        deletedAt: new Date(),
        email: user.email,
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger.error("Erreur lors de la suppression du compte", error, {
        action: "account_deletion_failed",
        userId: userId?.toString(),
      });

      throw new SystemError("Erreur lors de la suppression du compte", error, {
        userId: userId?.toString(),
      });
    }
  }

  /**
   * 🗑️ Supprimer toutes les données associées à un utilisateur
   */
  static async deleteAllUserData(userId) {
    try {
      this.logger.info(
        "Début de la suppression complète des données utilisateur",
        {
          userId: userId.toString(),
        }
      );

      // 1. Supprimer les comptes email
      const emailAccounts = await EmailAccount.find({ userId });
      if (emailAccounts.length > 0) {
        await EmailAccount.deleteMany({ userId });
        this.logger.info("Comptes email supprimés", {
          userId: userId.toString(),
          count: emailAccounts.length,
        });
      }

      // 2. Supprimer les tokens blacklistés
      try {
        await TokenBlacklistService.clearUserTokens(userId.toString());
        this.logger.info("Tokens blacklistés supprimés", {
          userId: userId.toString(),
        });
      } catch (error) {
        this.logger.warn(
          "Erreur lors de la suppression des tokens blacklistés",
          {
            userId: userId.toString(),
            error: error.message,
          }
        );
      }

      // 3. Supprimer les fichiers uploadés (avatars)
      let avatarFilesDeleted = 0;
      try {
        const avatarsDir = path.join(process.cwd(), "uploads", "avatars");
        const files = await fs.readdir(avatarsDir);

        const userAvatarFiles = files.filter((file) =>
          file.startsWith(`avatar_${userId.toString()}_`)
        );

        for (const file of userAvatarFiles) {
          const filePath = path.join(avatarsDir, file);
          await fs.unlink(filePath);
          this.logger.info("Fichier avatar supprimé", {
            userId: userId.toString(),
            file,
          });
        }

        avatarFilesDeleted = userAvatarFiles.length;
        if (userAvatarFiles.length > 0) {
          this.logger.info("Fichiers avatar supprimés", {
            userId: userId.toString(),
            count: userAvatarFiles.length,
          });
        }
      } catch (error) {
        this.logger.warn("Erreur lors de la suppression des fichiers avatar", {
          userId: userId.toString(),
          error: error.message,
        });
      }

      // 4. Supprimer l'utilisateur (supprime automatiquement les préférences et métriques de sécurité)
      await User.findByIdAndDelete(userId);

      this.logger.success(
        "Suppression complète des données utilisateur terminée",
        {
          userId: userId.toString(),
          emailAccountsDeleted: emailAccounts.length,
          avatarFilesDeleted: avatarFilesDeleted,
        }
      );
    } catch (error) {
      this.logger.error(
        "Erreur lors de la suppression des données utilisateur",
        error,
        {
          action: "delete_all_user_data_failed",
          userId: userId?.toString(),
        }
      );

      throw new SystemError(
        "Erreur lors de la suppression des données utilisateur",
        error,
        {
          userId: userId?.toString(),
        }
      );
    }
  }
}

export default AuthService;
