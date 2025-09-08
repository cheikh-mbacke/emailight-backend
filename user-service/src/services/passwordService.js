// ============================================================================
// 📁 passwordService.js - Service de gestion des mots de passe
// ============================================================================

import User from "../models/User.js";
import mongoose from "mongoose";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import {
  ConflictError,
  AuthError,
  NotFoundError,
  SystemError,
  ValidationError,
} from "../utils/customError.js";
import { AUTH_ERRORS, USER_ERRORS } from "../utils/errorCodes.js";
import I18nService from "./i18nService.js";
import SecurityService from "./securityService.js";

/**
 * 🔐 Password management service
 */
class PasswordService {
  /**
   * 📝 Set logger instance
   */
  static setLogger(injectedLogger) {
    this.logger = injectedLogger;
  }

  /**
   * ✅ Validate ObjectId format
   */
  static validateObjectId(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError(
        "ID utilisateur invalide",
        USER_ERRORS.INVALID_USER_ID
      );
    }
  }

  /**
   * 🔄 Change user password
   */
  static async changePassword(
    userId,
    currentPassword,
    newPassword,
    language = "FR"
  ) {
    try {
      PasswordService.validateObjectId(userId);

      // Récupérer l'utilisateur
      const user = await User.findById(userId).select("+password");
      if (!user) {
        throw new NotFoundError(
          I18nService.getMessage("user.not_found", language),
          USER_ERRORS.USER_NOT_FOUND
        );
      }

      // Vérifier le mot de passe actuel
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isCurrentPasswordValid) {
        throw new AuthError(
          I18nService.getValidationMessage(
            "current_password",
            "invalid",
            language
          ),
          AUTH_ERRORS.INVALID_CREDENTIALS
        );
      }

      // Vérifier que le nouveau mot de passe est différent
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        throw new ConflictError(
          I18nService.getValidationMessage(
            "new_password",
            "same_as_current",
            language
          ),
          USER_ERRORS.PASSWORD_SAME_AS_CURRENT
        );
      }

      // Hasher le nouveau mot de passe
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Mettre à jour le mot de passe
      await User.findByIdAndUpdate(userId, {
        password: hashedNewPassword,
        passwordChangedAt: new Date(),
      });

      // Log de sécurité
      this.logger?.user(
        I18nService.getMessage("logs.passwordChanged", language),
        {
          userId: userId.toString(),
          email: user.email,
          action: "password_changed",
        }
      );

      return {
        message: I18nService.getMessage("success.password_changed", language),
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur lors du changement de mot de passe", error, {
        action: "change_password_failed",
        userId: userId?.toString(),
      });
      throw new SystemError(
        "Erreur lors du changement de mot de passe",
        error,
        {
          userId: userId?.toString(),
        }
      );
    }
  }

  /**
   * 📧 Request password reset
   */
  static async requestPasswordReset(email, language = "FR") {
    try {
      // Récupérer l'utilisateur
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        // Pour des raisons de sécurité, on ne révèle pas si l'email existe
        return {
          success: true,
          message: I18nService.getMessage(
            "success.password_reset_sent",
            language
          ),
        };
      }

      // Générer un token de reset
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Sauvegarder le token
      await User.findByIdAndUpdate(user._id, {
        passwordResetToken: resetToken,
        passwordResetExpires: resetTokenExpires,
      });

      // TODO: Envoyer l'email avec le token
      // await EmailService.sendPasswordResetEmail(user.email, resetToken, language);

      // Log de sécurité
      this.logger?.user(
        I18nService.getMessage("logs.passwordResetRequested", language),
        {
          userId: user._id.toString(),
          email: user.email,
          action: "password_reset_requested",
        }
      );

      return {
        success: true,
        message: I18nService.getMessage(
          "success.password_reset_sent",
          language
        ),
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error(
        "Erreur lors de la demande de reset de mot de passe",
        error,
        {
          action: "request_password_reset_failed",
          email: email,
        }
      );
      throw new SystemError(
        "Erreur lors de la demande de reset de mot de passe",
        error,
        {
          email: email,
        }
      );
    }
  }

  /**
   * 🔄 Reset password with token
   */
  static async resetPassword(token, newPassword, language = "FR") {
    try {
      // Récupérer l'utilisateur avec le token valide
      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() },
      });

      if (!user) {
        throw new AuthError(
          I18nService.getMessage("auth.reset_token_invalid", language),
          AUTH_ERRORS.INVALID_RESET_TOKEN
        );
      }

      // Hasher le nouveau mot de passe
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Mettre à jour le mot de passe et supprimer le token
      await User.findByIdAndUpdate(user._id, {
        password: hashedNewPassword,
        passwordChangedAt: new Date(),
        passwordResetToken: undefined,
        passwordResetExpires: undefined,
      });

      // Log de sécurité
      this.logger?.user(
        I18nService.getMessage("logs.passwordReset", language),
        {
          userId: user._id.toString(),
          email: user.email,
          action: "password_reset_completed",
        }
      );

      return {
        success: true,
        message: I18nService.getMessage(
          "success.password_reset_completed",
          language
        ),
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur lors du reset de mot de passe", error, {
        action: "reset_password_failed",
        token: token?.substring(0, 8) + "...",
      });
      throw new SystemError("Erreur lors du reset de mot de passe", error, {
        token: token?.substring(0, 8) + "...",
      });
    }
  }
}

export default PasswordService;
