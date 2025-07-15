// ============================================================================
// 📁 src/services/outlookOAuthService.js - Service OAuth Outlook/Microsoft COMPLET
// ============================================================================

import config from "../config/env.js";
import EmailAccount from "../models/EmailAccount.js";
import User from "../models/User.js";
import {
  AuthError,
  ValidationError,
  SystemError,
  ConflictError,
} from "../utils/customError.js";
import { EMAIL_ACCOUNT_ERRORS } from "../utils/errorCodes.js";

/**
 * 📧 Outlook OAuth Service
 */
class OutlookOAuthService {
  static logger = null;

  /**
   * ✅ Injection du logger
   */
  static setLogger(injectedLogger) {
    this.logger = injectedLogger;
  }

  /**
   * 🚀 Initialize Outlook OAuth configuration
   */
  static initialize() {
    try {
      if (!config.OUTLOOK_CLIENT_ID || !config.OUTLOOK_CLIENT_SECRET) {
        this.logger?.warn("Outlook OAuth désactivé - Clés manquantes", {
          clientId: !!config.OUTLOOK_CLIENT_ID,
          clientSecret: !!config.OUTLOOK_CLIENT_SECRET,
        });
        return false;
      }

      this.logger?.success("Outlook OAuth configuré", {
        clientId: "***configured***",
        redirectUri: config.OUTLOOK_REDIRECT_URI,
      });

      return true;
    } catch (error) {
      this.logger?.error("Erreur initialisation Outlook OAuth", error, {
        action: "outlook_oauth_init_failed",
      });
      return false;
    }
  }

  /**
   * 🔗 Generate Outlook OAuth authorization URL
   */
  static generateAuthUrl(userId, state = null) {
    try {
      if (!config.OUTLOOK_CLIENT_ID || !config.OUTLOOK_CLIENT_SECRET) {
        throw new AuthError(
          "Service Outlook OAuth non disponible",
          "OUTLOOK_OAUTH_UNAVAILABLE"
        );
      }

      const scopes = [
        "https://graph.microsoft.com/Mail.Send",
        "https://graph.microsoft.com/Mail.Read",
        "https://graph.microsoft.com/User.Read",
        "offline_access", // Pour obtenir un refresh token
      ];

      const params = new URLSearchParams({
        client_id: config.OUTLOOK_CLIENT_ID,
        response_type: "code",
        redirect_uri: config.OUTLOOK_REDIRECT_URI,
        scope: scopes.join(" "),
        state: state || userId.toString(),
        response_mode: "query",
        prompt: "consent", // Force l'affichage du consentement
      });

      const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;

      this.logger?.info("URL d'autorisation Outlook générée", {
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

      this.logger?.error("Erreur génération URL Outlook OAuth", error, {
        action: "outlook_auth_url_generation_failed",
        userId: userId?.toString(),
      });

      throw new SystemError(
        "Erreur lors de la génération de l'URL d'autorisation Outlook",
        error
      );
    }
  }

  /**
   * 🔑 Exchange authorization code for tokens
   */
  static async exchangeCodeForTokens(code, userId) {
    try {
      if (!code) {
        throw new ValidationError(
          "Code d'autorisation manquant",
          "MISSING_AUTHORIZATION_CODE"
        );
      }

      const tokenUrl =
        "https://login.microsoftonline.com/common/oauth2/v2.0/token";

      const body = new URLSearchParams({
        client_id: config.OUTLOOK_CLIENT_ID,
        client_secret: config.OUTLOOK_CLIENT_SECRET,
        code: code,
        redirect_uri: config.OUTLOOK_REDIRECT_URI,
        grant_type: "authorization_code",
      });

      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      const tokens = await response.json();

      if (!response.ok || tokens.error) {
        throw new AuthError(
          `Erreur Outlook OAuth: ${tokens.error_description || tokens.error}`,
          "OUTLOOK_TOKEN_EXCHANGE_FAILED"
        );
      }

      if (!tokens.access_token) {
        throw new AuthError(
          "Tokens Outlook invalides",
          "INVALID_OUTLOOK_TOKENS"
        );
      }

      // Obtenir les informations du profil utilisateur
      const userInfo = await this.getUserInfo(tokens.access_token);

      this.logger?.auth(
        "Tokens Outlook obtenus avec succès",
        {
          email: userInfo.email,
          hasRefreshToken: !!tokens.refresh_token,
          expiresIn: tokens.expires_in,
        },
        {
          userId: userId.toString(),
          action: "outlook_tokens_obtained",
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

      // Gestion erreurs spécifiques Microsoft
      if (error.message?.includes("invalid_grant")) {
        throw new AuthError(
          "Code d'autorisation Outlook expiré ou invalide",
          "OUTLOOK_INVALID_GRANT"
        );
      }

      this.logger?.error("Erreur échange code Outlook", error, {
        action: "outlook_token_exchange_failed",
        userId: userId?.toString(),
      });

      throw new SystemError(
        "Erreur lors de l'échange du code d'autorisation Outlook",
        error
      );
    }
  }

  /**
   * 👤 Get user info from Microsoft Graph API
   */
  static async getUserInfo(accessToken) {
    try {
      const response = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Microsoft Graph API error: ${response.status}`);
      }

      const userInfo = await response.json();

      return {
        email: userInfo.mail || userInfo.userPrincipalName,
        name: userInfo.displayName,
        providerId: userInfo.id,
        verified: true, // Microsoft accounts are always verified
      };
    } catch (error) {
      this.logger?.error("Erreur récupération info utilisateur Outlook", error);
      throw new SystemError(
        "Erreur lors de la récupération des informations Outlook",
        error
      );
    }
  }

  /**
   * 💾 Save Outlook account to database
   */
  static async saveOutlookAccount(userId, tokens, userInfo, scopes) {
    try {
      // Vérifier si ce compte Outlook existe déjà
      const existingAccount = await EmailAccount.findOne({
        userId,
        email: userInfo.email.toLowerCase(),
        provider: "outlook",
      });

      if (existingAccount) {
        throw new ConflictError(
          "Ce compte Outlook est déjà connecté",
          EMAIL_ACCOUNT_ERRORS.EMAIL_ACCOUNT_ALREADY_EXISTS
        );
      }

      // Calculer l'expiration du token
      const tokenExpiry = new Date();
      tokenExpiry.setSeconds(
        tokenExpiry.getSeconds() + (tokens.expires_in || 3600)
      );

      // Créer le nouveau compte email
      const emailAccount = new EmailAccount({
        userId,
        email: userInfo.email.toLowerCase(),
        displayName: userInfo.name || userInfo.email,
        provider: "outlook",
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
        "Compte Outlook connecté avec succès",
        {
          email: userInfo.email,
          scopes: scopes.length,
          hasRefreshToken: !!tokens.refresh_token,
        },
        {
          userId: userId.toString(),
          email: userInfo.email,
          action: "outlook_account_connected",
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

      this.logger?.error("Erreur sauvegarde compte Outlook", error, {
        action: "outlook_account_save_failed",
        userId: userId?.toString(),
        email: userInfo?.email,
      });

      throw new SystemError(
        "Erreur lors de la sauvegarde du compte Outlook",
        error
      );
    }
  }

  /**
   * 🔄 Refresh Outlook access token
   */
  static async refreshAccessToken(emailAccount) {
    try {
      const refreshToken = emailAccount.decryptToken(emailAccount.refreshToken);

      if (!refreshToken) {
        throw new AuthError(
          "Token de rafraîchissement Outlook manquant",
          "OUTLOOK_REFRESH_TOKEN_MISSING"
        );
      }

      const tokenUrl =
        "https://login.microsoftonline.com/common/oauth2/v2.0/token";

      const body = new URLSearchParams({
        client_id: config.OUTLOOK_CLIENT_ID,
        client_secret: config.OUTLOOK_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      });

      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      const tokens = await response.json();

      if (!response.ok || tokens.error) {
        throw new AuthError(
          `Erreur refresh Outlook: ${tokens.error_description || tokens.error}`,
          "OUTLOOK_TOKEN_REFRESH_FAILED"
        );
      }

      if (!tokens.access_token) {
        throw new AuthError(
          "Impossible de rafraîchir le token Outlook",
          "OUTLOOK_TOKEN_REFRESH_FAILED"
        );
      }

      // Mettre à jour le compte en base
      const tokenExpiry = new Date();
      tokenExpiry.setSeconds(
        tokenExpiry.getSeconds() + (tokens.expires_in || 3600)
      );

      emailAccount.accessToken = tokens.access_token;
      if (tokens.refresh_token) {
        emailAccount.refreshToken = tokens.refresh_token;
      }
      emailAccount.tokenExpiry = tokenExpiry;

      await emailAccount.clearErrors(); // Reset error count
      await emailAccount.save();

      this.logger?.user(
        "Token Outlook rafraîchi avec succès",
        {
          email: emailAccount.email,
          newExpiry: tokenExpiry,
        },
        {
          userId: emailAccount.userId.toString(),
          email: emailAccount.email,
          action: "outlook_token_refreshed",
        }
      );

      return {
        refreshed: true,
        newExpiry: tokenExpiry,
        accessToken: tokens.access_token,
      };
    } catch (error) {
      // Marquer le compte comme ayant des erreurs
      await emailAccount.recordError(error);

      if (error.message?.includes("invalid_grant")) {
        throw new AuthError(
          "Token Outlook expiré, reconnexion nécessaire",
          "OUTLOOK_TOKEN_EXPIRED_RECONNECT_REQUIRED"
        );
      }

      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur refresh token Outlook", error, {
        action: "outlook_token_refresh_failed",
        userId: emailAccount.userId?.toString(),
        email: emailAccount.email,
      });

      throw new SystemError(
        "Erreur lors du rafraîchissement du token Outlook",
        error
      );
    }
  }

  /**
   * 🧪 Test Outlook connection
   */
  static async testConnection(emailAccount) {
    try {
      const accessToken = emailAccount.decryptToken(emailAccount.accessToken);

      if (!accessToken) {
        throw new AuthError(
          "Token d'accès Outlook manquant",
          "OUTLOOK_ACCESS_TOKEN_MISSING"
        );
      }

      // Test simple : récupérer le profil
      const response = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

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

        throw new Error(`Microsoft Graph API error: ${response.status}`);
      }

      const userInfo = await response.json();
      const userEmail = userInfo.mail || userInfo.userPrincipalName;

      // Vérifier que l'email correspond
      if (userEmail.toLowerCase() !== emailAccount.email) {
        throw new AuthError(
          "Email Outlook ne correspond pas au compte connecté",
          "OUTLOOK_EMAIL_MISMATCH"
        );
      }

      await emailAccount.clearErrors();
      await emailAccount.markAsUsed();

      return {
        connectionTest: true,
        status: "healthy",
        email: userEmail,
        verified: true,
        lastTested: new Date(),
      };
    } catch (error) {
      await emailAccount.recordError(error);

      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur test connexion Outlook", error, {
        action: "outlook_connection_test_failed",
        userId: emailAccount.userId?.toString(),
        email: emailAccount.email,
      });

      throw new SystemError("Erreur lors du test de connexion Outlook", error);
    }
  }

  /**
   * 📊 Get service status
   */
  static getStatus() {
    return {
      initialized: true,
      clientConfigured: !!(
        config.OUTLOOK_CLIENT_ID && config.OUTLOOK_CLIENT_SECRET
      ),
      available: !!(config.OUTLOOK_CLIENT_ID && config.OUTLOOK_CLIENT_SECRET),
      redirectUri: config.OUTLOOK_REDIRECT_URI,
    };
  }

  /**
   * 🧪 Test Outlook OAuth configuration
   */
  static async testConfiguration() {
    try {
      const status = this.getStatus();

      if (!status.available) {
        return {
          success: false,
          error: "Outlook OAuth non configuré",
          status,
        };
      }

      return {
        success: true,
        message: "Configuration Outlook OAuth valide",
        status,
        scopes: [
          "https://graph.microsoft.com/Mail.Send",
          "https://graph.microsoft.com/Mail.Read",
          "https://graph.microsoft.com/User.Read",
          "offline_access",
        ],
      };
    } catch (error) {
      this.logger?.error("Test configuration Outlook OAuth échoué", error, {
        action: "outlook_config_test_failed",
      });

      return {
        success: false,
        error: error.message,
        status: this.getStatus(),
      };
    }
  }
}

export default OutlookOAuthService;