import { SUPPORTED_LANGUAGES } from "../constants/enums.js";

/**
 * Translation dictionaries
 */
const translations = {
  [SUPPORTED_LANGUAGES.FR]: {
    validation: {
      name: {
        required: "Le nom est requis",
        minLength: "Le nom doit contenir au moins {min} caractères",
        maxLength: "Le nom ne peut pas dépasser {max} caractères",
      },
      email: {
        required: "L'email est requis",
        invalid: "Format d'email invalide",
      },
      password: {
        required: "Le mot de passe est requis",
        minLength: "Le mot de passe doit contenir au moins {min} caractères",
        authProviderRequired:
          "Le mot de passe est requis pour l'authentification par email",
      },
      profilePicture: {
        invalid: "Format d'URL de photo de profil invalide",
      },
    },
    auth: {
      accountLocked: "Compte verrouillé temporairement",
      invalidCredentials: "Identifiants invalides",
      emailNotVerified: "Email non vérifié",
      accountNotFound: "Compte introuvable",
      externalAuth: "Ce compte utilise une authentification externe",
      passwordError: "Erreur lors de la vérification du mot de passe",
    },
    user: {
      notFound: "Utilisateur introuvable",
      profileError: "Erreur lors de la récupération du profil",
      nameEmpty: "Le nom ne peut pas être vide",
      updateError: "Erreur lors de la mise à jour",
      deleteError: "Erreur lors de la suppression",
      avatarError: "Erreur lors de la gestion de l'avatar",
      noAvatar: "Aucun avatar à supprimer",
    },
    emailAccount: {
      notFound: "Ce compte email n'existe pas ou ne vous appartient pas",
      disconnectError: "Erreur lors de la déconnexion du compte",
      healthError: "Erreur lors du test de santé du compte",
      cleanupError: "Erreur lors du nettoyage des comptes",
    },
    success: {
      nameUpdated: "Nom utilisateur mis à jour",
      avatarUpdated: "Avatar mis à jour",
      avatarDeleted: "Avatar supprimé",
      accountDeleted: "Compte utilisateur supprimé définitivement",
      emailAccountDisconnected: "Compte email déconnecté",
      accountsCleaned: "Comptes email inactifs nettoyés",
    },
    logs: {
      nameUpdated: "Nom utilisateur mis à jour",
      avatarUpdated: "Avatar mis à jour",
      avatarDeleted: "Avatar supprimé",
      accountDeleted: "Compte utilisateur supprimé définitivement",
      emailAccountDisconnected: "Compte email déconnecté",
      accountsCleaned: "Comptes email inactifs nettoyés",
      oldAvatarDeleteFailed: "Impossible de supprimer l'ancien avatar",
      avatarDeleteFailed:
        "Impossible de supprimer l'avatar lors de la suppression du compte",
    },
    health: {
      tokenExpired: "Token expiré - reconnexion nécessaire",
      tooManyErrors: "Trop d'erreurs - vérifier la configuration",
      notUsedRecently: "Compte non utilisé depuis 30 jours",
    },
    subscription: {
      limitReached: "Limite d'envoi quotidienne atteinte",
      upgradeRequired: "Mise à niveau requise pour plus d'envois",
    },
  },
  [SUPPORTED_LANGUAGES.EN]: {
    validation: {
      name: {
        required: "Name is required",
        minLength: "Name must be at least {min} characters long",
        maxLength: "Name cannot exceed {max} characters",
      },
      email: {
        required: "Email is required",
        invalid: "Invalid email format",
      },
      password: {
        required: "Password is required",
        minLength: "Password must be at least {min} characters long",
        authProviderRequired: "Password is required for email authentication",
      },
      profilePicture: {
        invalid: "Invalid profile picture URL format",
      },
    },
    auth: {
      accountLocked: "Account temporarily locked",
      invalidCredentials: "Invalid credentials",
      emailNotVerified: "Email not verified",
      accountNotFound: "Account not found",
      externalAuth: "This account uses external authentication",
      passwordError: "Error while verifying password",
    },
    user: {
      notFound: "User not found",
      profileError: "Error retrieving profile",
      nameEmpty: "Name cannot be empty",
      updateError: "Error during update",
      deleteError: "Error during deletion",
      avatarError: "Error managing avatar",
      noAvatar: "No avatar to delete",
    },
    emailAccount: {
      notFound: "This email account does not exist or does not belong to you",
      disconnectError: "Error disconnecting account",
      healthError: "Error checking account health",
      cleanupError: "Error cleaning up accounts",
    },
    success: {
      nameUpdated: "Username updated",
      avatarUpdated: "Avatar updated",
      avatarDeleted: "Avatar deleted",
      accountDeleted: "User account permanently deleted",
      emailAccountDisconnected: "Email account disconnected",
      accountsCleaned: "Inactive email accounts cleaned",
    },
    logs: {
      nameUpdated: "Username updated",
      avatarUpdated: "Avatar updated",
      avatarDeleted: "Avatar deleted",
      accountDeleted: "User account permanently deleted",
      emailAccountDisconnected: "Email account disconnected",
      accountsCleaned: "Inactive email accounts cleaned",
      oldAvatarDeleteFailed: "Could not delete old avatar",
      avatarDeleteFailed: "Could not delete avatar during account deletion",
    },
    health: {
      tokenExpired: "Token expired - reconnection required",
      tooManyErrors: "Too many errors - check configuration",
      notUsedRecently: "Account not used for 30 days",
    },
    subscription: {
      limitReached: "Daily sending limit reached",
      upgradeRequired: "Upgrade required for more sends",
    },
  },
};

/**
 * Internationalization Service
 */
class I18nService {
  static getMessage(key, language = SUPPORTED_LANGUAGES.FR, params = {}) {
    try {
      if (!Object.values(SUPPORTED_LANGUAGES).includes(language)) {
        language = SUPPORTED_LANGUAGES.FR;
      }
      const dict = translations[language];
      if (!dict) {
        return this.getMessage(key, SUPPORTED_LANGUAGES.FR, params);
      }
      const keys = key.split(".");
      let translation = dict;
      for (const k of keys) {
        if (translation && typeof translation === "object" && translation[k]) {
          translation = translation[k];
        } else {
          if (language !== SUPPORTED_LANGUAGES.FR) {
            return this.getMessage(key, SUPPORTED_LANGUAGES.FR, params);
          }
          return key;
        }
      }
      if (typeof translation !== "string") {
        return key;
      }
      return this.interpolate(translation, params);
    } catch (error) {
      console.error("I18n error:", error);
      return key;
    }
  }

  static interpolate(translation, params) {
    if (!params || typeof params !== "object") {
      return translation;
    }
    let result = translation;
    Object.keys(params).forEach((key) => {
      const placeholder = `{${key}}`;
      result = result.replace(new RegExp(placeholder, "g"), params[key]);
    });
    return result;
  }

  static getValidationMessage(
    field,
    rule,
    language = SUPPORTED_LANGUAGES.FR,
    params = {}
  ) {
    const key = `validation.${field}.${rule}`;
    return this.getMessage(key, language, params);
  }

  static getAvailableLanguages() {
    return SUPPORTED_LANGUAGES;
  }

  static isLanguageSupported(language) {
    return Object.values(SUPPORTED_LANGUAGES).includes(language);
  }

  static getUserLanguage(user) {
    if (user && user.preferences && user.preferences.language) {
      return this.isLanguageSupported(user.preferences.language)
        ? user.preferences.language
        : SUPPORTED_LANGUAGES.FR;
    }
    return SUPPORTED_LANGUAGES.FR;
  }

  static createValidationError(
    field,
    rule,
    language = SUPPORTED_LANGUAGES.FR,
    params = {}
  ) {
    return [true, this.getValidationMessage(field, rule, language, params)];
  }
}

export default I18nService;
