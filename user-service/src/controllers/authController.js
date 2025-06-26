const AuthService = require("../services/authService");
const { logger } = require("../utils/logger");

/**
 * 🔐 Authentication controller
 */
class AuthController {
  /**
   * 📝 User registration
   */
  static async register(request, reply) {
    try {
      const { name, email, password } = request.body;

      // Call the service
      const result = await AuthService.registerUser({ name, email, password });

      // Generate JWT token
      const token = request.server.jwt.sign(
        { userId: result.user.id },
        { expiresIn: "24h" }
      );

      return reply.code(201).success(
        {
          user: result.user,
          token,
          expiresIn: "24h",
        },
        "Compte créé avec succès"
      );
    } catch (error) {
      // The service already handles error logging
      return reply.code(error.statusCode || 500).send({
        error: error.message,
        code: error.code || "REGISTRATION_ERROR",
      });
    }
  }

  /**
   * 🔑 User login
   */
  static async login(request, reply) {
    try {
      const { email, password } = request.body;

      // Call the authentication service
      const result = await AuthService.authenticateUser({ email, password });

      // Update user activity
      await AuthService.updateUserActivity(result.user.id, {
        ip: request.ip,
        userAgent: request.headers["user-agent"],
      });

      // Generate JWT token
      const token = request.server.jwt.sign(
        { userId: result.user.id },
        { expiresIn: "24h" }
      );

      return reply.success(
        {
          user: result.user,
          token,
          expiresIn: "24h",
          lastLogin: result.lastLogin,
        },
        "Connexion réussie"
      );
    } catch (error) {
      return reply.code(error.statusCode || 500).send({
        error: error.message,
        code: error.code || "LOGIN_ERROR",
      });
    }
  }

  /**
   * 🚪 Logout
   */
  static async logout(request, reply) {
    try {
      // Note: With JWT, logout is mostly client-side
      // A token blacklist can optionally be added here

      logger.auth(
        "Déconnexion utilisateur",
        {
          email: request.user.email,
        },
        {
          userId: request.user._id.toString(),
          email: request.user.email,
          action: "logout",
        }
      );

      return reply.success(null, "Déconnexion réussie");
    } catch (error) {
      logger.error("Erreur lors de la déconnexion", error, {
        action: "logout_failed",
        userId: request.user?._id?.toString(),
      });

      return reply.code(500).error("Erreur lors de la déconnexion");
    }
  }

  /**
   * 👤 Get current user profile
   */
  static async getProfile(request, reply) {
    try {
      // User is already available via auth middleware
      const user = request.user;

      // Populate connected email accounts
      await user.populate(
        "connectedEmailAccounts",
        "email provider isActive lastUsed"
      );

      return reply.success(
        {
          user: user.profile,
          preferences: user.preferences,
          securityStats: user.securityStats,
          connectedAccounts: user.connectedEmailAccounts,
        },
        "Profil récupéré avec succès"
      );
    } catch (error) {
      logger.error("Erreur lors de la récupération du profil", error, {
        action: "get_profile_failed",
        userId: request.user?._id?.toString(),
      });

      return reply.code(500).error("Erreur lors de la récupération du profil");
    }
  }

  /**
   * ✏️ Update user profile
   */
  static async updateProfile(request, reply) {
    try {
      const { name, email, currentPassword, newPassword } = request.body;
      const userId = request.user._id;

      // If password is changing
      if (newPassword) {
        await AuthService.changePassword(userId, {
          currentPassword,
          newPassword,
        });
      }

      // Update other fields
      const updates = {};
      if (name) updates.name = name.trim();
      if (email && email !== request.user.email) {
        // Check if the new email is available
        const User = require("../models/User");
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
          return reply.code(409).send({
            error: "Email déjà utilisé",
            message: "Cette adresse email est déjà associée à un autre compte",
          });
        }
        updates.email = email.toLowerCase();
        updates.isEmailVerified = false; // Will require new verification
      }

      if (Object.keys(updates).length > 0) {
        const User = require("../models/User");
        await User.findByIdAndUpdate(userId, updates, { runValidators: true });
      }

      // Get the updated user
      const User = require("../models/User");
      const updatedUser = await User.findById(userId);

      logger.user(
        "Profil mis à jour",
        {
          updatedFields: Object.keys(updates),
          passwordChanged: !!newPassword,
        },
        {
          userId: userId.toString(),
          email: updatedUser.email,
          action: "profile_updated",
        }
      );

      return reply.success(
        {
          user: updatedUser.profile,
        },
        "Profil mis à jour avec succès"
      );
    } catch (error) {
      if (error.statusCode) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "PROFILE_UPDATE_ERROR",
        });
      }

      logger.error("Erreur lors de la mise à jour du profil", error, {
        action: "profile_update_failed",
        userId: request.user?._id?.toString(),
      });

      return reply.code(500).error("Erreur lors de la mise à jour du profil");
    }
  }

  /**
   * 🗑️ Delete user account (GDPR)
   */
  static async deleteAccount(request, reply) {
    try {
      const userId = request.user._id;

      const result = await AuthService.deleteUserAccount(userId);

      return reply.success(
        {
          accountDeleted: result.accountDeleted,
          deletedAt: result.deletedAt,
        },
        "Compte supprimé définitivement"
      );
    } catch (error) {
      if (error.statusCode) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "ACCOUNT_DELETION_ERROR",
        });
      }

      return reply.code(500).error("Erreur lors de la suppression du compte");
    }
  }

  /**
   * 🔄 Forgot password
   */
  static async forgotPassword(request, reply) {
    try {
      const { email } = request.body;

      const result = await AuthService.generatePasswordResetToken(email);

      // TODO: In production, don't return the token
      return reply.success(
        {
          emailSent: result.emailSent,
          ...(process.env.NODE_ENV === "development" && {
            resetToken: result.resetToken,
            expiresAt: result.expiresAt,
          }),
        },
        result.message
      );
    } catch (error) {
      return reply.code(error.statusCode || 500).send({
        error: error.message,
        code: error.code || "PASSWORD_RESET_ERROR",
      });
    }
  }

  /**
   * 🔒 Reset password
   */
  static async resetPassword(request, reply) {
    try {
      const { token, password } = request.body;

      const result = await AuthService.resetPasswordWithToken({
        token,
        password,
      });

      return reply.success(
        {
          passwordReset: result.passwordReset,
          user: result.user,
        },
        "Mot de passe réinitialisé avec succès"
      );
    } catch (error) {
      if (error.statusCode) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "PASSWORD_RESET_ERROR",
        });
      }

      return reply
        .code(500)
        .error("Erreur lors de la réinitialisation du mot de passe");
    }
  }
}

module.exports = AuthController;
