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

/**
 * 🔐 Authentication service
 */
class AuthService {
  static setLogger(injectedLogger) {
    this.logger = injectedLogger;
  }

  /**
   * Register a new user
   * ✅ CORRIGÉ: Defensive programming + gestion atomique
   */
  static async registerUser(userData) {
    // ✅ FIX 1: Defensive programming - validation stricte des entrées
    if (!userData || typeof userData !== "object") {
      throw new ValidationError(
        "Données utilisateur manquantes ou invalides",
        "INVALID_USER_DATA"
      );
    }

    const { name, email, password } = userData;

    // Validation des champs requis
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      throw new ValidationError("Le nom est requis", "MISSING_NAME");
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      throw new ValidationError("Email invalide", "INVALID_EMAIL");
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      throw new ValidationError(
        "Mot de passe requis (minimum 6 caractères)",
        "INVALID_PASSWORD"
      );
    }

    try {
      // ✅ FIX 3: Race condition résolue - utilisation de l'index unique MongoDB
      // MongoDB garantit l'atomicité avec l'index unique sur email
      // Si deux requêtes simultanées tentent de créer le même email,
      // MongoDB rejettera automatiquement la seconde avec une erreur de duplicata

      const user = new User({
        name: name.trim(),
        email: email.toLowerCase().trim(),
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
          "Un compte avec cette adresse email existe déjà",
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
   */
  static async authenticateUser(credentials) {
    // ✅ FIX 1: Defensive programming pour credentials
    if (!credentials || typeof credentials !== "object") {
      throw new ValidationError(
        "Identifiants manquants",
        "MISSING_CREDENTIALS"
      );
    }

    const { email, password } = credentials;

    if (!email || typeof email !== "string") {
      throw new ValidationError("Email requis", "MISSING_EMAIL");
    }

    if (!password || typeof password !== "string") {
      throw new ValidationError("Mot de passe requis", "MISSING_PASSWORD");
    }

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
   * 🔄 Generate access and refresh tokens
   */
  static generateTokens(userId) {
    // ✅ FIX 1: Defensive programming pour userId
    if (!userId) {
      throw new ValidationError("ID utilisateur requis", "MISSING_USER_ID");
    }

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
  static async refreshAccessToken(refreshToken) {
    // ✅ FIX 1: Defensive programming
    if (!refreshToken || typeof refreshToken !== "string") {
      throw new ValidationError(
        "Token de rafraîchissement requis",
        "MISSING_REFRESH_TOKEN"
      );
    }

    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

      if (decoded.type !== "refresh") {
        throw new AuthError(
          "Token de rafraîchissement invalide",
          AUTH_ERRORS.INVALID_TOKEN
        );
      }

      // Find user
      const user = await User.findById(decoded.userId);

      if (!user) {
        throw new NotFoundError(
          "Utilisateur introuvable",
          USER_ERRORS.USER_NOT_FOUND
        );
      }

      if (!user.isActive) {
        throw new AuthError("Compte désactivé", AUTH_ERRORS.ACCOUNT_DISABLED);
      }

      if (user.isAccountLocked()) {
        throw new AuthError("Compte verrouillé", AUTH_ERRORS.ACCOUNT_LOCKED);
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
            "Signature du token invalide",
            AUTH_ERRORS.INVALID_TOKEN
          );
        } else if (error.message.includes("malformed")) {
          throw new AuthError(
            "Format du token invalide",
            AUTH_ERRORS.INVALID_TOKEN
          );
        } else {
          throw new AuthError(
            "Token de rafraîchissement invalide",
            AUTH_ERRORS.INVALID_TOKEN
          );
        }
      }

      if (error.name === "TokenExpiredError") {
        throw new AuthError(
          "Token de rafraîchissement expiré",
          AUTH_ERRORS.TOKEN_EXPIRED
        );
      }

      if (error.name === "NotBeforeError") {
        throw new AuthError(
          "Token non encore valide",
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
   * 🔍 Authenticate with Google OAuth2
   * ✅ CORRIGÉ: Logique linkedAccount corrigée
   */
  static async authenticateWithGoogle(googleUserData) {
    // ✅ FIX 1: Defensive programming
    if (!googleUserData || typeof googleUserData !== "object") {
      throw new ValidationError(
        "Données Google manquantes",
        "MISSING_GOOGLE_DATA"
      );
    }

    const { googleId, email, name, picture } = googleUserData;

    try {
      // Validation des données Google
      if (!googleId || !email) {
        throw new ValidationError(
          "Données Google insuffisantes",
          "INVALID_GOOGLE_DATA"
        );
      }

      // Rechercher un utilisateur existant par email
      let user = await User.findOne({ email: email.toLowerCase() });

      if (user) {
        // Utilisateur existant - vérifier si on doit le lier à Google
        const wasLinked = !user.googleId; // ✅ FIX 2: Variable pour clarifier la logique

        if (!user.googleId) {
          // Lier le compte existant à Google
          user.googleId = googleId;
          user.authProvider = "google";

          if (picture && !user.profilePictureUrl) {
            user.profilePictureUrl = picture;
          }

          await user.save();

          this.logger.auth(
            "Compte existant lié à Google",
            { email: user.email, googleId },
            {
              userId: user._id.toString(),
              email: user.email,
              action: "google_account_linked",
            }
          );
        }

        // Vérifications de sécurité
        if (!user.isActive) {
          throw new AuthError(
            "Votre compte a été désactivé",
            AUTH_ERRORS.ACCOUNT_DISABLED
          );
        }

        if (user.isAccountLocked()) {
          throw new AuthError(
            "Compte temporairement verrouillé",
            AUTH_ERRORS.ACCOUNT_LOCKED
          );
        }

        this.logger.auth(
          "Connexion Google réussie",
          { email: user.email, googleId },
          {
            userId: user._id.toString(),
            email: user.email,
            action: "google_login_success",
          }
        );

        return {
          user: user.profile,
          isNew: false,
          linkedAccount: wasLinked, // ✅ FIX 2: Logique corrigée - true si on vient de lier
        };
      } else {
        // Nouvel utilisateur - création de compte
        user = new User({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          googleId,
          authProvider: "google",
          profilePictureUrl: picture,
          isEmailVerified: true, // Google emails are verified
          // Pas de mot de passe pour les comptes Google
        });

        await user.save();

        this.logger.auth(
          "Nouveau compte créé via Google",
          { email: user.email, googleId },
          {
            userId: user._id.toString(),
            email: user.email,
            action: "google_account_created",
          }
        );

        return {
          user: user.profile,
          isNew: true,
          linkedAccount: false, // Nouveau compte, pas de liaison
        };
      }
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger.error("Erreur lors de l'authentification Google", error, {
        action: "google_auth_failed",
        email: email?.toLowerCase(),
        googleId,
      });

      throw new SystemError("Erreur lors de l'authentification Google", error, {
        email: email?.toLowerCase(),
        googleId,
      });
    }
  }

  /**
   * Change password
   * ✅ Amélioré avec defensive programming
   */
  static async changePassword(userId, passwordData) {
    // ✅ FIX 1: Defensive programming
    if (!userId) {
      throw new ValidationError("ID utilisateur requis", "MISSING_USER_ID");
    }

    if (!passwordData || typeof passwordData !== "object") {
      throw new ValidationError(
        "Données de mot de passe manquantes",
        "MISSING_PASSWORD_DATA"
      );
    }

    const { currentPassword, newPassword } = passwordData;

    if (!currentPassword || typeof currentPassword !== "string") {
      throw new ValidationError(
        "Mot de passe actuel requis",
        "MISSING_CURRENT_PASSWORD"
      );
    }

    if (
      !newPassword ||
      typeof newPassword !== "string" ||
      newPassword.length < 6
    ) {
      throw new ValidationError(
        "Nouveau mot de passe invalide (minimum 6 caractères)",
        "INVALID_NEW_PASSWORD"
      );
    }

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
   * Generate password reset token - AVEC protection timing attack
   */
  static async generatePasswordResetToken(email) {
    // ✅ FIX 1: Defensive programming
    if (!email || typeof email !== "string" || !email.includes("@")) {
      throw new ValidationError("Email invalide", "INVALID_EMAIL");
    }

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
   */
  static async resetPasswordWithToken(tokenData) {
    // ✅ FIX 1: Defensive programming
    if (!tokenData || typeof tokenData !== "object") {
      throw new ValidationError(
        "Données de réinitialisation manquantes",
        "MISSING_RESET_DATA"
      );
    }

    const { token, password } = tokenData;

    if (!token || typeof token !== "string") {
      throw new ValidationError("Token invalide", "INVALID_TOKEN");
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      throw new ValidationError(
        "Nouveau mot de passe invalide (minimum 6 caractères)",
        "INVALID_PASSWORD"
      );
    }

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
    // ✅ FIX 1: Defensive programming
    if (!userId) {
      throw new ValidationError("ID utilisateur requis", "MISSING_USER_ID");
    }

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
