// ============================================================================
// 📁 src/services/gmailOAuthService.js - Service OAuth Gmail
// ============================================================================

import { OAuth2Client } from "google-auth-library";
import config from "../config/env.js";
import EmailAccount from "../models/EmailAccount.js";
import User from "../models/User.js";
import {
  AuthError,
  ValidationError,
  SystemError,
  ConflictError,
  ErrorFactory,
} from "../utils/customError.js";
import { AUTH_ERRORS, EMAIL_ACCOUNT_ERRORS } from "../utils/errorCodes.js";

/**
 * 📧 Gmail OAuth Service
 */
class GmailOAuthService {
  static client = null;
  static logger = null;

  /**
   * ✅ Injection du logger
   */
  static setLogger(injectedLogger) {
    this.logger = injectedLogger;
  }

  /**
   * 🚀 Initialize Gmail OAuth client
   */
  static initialize() {
    try {
      if (!config.GMAIL_CLIENT_ID || !config.GMAIL_CLIENT_SECRET) {
        this.logger?.warn("Gmail OAuth désactivé - Clés manquantes", {
          clientId: !!config.GMAIL_CLIENT_ID,
          clientSecret: !!config.GMAIL_CLIENT_SECRET,
        });
        return false;
      }

      this.client = new OAuth2Client(
        config.GMAIL_CLIENT_ID,
        config.GMAIL_CLIENT_SECRET,
        config.GMAIL_REDIRECT_URI
      );

      this.logger?.success("Gmail OAuth client initialisé", {
        clientId: "***configured***",
        redirectUri: config.GMAIL_REDIRECT_URI,
      });

      return true;
    } catch (error) {
      this.logger?.error("Erreur initialisation Gmail OAuth client", error, {
        action: "gmail_oauth_init_failed",
      });
      return false;
    }
  }

  /**
   * 🔗 Generate Gmail OAuth authorization URL
   */
  static generateAuthUrl(userId, state = null) {
    try {
      if (!this.client) {
        const initialized = this.initialize();
        if (!initialized) {
          throw new AuthError(
            "Service Gmail OAuth non disponible",
            "GMAIL_OAUTH_UNAVAILABLE"
          );
        }
      }

      const scopes = [
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ];

      const authUrl = this.client.generateAuthUrl({
        access_type: "offline", // Pour obtenir un refresh token
        scope: scopes,
        state: state || userId.toString(), // Identifier l'utilisateur
        prompt: "consent", // Force l'affichage du consentement
      });

      this.logger?.info("URL d'autorisation Gmail générée", {
        userId: userId.toString(),
        scopes: scopes.length,
      });

      return {
        authUrl,
        scopes,
        state: state || userId.toString(),
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur génération URL Gmail OAuth", error, {
        action: "gmail_auth_url_generation_failed",
        userId: userId?.toString(),
      });

      throw new SystemError(
        "Erreur lors de la génération de l'URL d'autorisation Gmail",
        error
      );
    }
  }

  /**
   * 🔑 Exchange authorization code for tokens
   */
  static async exchangeCodeForTokens(code, userId) {
    try {
      if (!this.client) {
        throw new AuthError(
          "Client Gmail OAuth non initialisé",
          "GMAIL_OAUTH_CLIENT_NOT_INITIALIZED"
        );
      }

      if (!code) {
        throw new ValidationError(
          "Code d'autorisation manquant",
          "MISSING_AUTHORIZATION_CODE"
        );
      }

      // Échanger le code contre des tokens
      const { tokens } = await this.client.getToken(code);

      if (!tokens.access_token) {
        throw new AuthError("Tokens Gmail invalides", "INVALID_GMAIL_TOKENS");
      }

      // Obtenir les informations du profil utilisateur
      this.client.setCredentials(tokens);
      const userInfo = await this.getUserInfo();

      this.logger?.auth(
        "Tokens Gmail obtenus avec succès",
        {
          email: userInfo.email,
          hasRefreshToken: !!tokens.refresh_token,
          scopes: tokens.scope?.split(" ").length || 0,
        },
        {
          userId: userId.toString(),
          action: "gmail_tokens_obtained",
          email: userInfo.email,
        }
      );

      return {
        tokens,
        userInfo,
        scopes: tokens.scope?.split(" ") || [],
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      // Gestion erreurs spécifiques Google
      if (error.message?.includes("invalid_grant")) {
        throw new AuthError(
          "Code d'autorisation Gmail expiré ou invalide",
          "GMAIL_INVALID_GRANT"
        );
      }

      this.logger?.error("Erreur échange code Gmail", error, {
        action: "gmail_token_exchange_failed",
        userId: userId?.toString(),
      });

      throw new SystemError(
        "Erreur lors de l'échange du code d'autorisation Gmail",
        error
      );
    }
  }

  /**
   * 👤 Get user info from Gmail API
   */
  static async getUserInfo() {
    try {
      const response = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${this.client.credentials.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw ErrorFactory.badRequest(
          `Erreur API Gmail: ${response.status}`,
          EMAIL_ACCOUNT_ERRORS.EMAIL_CONNECTION_FAILED
        );
      }

      const userInfo = await response.json();

      return {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        verified: userInfo.verified_email,
        providerId: userInfo.id,
      };
    } catch (error) {
      this.logger?.error("Erreur récupération info utilisateur Gmail", error);
      throw new SystemError(
        "Erreur lors de la récupération des informations Gmail",
        error
      );
    }
  }

  /**
   * 💾 Save Gmail account to database
   */
  static async saveGmailAccount(userId, tokens, userInfo, scopes) {
    try {
      // Vérifier si ce compte Gmail existe déjà
      const existingAccount = await EmailAccount.findOne({
        userId,
        email: userInfo.email.toLowerCase(),
        provider: "gmail",
      });

      if (existingAccount) {
        throw new ConflictError(
          "Ce compte Gmail est déjà connecté",
          EMAIL_ACCOUNT_ERRORS.EMAIL_ACCOUNT_ALREADY_EXISTS
        );
      }

      // Calculer l'expiration du token
      const tokenExpiry = new Date();
      tokenExpiry.setSeconds(
        tokenExpiry.getSeconds() + (tokens.expiry_date || 3600)
      );

      // Créer le nouveau compte email
      const emailAccount = new EmailAccount({
        userId,
        email: userInfo.email.toLowerCase(),
        displayName: userInfo.name || userInfo.email,
        provider: "gmail",
        providerId: userInfo.providerId,
        accessToken: tokens.access_token, // Sera chiffré par le middleware
        refreshToken: tokens.refresh_token, // Sera chiffré par le middleware
        tokenExpiry,
        scopes,
        isActive: true,
        isVerified: userInfo.verified,
      });

      await emailAccount.save();

      // Ajouter le compte à la liste de l'utilisateur
      await User.findByIdAndUpdate(userId, {
        $addToSet: { connectedEmailAccounts: emailAccount._id },
      });

      this.logger?.user(
        "Compte Gmail connecté avec succès",
        {
          email: userInfo.email,
          scopes: scopes.length,
          hasRefreshToken: !!tokens.refresh_token,
        },
        {
          userId: userId.toString(),
          email: userInfo.email,
          action: "gmail_account_connected",
        }
      );

      return {
        account: emailAccount.secureInfo,
        connected: true,
        connectedAt: new Date(),
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur sauvegarde compte Gmail", error, {
        action: "gmail_account_save_failed",
        userId: userId?.toString(),
        email: userInfo?.email,
      });

      throw new SystemError(
        "Erreur lors de la sauvegarde du compte Gmail",
        error
      );
    }
  }

  /**
   * 🔄 Refresh Gmail access token
   */
  static async refreshAccessToken(emailAccount) {
    try {
      if (!this.client) {
        this.initialize();
      }

      const refreshToken = emailAccount.decryptToken(emailAccount.refreshToken);

      if (!refreshToken) {
        throw new AuthError(
          "Token de rafraîchissement Gmail manquant",
          "GMAIL_REFRESH_TOKEN_MISSING"
        );
      }

      // Configurer le client avec le refresh token
      this.client.setCredentials({
        refresh_token: refreshToken,
      });

      // Rafraîchir le token
      const { credentials } = await this.client.refreshAccessToken();

      if (!credentials.access_token) {
        throw new AuthError(
          "Impossible de rafraîchir le token Gmail",
          "GMAIL_TOKEN_REFRESH_FAILED"
        );
      }

      // Mettre à jour le compte en base
      const tokenExpiry = new Date();
      tokenExpiry.setSeconds(
        tokenExpiry.getSeconds() + (credentials.expiry_date || 3600)
      );

      emailAccount.accessToken = credentials.access_token;
      if (credentials.refresh_token) {
        emailAccount.refreshToken = credentials.refresh_token;
      }
      emailAccount.tokenExpiry = tokenExpiry;

      await emailAccount.clearErrors(); // Reset error count
      await emailAccount.save();

      this.logger?.user(
        "Token Gmail rafraîchi avec succès",
        {
          email: emailAccount.email,
          newExpiry: tokenExpiry,
        },
        {
          userId: emailAccount.userId.toString(),
          email: emailAccount.email,
          action: "gmail_token_refreshed",
        }
      );

      return {
        refreshed: true,
        newExpiry: tokenExpiry,
        accessToken: credentials.access_token,
      };
    } catch (error) {
      // Marquer le compte comme ayant des erreurs
      await emailAccount.recordError(error);

      if (error.message?.includes("invalid_grant")) {
        throw new AuthError(
          "Token Gmail expiré, reconnexion nécessaire",
          "GMAIL_TOKEN_EXPIRED_RECONNECT_REQUIRED"
        );
      }

      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur refresh token Gmail", error, {
        action: "gmail_token_refresh_failed",
        userId: emailAccount.userId?.toString(),
        email: emailAccount.email,
      });

      throw new SystemError(
        "Erreur lors du rafraîchissement du token Gmail",
        error
      );
    }
  }

  /**
   * 🧪 Test Gmail connection
   */
  static async testConnection(emailAccount) {
    try {
      if (!this.client) {
        this.initialize();
      }

      const accessToken = emailAccount.decryptToken(emailAccount.accessToken);

      if (!accessToken) {
        throw new AuthError(
          "Token d'accès Gmail manquant",
          "GMAIL_ACCESS_TOKEN_MISSING"
        );
      }

      // Test simple : récupérer le profil
      const response = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          // Token expiré, essayer de le rafraîchir
          const refreshResult = await this.refreshAccessToken(emailAccount);
          return {
            connectionTest: true,
            status: "token_refreshed",
            message: "Token rafraîchi automatiquement",
            refreshed: refreshResult.refreshed,
          };
        }

        throw ErrorFactory.badRequest(
          `Erreur API Gmail: ${response.status}`,
          EMAIL_ACCOUNT_ERRORS.EMAIL_CONNECTION_FAILED
        );
      }

      const userInfo = await response.json();

      // Vérifier que l'email correspond
      if (userInfo.email.toLowerCase() !== emailAccount.email) {
        throw new AuthError(
          "Email Gmail ne correspond pas au compte connecté",
          "GMAIL_EMAIL_MISMATCH"
        );
      }

      await emailAccount.clearErrors();
      await emailAccount.markAsUsed();

      return {
        connectionTest: true,
        status: "healthy",
        email: userInfo.email,
        verified: userInfo.verified_email,
        lastTested: new Date(),
      };
    } catch (error) {
      await emailAccount.recordError(error);

      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur test connexion Gmail", error, {
        action: "gmail_connection_test_failed",
        userId: emailAccount.userId?.toString(),
        email: emailAccount.email,
      });

      throw new SystemError("Erreur lors du test de connexion Gmail", error);
    }
  }

  /**
   * 📊 Get service status
   */
  static getStatus() {
    return {
      initialized: !!this.client,
      clientConfigured: !!(
        config.GMAIL_CLIENT_ID && config.GMAIL_CLIENT_SECRET
      ),
      available: !!(
        this.client &&
        config.GMAIL_CLIENT_ID &&
        config.GMAIL_CLIENT_SECRET
      ),
      redirectUri: config.GMAIL_REDIRECT_URI,
    };
  }

  /**
   * 🧪 Test Gmail OAuth configuration
   */
  static async testConfiguration() {
    try {
      const status = this.getStatus();

      if (!status.available) {
        return {
          success: false,
          error: "Gmail OAuth non configuré",
          status,
        };
      }

      return {
        success: true,
        message: "Configuration Gmail OAuth valide",
        status,
        scopes: [
          "https://www.googleapis.com/auth/gmail.send",
          "https://www.googleapis.com/auth/gmail.readonly",
          "https://www.googleapis.com/auth/userinfo.email",
          "https://www.googleapis.com/auth/userinfo.profile",
        ],
      };
    } catch (error) {
      this.logger?.error("Test configuration Gmail OAuth échoué", error, {
        action: "gmail_config_test_failed",
      });

      return {
        success: false,
        error: error.message,
        status: this.getStatus(),
      };
    }
  }
}

export default GmailOAuthService;
