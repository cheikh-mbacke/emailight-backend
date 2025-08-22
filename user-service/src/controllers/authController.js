import AuthService from "../services/authService.js";
import User from "../models/User.js";
import TokenBlacklistService from "../services/tokenBlacklistService.js";
import I18nService from "../services/i18nService.js";
import jwt from "jsonwebtoken";
import config from "../config/env.js";

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
   * Format uniforme: statusCode, code, error, message
   */
  static handleClientError(error, reply, defaultCode = "OPERATION_ERROR") {
    if (error.statusCode && error.statusCode < 500 && error.isOperational) {
      return reply.code(error.statusCode).send({
        status: "failed",
        errorCode: String(error.statusCode),
        errorName: error.code || defaultCode,
        errorMessage: error.message,
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
        userInstance.lastActiveAt = new Date();
        await userInstance.save();
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

      // 🌍 Obtenir la langue de manière sécurisée
      const language = I18nService.getRequestLanguage(request);

      // Call the service
      const result = await AuthService.registerUser(
        { name, email, password },
        language
      );

      // Generate tokens
      const tokens = AuthService.generateTokens(result.user.id);

      return reply.code(201).send({
        status: "success",
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: "24h",
        },
        message: I18nService.getAuthErrorMessage("account_created", language),
      });
    } catch (error) {
      // Format d'erreur personnalisé
      if (error.isOperational) {
        const statusCode = error.statusCode || 400;
        return reply.code(statusCode).send({
          status: "failed",
          errorCode: statusCode.toString(),
          errorName: error.code || "REGISTRATION_ERROR",
          errorMessage: error.message,
        });
      }

      // Erreur système
      return reply.code(500).send({
        status: "failed",
        errorCode: "INTERNAL_ERROR",
        errorName: "SystemError",
        errorMessage:
          "Une erreur inattendue s'est produite lors de l'inscription",
      });
    }
  }

  /**
   * 🔑 User login
   * ✅ CORRIGÉ: updateLastActive uniforme
   */
  static async login(request, reply) {
    try {
      const { email, password } = request.body;

      // 🌍 Obtenir la langue de manière sécurisée
      const language = I18nService.getRequestLanguage(request);

      // Call the authentication service
      const result = await AuthService.authenticateUser(
        { email, password },
        language
      );

      // ✅ FIX 2: Utilisation de la méthode commune pour updateLastActive
      await AuthController.updateUserLastActive(result.user.id, request);

      // Generate tokens
      const tokens = AuthService.generateTokens(result.user.id);

      return reply.send({
        status: "success",
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: "24h",
        },
        message: I18nService.getAuthErrorMessage("login_success", language),
      });
    } catch (error) {
      // Format d'erreur personnalisé
      if (error.isOperational) {
        const statusCode = error.statusCode || 400;
        return reply.code(statusCode).send({
          status: "failed",
          errorCode: statusCode.toString(),
          errorName: error.code || "LOGIN_ERROR",
          errorMessage: error.message,
        });
      }

      // Erreur système
      return reply.code(500).send({
        status: "failed",
        errorCode: "INTERNAL_ERROR",
        errorName: "SystemError",
        errorMessage:
          "Une erreur inattendue s'est produite lors de la connexion",
      });
    }
  }

  /**
   * 🔄 Refresh access token
   */
  static async refreshToken(request, reply) {
    try {
      const { refreshToken } = request.body;

      if (!refreshToken) {
        const language = I18nService.getRequestLanguage(request);
        return reply.code(400).send({
          status: "failed",
          errorCode: "400",
          errorName: "MISSING_REFRESH_TOKEN",
          errorMessage: I18nService.getAuthErrorMessage(
            "refresh_token_required",
            language
          ),
        });
      }

      // Call the service to refresh the token
      const language = I18nService.getRequestLanguage(request);
      const result = await AuthService.refreshAccessToken(
        refreshToken,
        language
      );
      return reply.send({
        status: "success",
        data: {
          accessToken: result.accessToken,
          expiresIn: result.expiresIn,
        },
        message: I18nService.getAuthErrorMessage("token_refreshed", language),
      });
    } catch (error) {
      // ✅ FIX 1: Utilisation de la méthode commune
      return AuthController.handleClientError(
        error,
        reply,
        "TOKEN_REFRESH_ERROR"
      );
    }
  }

  /**
   * 🧪 Generate test tokens with custom expiration (DEV ONLY)
   */
  static async generateTestTokens(request, reply) {
    try {
      // Vérifier qu'on est en développement
      if (process.env.NODE_ENV !== "development") {
        return reply.code(403).send({
          status: "failed",
          errorCode: "403",
          errorName: "FORBIDDEN",
          errorMessage:
            "Endpoint de test disponible uniquement en développement",
        });
      }

      // Récupérer l'userId depuis le token d'authentification
      const userId = request.user._id;
      const { accessTokenExpiresIn = "24h", refreshTokenExpiresIn = "7d" } =
        request.body;

      // Générer les tokens avec expiration personnalisée
      const accessToken = jwt.sign(
        { userId, type: "access" },
        config.JWT_SECRET,
        { expiresIn: accessTokenExpiresIn }
      );

      const refreshToken = jwt.sign(
        { userId, type: "refresh" },
        config.JWT_SECRET,
        { expiresIn: refreshTokenExpiresIn }
      );

      request.log.info("Tokens de test générés", {
        userId: userId.toString(),
        accessTokenExpiresIn,
        refreshTokenExpiresIn,
        userEmail: request.user.email,
      });

      return reply.send({
        status: "success",
        data: {
          accessToken,
          refreshToken,
          accessTokenExpiresIn,
          refreshTokenExpiresIn,
          generatedAt: new Date().toISOString(),
        },
        message: `Tokens de test générés pour ${request.user.name}`,
      });
    } catch (error) {
      request.log.error("Erreur génération tokens de test", error);

      return reply.code(500).send({
        status: "failed",
        errorCode: "500",
        errorName: "SYSTEM_ERROR",
        errorMessage: "Erreur lors de la génération des tokens de test",
      });
    }
  }

  /**
   * 🚪 Logout
   */
  static async logout(request, reply) {
    try {
      // 🌍 Obtenir la langue de la requête
      const language = I18nService.getRequestLanguage(request);

      // 🆕 Ajouter le token à la blacklist
      const token = request.headers.authorization?.replace("Bearer ", "");
      if (token) {
        await TokenBlacklistService.blacklistToken(
          token,
          request.user.userId || request.user._id,
          "logout"
        );
      }

      AuthController.logger.auth(
        "Déconnexion utilisateur",
        {
          email: request.user.email,
          tokenBlacklisted: !!token,
          language,
        },
        {
          userId: request.user._id.toString(),
          email: request.user.email,
          action: "logout",
        }
      );

      // 🌍 Message traduit selon la langue détectée
      const message = I18nService.getMessage("auth.logout_success", language);

      return reply.success(null, message);
    } catch (error) {
      // ✅ FIX: Utiliser AuthController au lieu de this pour les méthodes statiques
      return AuthController.handleClientError(error, reply, "LOGOUT_ERROR");
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
      return AuthController.handleClientError(
        error,
        reply,
        "PASSWORD_RESET_ERROR"
      );
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
      return AuthController.handleClientError(
        error,
        reply,
        "PASSWORD_RESET_ERROR"
      );
    }
  }
}

export default AuthController;
