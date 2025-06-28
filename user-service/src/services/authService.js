// ============================================================================
// 📁 authService.js - Version standardisée avec classes d'erreur
// ============================================================================

import User from "../models/User.js";
import crypto from "crypto";
import {
  ConflictError,
  AuthError,
  NotFoundError,
  SystemError,
} from "../utils/customError.js";
import { AUTH_ERRORS, USER_ERRORS } from "../utils/errorCodes.js";

/**
 * 🔐 Authentication service
 */
class AuthService {
  static setLogger(injectedLogger) {
    this.logger = injectedLogger;
  }

  /**
   * Register a new user
   */
  static async registerUser(userData) {
    const { name, email, password } = userData;

    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        throw new ConflictError(
          "Un compte avec cette adresse email existe déjà",
          AUTH_ERRORS.USER_EXISTS
        );
      }

      // Create the new user
      const user = new User({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
      });

      await user.save();

      this.logger.auth(
        "Nouvel utilisateur créé",
        { email: user.email, userId: user._id },
        { userId: user._id.toString(), action: "user_registered" }
      );

      return { user: user.profile, isNew: true };
    } catch (error) {
      // Si c'est déjà une erreur opérationnelle, on la relance
      if (error.isOperational) {
        throw error;
      }

      // Sinon, on la transforme en erreur système
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
   */
  static async authenticateUser(credentials) {
    const { email, password } = credentials;

    try {
      // Find user with password
      const user = await User.findOne({ email: email.toLowerCase() }).select(
        "+password"
      );

      if (!user) {
        throw new AuthError(
          "Email ou mot de passe incorrect",
          AUTH_ERRORS.INVALID_CREDENTIALS
        );
      }

      // Check if account is locked
      if (user.isAccountLocked()) {
        throw new AuthError(
          "Compte temporairement verrouillé en raison de tentatives de connexion échouées",
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
          "Email ou mot de passe incorrect",
          AUTH_ERRORS.INVALID_CREDENTIALS
        );
      }

      // Check if account is active
      if (!user.isActive) {
        throw new AuthError(
          "Votre compte a été désactivé. Contactez le support.",
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
   * Change password
   */
  static async changePassword(userId, passwordData) {
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

      // Check current password
      const isCurrentPasswordValid =
        await user.comparePassword(currentPassword);
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
   * Generate password reset token
   */
  static async generatePasswordResetToken(email) {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });

      // Do not reveal if email exists for security reasons
      if (!user) {
        return {
          emailSent: true,
          message:
            "Si cette adresse email existe, un lien de réinitialisation a été envoyé",
        };
      }

      // Generate secure token
      const resetToken = crypto.randomBytes(32).toString("hex");

      user.passwordResetToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
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

      return {
        emailSent: true,
        resetToken, // Only for implementation - to remove when email is implemented
        expiresAt: user.passwordResetExpires,
        message:
          "Si cette adresse email existe, un lien de réinitialisation a été envoyé",
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
   */
  static async resetPasswordWithToken(tokenData) {
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

      // TODO: Remove all related user data
      await User.findByIdAndDelete(userId);

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
}

export default AuthService;
