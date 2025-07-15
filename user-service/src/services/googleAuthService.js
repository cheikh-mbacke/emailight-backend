// ============================================================================
// 📁 src/services/googleAuthService.js - Service de vérification Google OAuth
// ============================================================================

import { OAuth2Client } from "google-auth-library";
import config from "../config/env.js";
import {
  AuthError,
  ValidationError,
  SystemError,
} from "../utils/customError.js";
import { AUTH_ERRORS } from "../utils/errorCodes.js";
import GoogleAuthService from "../services/googleAuthService.js";

/**
 * 🔍 Google Authentication Service
 */
class GoogleAuthService {
  static client = null;
  static logger = null;

  /**
   * ✅ Injection du logger
   */
  static setLogger(injectedLogger) {
    this.logger = injectedLogger;
  }

  /**
   * 🚀 Initialize Google OAuth client
   */
  static initialize() {
    try {
      if (!config.GOOGLE_CLIENT_ID) {
        this.logger?.warn("Google OAuth désactivé - GOOGLE_CLIENT_ID manquant");
        return false;
      }

      this.client = new OAuth2Client(config.GOOGLE_CLIENT_ID);

      this.logger?.success("Google OAuth client initialisé", {
        clientId: config.GOOGLE_CLIENT_ID ? "***configured***" : "missing",
      });

      return true;
    } catch (error) {
      this.logger?.error("Erreur initialisation Google OAuth client", error, {
        action: "google_oauth_init_failed",
      });
      return false;
    }
  }

  /**
   * 🔍 Google OAuth authentication
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

      // ✅ CORRECTION: Utilisation directe du service importé
      const googleUserData =
        await GoogleAuthService.verifyGoogleToken(googleToken);

      // ✅ CORRECTION: Gestion d'erreurs cohérente
      if (!googleUserData) {
        return reply.code(401).send({
          error: "Token Google invalide",
          code: "INVALID_GOOGLE_TOKEN",
        });
      }

      // Authenticate with Google data
      const result = await AuthService.authenticateWithGoogle(googleUserData);

      // Update user activity
      const user = await User.findById(result.user.id);
      await user.updateLastActive(request.ip, request.headers["user-agent"]);

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
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "GOOGLE_AUTH_ERROR",
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * 🔍 Verify Google ID token and extract user data
   */
  static async verifyGoogleToken(idToken) {
    try {
      // Initialize client if not done
      if (!this.client) {
        const initialized = this.initialize();
        if (!initialized) {
          throw new AuthError(
            "Service Google OAuth non disponible",
            "GOOGLE_OAUTH_UNAVAILABLE"
          );
        }
      }

      if (!idToken || typeof idToken !== "string") {
        throw new ValidationError(
          "Token Google invalide",
          "INVALID_GOOGLE_TOKEN"
        );
      }

      this.logger?.debug("Vérification token Google en cours", {
        tokenLength: idToken.length,
        action: "google_token_verification_start",
      });

      // Verify the token with Google
      const ticket = await this.client.verifyIdToken({
        idToken: idToken,
        audience: config.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new AuthError(
          "Token Google invalide - payload vide",
          AUTH_ERRORS.INVALID_TOKEN
        );
      }

      // Extract and validate user data
      const userData = this.extractUserData(payload);

      this.logger?.auth(
        "Token Google vérifié avec succès",
        {
          googleId: userData.googleId,
          email: userData.email,
          emailVerified: userData.emailVerified,
          domain: userData.domain,
        },
        {
          action: "google_token_verified",
          googleId: userData.googleId,
          email: userData.email,
        }
      );

      return userData;
    } catch (error) {
      // Handle specific Google Auth errors
      if (
        error.message?.includes("Token used too early") ||
        error.message?.includes("Token used too late")
      ) {
        this.logger?.warn(
          "Token Google expiré ou invalide",
          {
            error: error.message,
          },
          {
            action: "google_token_expired",
          }
        );

        throw new AuthError("Token Google expiré", AUTH_ERRORS.TOKEN_EXPIRED);
      }

      if (error.message?.includes("Invalid token signature")) {
        this.logger?.warn(
          "Signature token Google invalide",
          {
            error: error.message,
          },
          {
            action: "google_token_invalid_signature",
          }
        );

        throw new AuthError("Token Google invalide", AUTH_ERRORS.INVALID_TOKEN);
      }

      if (error.message?.includes("Wrong number of segments")) {
        this.logger?.warn(
          "Format token Google invalide",
          {
            error: error.message,
          },
          {
            action: "google_token_invalid_format",
          }
        );

        throw new ValidationError(
          "Format de token Google invalide",
          "INVALID_GOOGLE_TOKEN_FORMAT"
        );
      }

      // If it's already an operational error, re-throw
      if (error.isOperational) {
        throw error;
      }

      // System error
      this.logger?.error(
        "Erreur lors de la vérification du token Google",
        error,
        {
          action: "google_token_verification_failed",
        }
      );

      throw new SystemError(
        "Erreur lors de la vérification du token Google",
        error
      );
    }
  }

  /**
   * 📋 Extract and validate user data from Google payload
   */
  static extractUserData(payload) {
    try {
      // Required fields
      const googleId = payload.sub;
      const email = payload.email;
      const emailVerified = payload.email_verified;
      const name = payload.name;

      if (!googleId || !email || !name) {
        throw new ValidationError(
          "Données Google incomplètes",
          "INCOMPLETE_GOOGLE_DATA"
        );
      }

      if (!emailVerified) {
        throw new AuthError(
          "Email Google non vérifié",
          "GOOGLE_EMAIL_NOT_VERIFIED"
        );
      }

      // Optional fields
      const picture = payload.picture;
      const givenName = payload.given_name;
      const familyName = payload.family_name;
      const locale = payload.locale;

      // Extract domain for additional validation if needed
      const domain = email.split("@")[1];

      // Build user data object
      const userData = {
        googleId,
        email: email.toLowerCase(),
        name: name.trim(),
        emailVerified,
        picture,
        givenName,
        familyName,
        locale,
        domain,
        // Additional Google-specific data
        googleData: {
          aud: payload.aud, // audience
          iss: payload.iss, // issuer
          iat: payload.iat, // issued at
          exp: payload.exp, // expires at
        },
      };

      this.logger?.debug(
        "Données utilisateur extraites de Google",
        {
          googleId,
          email,
          domain,
          hasProfilePicture: !!picture,
          locale,
        },
        {
          action: "google_user_data_extracted",
          googleId,
          email,
        }
      );

      return userData;
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur extraction données Google", error, {
        action: "google_data_extraction_failed",
      });

      throw new SystemError(
        "Erreur lors de l'extraction des données Google",
        error
      );
    }
  }

  /**
   * 🔒 Additional security checks (optional)
   */
  static performSecurityChecks(userData) {
    const warnings = [];
    const blockers = [];

    // Check for suspicious domains (optional)
    const suspiciousDomains = [
      "tempmail.com",
      "10minutemail.com",
      "guerrillamail.com",
    ];
    if (suspiciousDomains.includes(userData.domain)) {
      warnings.push(`Domain potentially suspicious: ${userData.domain}`);
    }

    // Check locale consistency (optional)
    if (
      userData.locale &&
      !userData.locale.startsWith("fr") &&
      !userData.locale.startsWith("en")
    ) {
      warnings.push(`Unusual locale: ${userData.locale}`);
    }

    // Check account age through token (optional advanced check)
    const now = Math.floor(Date.now() / 1000);
    const tokenAge = now - userData.googleData.iat;

    if (tokenAge > 300) {
      // 5 minutes
      blockers.push("Token trop ancien");
    }

    if (warnings.length > 0) {
      this.logger?.warn(
        "Avertissements sécurité Google OAuth",
        {
          googleId: userData.googleId,
          email: userData.email,
          warnings,
        },
        {
          action: "google_security_warnings",
          googleId: userData.googleId,
          email: userData.email,
        }
      );
    }

    if (blockers.length > 0) {
      this.logger?.warn(
        "Problèmes sécurité Google OAuth",
        {
          googleId: userData.googleId,
          email: userData.email,
          blockers,
        },
        {
          action: "google_security_blockers",
          googleId: userData.googleId,
          email: userData.email,
        }
      );

      throw new AuthError(
        "Vérifications de sécurité échouées",
        "GOOGLE_SECURITY_CHECK_FAILED",
        { blockers }
      );
    }

    return { warnings, passed: true };
  }

  /**
   * 📊 Get service status
   */
  static getStatus() {
    return {
      initialized: !!this.client,
      clientConfigured: !!config.GOOGLE_CLIENT_ID,
      available: !!(this.client && config.GOOGLE_CLIENT_ID),
    };
  }

  /**
   * 🧪 Test Google OAuth configuration (for development)
   */
  static async testConfiguration() {
    try {
      const status = this.getStatus();

      if (!status.available) {
        return {
          success: false,
          error: "Google OAuth non configuré",
          status,
        };
      }

      // Try to create a client and verify basic functionality
      const testClient = new OAuth2Client(config.GOOGLE_CLIENT_ID);

      return {
        success: true,
        message: "Configuration Google OAuth valide",
        status,
        clientId: config.GOOGLE_CLIENT_ID ? "***configured***" : "missing",
      };
    } catch (error) {
      this.logger?.error("Test configuration Google OAuth échoué", error, {
        action: "google_config_test_failed",
      });

      return {
        success: false,
        error: error.message,
        status: this.getStatus(),
      };
    }
  }
}

export default GoogleAuthService;
