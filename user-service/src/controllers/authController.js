import AuthService from "../services/authService.js";
import User from "../models/User.js";

/**
 * 🔐 Authentication controller
 * ✅ CORRIGÉ: Gestion d'erreurs simplifiée + updateLastActive uniforme
 */
class AuthController {
  // ✅ Injection du logger
  static setLogger(injectedLogger) {
    this.logger = injectedLogger;
  }

  /**
   * ✅ FIX 1: Méthode utilitaire pour gestion d'erreurs commune
   * Puisque le système Exceptionless gère déjà les erreurs 5xx automatiquement,
   * on se contente de gérer les erreurs 4xx localement
   */
  static handleClientError(error, reply, defaultCode = "OPERATION_ERROR") {
    if (error.statusCode && error.statusCode < 500 && error.isOperational) {
      return reply.code(error.statusCode).send({
        error: error.message,
        code: error.code || defaultCode,
      });
    }
    // Les erreurs 5xx sont automatiquement gérées par le gestionnaire centralisé
    throw error;
  }

  /**
   * ✅ FIX 2: Méthode utilitaire pour updateLastActive uniforme
   */
  static async updateUserLastActive(userId, request) {
    try {
      const userInstance = await User.findById(userId);
      if (userInstance) {
        await userInstance.updateLastActive(
          request.ip,
          request.headers["user-agent"]
        );
      }
    } catch (error) {
      // Log mais ne pas faire échouer l'authentification pour ça
      this.logger?.warn("Échec mise à jour lastActive", {
        userId: userId?.toString(),
        error: error.message,
      });
    }
  }

  /**
   * 📝 User registration
   */
  static async register(request, reply) {
    try {
      const { name, email, password } = request.body;

      // Call the service
      const result = await AuthService.registerUser({ name, email, password });

      // Generate tokens
      const tokens = AuthService.generateTokens(result.user.id);

      return reply.code(201).success(
        {
          user: result.user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: "24h",
        },
        "Compte créé avec succès"
      );
    } catch (error) {
      // ✅ FIX 1: Utilisation de la méthode commune
      return this.handleClientError(error, reply, "REGISTRATION_ERROR");
    }
  }

  /**
   * 🔑 User login
   * ✅ CORRIGÉ: updateLastActive uniforme
   */
  static async login(request, reply) {
    try {
      const { email, password } = request.body;

      // Call the authentication service
      const result = await AuthService.authenticateUser({ email, password });

      // ✅ FIX 2: Utilisation de la méthode commune pour updateLastActive
      await this.updateUserLastActive(result.user.id, request);

      // Generate tokens
      const tokens = AuthService.generateTokens(result.user.id);

      return reply.success(
        {
          user: result.user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: "24h",
          lastLogin: result.lastLogin,
        },
        "Connexion réussie"
      );
    } catch (error) {
      // ✅ FIX 1: Utilisation de la méthode commune
      return this.handleClientError(error, reply, "LOGIN_ERROR");
    }
  }

  /**
   * 🔄 Refresh access token
   */
  static async refreshToken(request, reply) {
    try {
      const { refreshToken } = request.body;

      if (!refreshToken) {
        return reply.code(400).send({
          error: "Token de rafraîchissement requis",
          code: "MISSING_REFRESH_TOKEN",
        });
      }

      // Call the service to refresh the token
      const result = await AuthService.refreshAccessToken(refreshToken);

      return reply.success(
        {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
        },
        "Token rafraîchi avec succès"
      );
    } catch (error) {
      // ✅ FIX 1: Utilisation de la méthode commune
      return this.handleClientError(error, reply, "TOKEN_REFRESH_ERROR");
    }
  }

  /**
   * 🔍 Google OAuth authentication
   * ✅ CORRIGÉ: updateLastActive uniforme + logique métier déplacée
   */
  static async googleAuth(request, reply) {
    try {
      const { googleToken } = request.body;

      if (!googleToken) {
        return reply.code(400).send({
          error: "Token Google requis",
          code: "MISSING_GOOGLE_TOKEN",
        });
      }

      // ✅ FIX 3: Logique métier déplacée dans le service
      // Au lieu de vérifier le token ici, on délègue tout au service
      const googleUserData = await this.verifyGoogleToken(googleToken);

      if (!googleUserData) {
        return reply.code(401).send({
          error: "Token Google invalide",
          code: "INVALID_GOOGLE_TOKEN",
        });
      }

      // Authenticate with Google data
      const result = await AuthService.authenticateWithGoogle(googleUserData);

      // ✅ FIX 2: Utilisation de la méthode commune pour updateLastActive
      await this.updateUserLastActive(result.user.id, request);

      // Generate tokens
      const tokens = AuthService.generateTokens(result.user.id);

      this.logger.auth(
        "Authentification Google réussie",
        {
          email: result.user.email,
          isNew: result.isNew,
          linkedAccount: result.linkedAccount,
        },
        {
          userId: result.user.id,
          email: result.user.email,
          action: "google_auth_success",
        }
      );

      return reply.success(
        {
          user: result.user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: "24h",
          isNew: result.isNew,
          linkedAccount: result.linkedAccount,
        },
        result.isNew
          ? "Compte créé et connecté avec Google"
          : result.linkedAccount
            ? "Compte lié à Google avec succès"
            : "Connexion Google réussie"
      );
    } catch (error) {
      // ✅ FIX 1: Utilisation de la méthode commune
      return this.handleClientError(error, reply, "GOOGLE_AUTH_ERROR");
    }
  }

  /**
   * 🚪 Logout
   */
  static async logout(request, reply) {
    try {
      // Note: With JWT, logout is mostly client-side
      // A token blacklist can optionally be added here

      this.logger.auth(
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
      // ✅ FIX 1: Utilisation de la méthode commune
      return this.handleClientError(error, reply, "LOGOUT_ERROR");
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
      // ✅ FIX 1: Utilisation de la méthode commune
      return this.handleClientError(error, reply, "GET_PROFILE_ERROR");
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
        await User.findByIdAndUpdate(userId, updates, { runValidators: true });
      }

      // Get the updated user
      const updatedUser = await User.findById(userId);

      this.logger.user(
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
      // ✅ FIX 1: Utilisation de la méthode commune
      return this.handleClientError(error, reply, "PROFILE_UPDATE_ERROR");
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
      // ✅ FIX 1: Utilisation de la méthode commune
      return this.handleClientError(error, reply, "ACCOUNT_DELETION_ERROR");
    }
  }

  /**
   * 🔄 Forgot password
   */
  static async forgotPassword(request, reply) {
    try {
      const { email } = request.body;

      const result = await AuthService.generatePasswordResetToken(email);

      // ✅ FIX 4: SÉCURITÉ - Ne plus exposer le token même en dev
      // Le token doit être envoyé par email uniquement
      return reply.success(
        {
          emailSent: result.emailSent,
          // ❌ SUPPRIMÉ: Plus d'exposition du token pour des raisons de sécurité
          // ...(process.env.NODE_ENV === "development" && {
          //   resetToken: result.resetToken,
          //   expiresAt: result.expiresAt,
          // }),
        },
        result.message
      );
    } catch (error) {
      // ✅ FIX 1: Utilisation de la méthode commune
      return this.handleClientError(error, reply, "PASSWORD_RESET_ERROR");
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
      // ✅ FIX 1: Utilisation de la méthode commune
      return this.handleClientError(error, reply, "PASSWORD_RESET_ERROR");
    }
  }

  /**
   * 🔍 Helper: Verify Google token (implemented with google-auth-library)
   * ✅ Simplifiée mais garde la logique métier dans le service
   */
  static async verifyGoogleToken(googleToken) {
    try {
      // Import Google Auth Service
      const GoogleAuthService = (
        await import("../services/googleAuthService.js")
      ).default;

      // Verify token with Google
      const userData = await GoogleAuthService.verifyGoogleToken(googleToken);

      return userData;
    } catch (error) {
      // ✅ Les erreurs système remontent automatiquement au gestionnaire centralisé
      // Les erreurs métier (token invalide) retournent null comme prévu
      this.logger.error("Erreur verification token Google", error, {
        action: "google_token_verification_failed",
      });

      // Si c'est une erreur système, elle remontera
      // Si c'est métier, on retourne null (comportement attendu)
      if (error.isOperational && error.statusCode < 500) {
        return null;
      }

      throw error;
    }
  }
}

export default AuthController;
