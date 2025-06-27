const User = require("../models/User");
const crypto = require("crypto");

/**
 * 🔐 Authentication service
 */
class AuthService {
  // ✅ Injection du logger
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
        const error = new Error(
          "Un compte avec cette adresse email existe déjà"
        );
        error.statusCode = 409;
        error.code = "USER_EXISTS";
        throw error;
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
        {
          email: user.email,
          userId: user._id,
        },
        {
          userId: user._id.toString(),
          action: "user_registered",
        }
      );

      return {
        user: user.profile,
        isNew: true,
      };
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }

      this.logger.error("Erreur lors de la création d'utilisateur", error, {
        action: "user_registration_failed",
        email: email?.toLowerCase(),
      });

      const serviceError = new Error("Erreur lors de la création du compte");
      serviceError.statusCode = 500;
      throw serviceError;
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
        const error = new Error("Email ou mot de passe incorrect");
        error.statusCode = 401;
        error.code = "INVALID_CREDENTIALS";
        throw error;
      }

      // Check if account is locked
      if (user.isAccountLocked()) {
        const error = new Error(
          "Compte temporairement verrouillé en raison de tentatives de connexion échouées"
        );
        error.statusCode = 423;
        error.code = "ACCOUNT_LOCKED";
        throw error;
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
          {
            userId: user._id.toString(),
            action: "login_failed",
          }
        );

        const error = new Error("Email ou mot de passe incorrect");
        error.statusCode = 401;
        error.code = "INVALID_CREDENTIALS";
        throw error;
      }

      // Check if account is active
      if (!user.isActive) {
        const error = new Error(
          "Votre compte a été désactivé. Contactez le support."
        );
        error.statusCode = 401;
        error.code = "ACCOUNT_DISABLED";
        throw error;
      }

      // Reset failed login attempts
      await user.resetLoginAttempts();

      this.logger.auth(
        "Connexion réussie",
        {
          email: user.email,
          lastLogin: user.lastActiveAt,
        },
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
      if (error.statusCode) {
        throw error;
      }

      this.logger.error("Erreur lors de l'authentification", error, {
        action: "authentication_failed",
        email: email?.toLowerCase(),
      });

      const serviceError = new Error("Erreur lors de la connexion");
      serviceError.statusCode = 500;
      throw serviceError;
    }
  }

  /**
   * Update user activity
   */
  static async updateUserActivity(userId, metadata) {
    try {
      const { ip, userAgent } = metadata;

      const user = await User.findById(userId);
      if (!user) {
        const error = new Error("Utilisateur introuvable");
        error.statusCode = 404;
        throw error;
      }

      await user.updateLastActive(ip, userAgent);

      return {
        lastActiveAt: user.lastActiveAt,
        updated: true,
      };
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }

      this.logger.error("Erreur lors de la mise à jour d'activité", error, {
        action: "activity_update_failed",
        userId: userId?.toString(),
      });

      const serviceError = new Error(
        "Erreur lors de la mise à jour d'activité"
      );
      serviceError.statusCode = 500;
      throw serviceError;
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
        const error = new Error("Utilisateur introuvable");
        error.statusCode = 404;
        throw error;
      }

      // Check current password
      const isCurrentPasswordValid =
        await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        const error = new Error("Le mot de passe actuel est incorrect");
        error.statusCode = 400;
        error.code = "INVALID_CURRENT_PASSWORD";
        throw error;
      }

      // Update password
      user.password = newPassword;
      await user.save();

      this.logger.auth(
        "Mot de passe changé",
        {
          email: user.email,
        },
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
      if (error.statusCode) {
        throw error;
      }

      this.logger.error("Erreur lors du changement de mot de passe", error, {
        action: "password_change_failed",
        userId: userId?.toString(),
      });

      const serviceError = new Error(
        "Erreur lors du changement de mot de passe"
      );
      serviceError.statusCode = 500;
      throw serviceError;
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
        {
          email: user.email,
        },
        {
          userId: user._id.toString(),
          email: user.email,
          action: "password_reset_token_generated",
        }
      );

      // TODO: Send email with the token (not the hashed version)

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

      const serviceError = new Error(
        "Erreur lors de la demande de réinitialisation"
      );
      serviceError.statusCode = 500;
      throw serviceError;
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
        const error = new Error("Token de réinitialisation invalide ou expiré");
        error.statusCode = 400;
        error.code = "INVALID_RESET_TOKEN";
        throw error;
      }

      // Update password
      user.password = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;

      await user.save();

      this.logger.auth(
        "Mot de passe réinitialisé avec token",
        {
          email: user.email,
        },
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
      if (error.statusCode) {
        throw error;
      }

      this.logger.error("Erreur lors de la réinitialisation par token", error, {
        action: "password_reset_failed",
      });

      const serviceError = new Error(
        "Erreur lors de la réinitialisation du mot de passe"
      );
      serviceError.statusCode = 500;
      throw serviceError;
    }
  }

  /**
   * Delete user account (GDPR)
   */
  static async deleteUserAccount(userId) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        const error = new Error("Utilisateur introuvable");
        error.statusCode = 404;
        throw error;
      }

      // TODO: Remove all related user data
      // - Connected email accounts
      // - Saved drafts
      // - Email history
      // - etc.

      await User.findByIdAndDelete(userId);

      this.logger.auth(
        "Compte utilisateur supprimé",
        {
          email: user.email,
          deletedAt: new Date(),
        },
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
      if (error.statusCode) {
        throw error;
      }

      this.logger.error("Erreur lors de la suppression du compte", error, {
        action: "account_deletion_failed",
        userId: userId?.toString(),
      });

      const serviceError = new Error("Erreur lors de la suppression du compte");
      serviceError.statusCode = 500;
      throw serviceError;
    }
  }
}

module.exports = AuthService;
