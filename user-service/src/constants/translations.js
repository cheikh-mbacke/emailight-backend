// ============================================================================
// 📁 src/constants/translations.js - Traductions centralisées
// ============================================================================

import { SUPPORTED_LANGUAGES } from "./enums.js";

/**
 * 🌍 Dictionnaire de traductions centralisé
 * Structure : { [LANG]: { [CATEGORY]: { [KEY]: "message" } } }
 */
export const TRANSLATIONS = {
  [SUPPORTED_LANGUAGES.FR]: {
    // ============================================================================
    // 🔐 AUTHENTIFICATION
    // ============================================================================
    auth: {
      // Messages d'erreur
      account_locked: "Compte verrouillé temporairement",
      invalid_credentials: "Identifiants invalides",
      email_not_verified: "Email non vérifié",
      account_not_found: "Compte introuvable",
      external_auth: "Ce compte utilise une authentification externe",
      password_error: "Erreur lors de la vérification du mot de passe",
      user_exists: "Un compte avec cette adresse email existe déjà",
      account_disabled: "Votre compte a été désactivé. Contactez le support.",
      token_invalid: "Token invalide",
      token_expired: "Token expiré",
      token_required: "Token requis",
      refresh_token_required: "Token de rafraîchissement requis",
      refresh_token_invalid: "Token de rafraîchissement invalide",
      refresh_token_expired: "Token de rafraîchissement expiré",

      // Messages de succès
      account_created: "Compte créé avec succès",
      login_success: "Connexion réussie",
      token_refreshed: "Token rafraîchi avec succès",
      logout_success: "Déconnexion réussie",
      profile_updated: "Profil mis à jour avec succès",
      account_deleted: "Compte supprimé avec succès",
      password_reset_sent: "Email de réinitialisation envoyé",
      password_reset_success: "Mot de passe réinitialisé avec succès",

      // Messages d'erreur d'authentification
      missing_token: "Token d'accès requis",
      invalid_token: "Token invalide",
      token_expired: "Token expiré",
      token_revoked: "Token révoqué",
      user_not_found: "Utilisateur introuvable",
      account_disabled: "Compte désactivé",
      account_locked: "Compte temporairement verrouillé",
    },

    // ============================================================================
    // ✅ VALIDATION
    // ============================================================================
    validation: {
      // Champs génériques
      required: "Ce champ est requis",
      invalid: "Format invalide",
      min_length: "Doit contenir au moins {min} caractères",
      max_length: "Ne peut pas dépasser {max} caractères",
      at_least_one_field: "Au moins un champ doit être fourni",
      pattern: "Format non autorisé",

      // Champs spécifiques
      name: {
        required: "Le nom est requis",
        min_length: "Le nom doit contenir au moins {min} caractères",
        max_length: "Le nom ne peut pas dépasser {max} caractères",
        pattern:
          "Le nom ne peut contenir que des lettres, chiffres, espaces, apostrophes, points et tirets",
        empty: "Le nom ne peut pas être vide",
      },
      email: {
        required: "L'email est requis",
        invalid: "Format d'email invalide",
        max_length: "L'email ne peut pas dépasser {max} caractères",
        empty: "L'email ne peut pas être vide",
        exists: "Un compte avec cette adresse email existe déjà",
      },
      password: {
        required: "Le mot de passe est requis",
        min_length: "Le mot de passe doit contenir au moins {min} caractères",
        max_length: "Le mot de passe ne peut pas dépasser {max} caractères",
        pattern:
          "Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre",
        auth_provider_required:
          "Le mot de passe est requis pour l'authentification par email",
        invalid: "Le mot de passe fourni est invalide",
        not_configured: "Cet utilisateur n'a pas de mot de passe configuré",
      },
      new_password: {
        required: "Le nouveau mot de passe est requis",
        min_length:
          "Le nouveau mot de passe doit contenir au moins {min} caractères",
        max_length:
          "Le nouveau mot de passe ne peut pas dépasser {max} caractères",
        pattern:
          "Le nouveau mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre",
        same_as_current:
          "Le nouveau mot de passe doit être différent de l'actuel",
      },
      current_password: {
        required: "Le mot de passe actuel est requis",
        invalid: "Le mot de passe actuel est incorrect",
      },
      reset_token: {
        required: "Le token de réinitialisation est requis",
        invalid: "Token de réinitialisation invalide ou expiré",
      },
      refresh_token: {
        required: "Le token de rafraîchissement est requis",
        invalid: "Format du token de rafraîchissement invalide",
      },
      profile_picture: {
        invalid: "Format d'URL de photo de profil invalide",
      },
      file_size: {
        too_large: "La taille maximale autorisée est de 5MB",
        truncated:
          "Le fichier a été tronqué et dépasse la taille maximale autorisée",
      },
      file: {
        required: "Veuillez sélectionner un fichier image pour votre avatar",
      },
      file_type: {
        invalid: "Type de fichier non autorisé. Types acceptés: {types}",
      },
      file_corrupted: {
        invalid: "Le fichier ne semble pas être une image valide",
      },
      display_name: {
        max_length: "Le nom d'affichage ne peut pas dépasser {max} caractères",
      },
      theme: {
        invalid: "Thème invalide",
      },
      language: {
        invalid: "Langue non supportée",
      },
      default_tone: {
        invalid: "Ton par défaut invalide",
      },
      default_length: {
        invalid: "Longueur par défaut invalide",
      },
      provider: {
        invalid: "Fournisseur non supporté",
      },
      user_id: {
        required: "ID utilisateur requis",
        invalid: "ID utilisateur invalide",
      },
      at_least_one_field:
        "Au moins un champ doit être fourni pour la mise à jour",
    },

    // ============================================================================
    // 👤 UTILISATEUR
    // ============================================================================
    user: {
      not_found: "Utilisateur introuvable",
      profile_error: "Erreur lors de la récupération du profil",
      profile_retrieved: "Profil récupéré avec succès",
      name_empty: "Le nom ne peut pas être vide",
      update_error: "Erreur lors de la mise à jour",
      delete_error: "Erreur lors de la suppression",
      avatar_error: "Erreur lors de la gestion de l'avatar",
      no_avatar: "Aucun avatar à supprimer",
    },

    // ============================================================================
    // 📧 COMPTES EMAIL
    // ============================================================================
    email_account: {
      not_found: "Ce compte email n'existe pas ou ne vous appartient pas",
      disconnect_error: "Erreur lors de la déconnexion du compte",
      health_error: "Erreur lors du test de santé du compte",
      cleanup_error: "Erreur lors du nettoyage des comptes",
      created: "Compte email connecté avec succès",
      disconnected: "Compte email déconnecté",
      health_check_failed: "Test de santé du compte échoué",
    },

    // ============================================================================
    // ✅ SUCCÈS
    // ============================================================================
    success: {
      name_updated: "Nom utilisateur mis à jour",
      profile_updated: "Profil mis à jour avec succès",
      avatar_updated: "Avatar mis à jour avec succès",
      avatar_deleted: "Avatar supprimé",
      account_deleted: "Compte utilisateur supprimé définitivement",
      email_account_disconnected: "Compte email déconnecté",
      accounts_cleaned: "Comptes email inactifs nettoyés",
      failed_accounts_cleaned: "Comptes en erreur nettoyés",
      password_changed: "Mot de passe changé avec succès",
      password_reset_sent: "Email de réinitialisation envoyé",
      password_reset_completed: "Mot de passe réinitialisé avec succès",
    },

    // ============================================================================
    // 📝 LOGS
    // ============================================================================
    logs: {
      name_updated: "Nom utilisateur mis à jour",
      profile_updated: "Profil utilisateur mis à jour",
      avatar_updated: "Avatar mis à jour",
      avatar_deleted: "Avatar supprimé",
      account_deleted: "Compte utilisateur supprimé définitivement",
      email_account_disconnected: "Compte email déconnecté",
      accounts_cleaned: "Comptes email inactifs nettoyés",
      failed_accounts_cleaned: "Comptes en erreur nettoyés",
      old_avatar_delete_failed: "Impossible de supprimer l'ancien avatar",
      avatar_delete_failed:
        "Impossible de supprimer l'avatar lors de la suppression du compte",
      account_locked: "Compte verrouillé",
      account_unlocked: "Compte déverrouillé",
      email_account_created: "Compte email créé",
      passwordChanged: "Mot de passe changé avec succès",
      passwordResetRequested: "Demande de réinitialisation de mot de passe",
      passwordReset: "Mot de passe réinitialisé avec succès",
      quota_exceeded: "Quota dépassé",
      quota_consumed: "Quota consommé",
      password_changed: "Mot de passe modifié",
      password_reset_requested: "Demande de réinitialisation de mot de passe",
      password_reset: "Mot de passe réinitialisé",
    },

    // ============================================================================
    // 🏥 SANTÉ
    // ============================================================================
    health: {
      token_expired: "Token expiré - reconnexion nécessaire",
      too_many_errors: "Trop d'erreurs - vérifier la configuration",
      not_used_recently: "Compte non utilisé depuis 30 jours",
    },

    // ============================================================================
    // 📊 QUOTA
    // ============================================================================
    quota: {
      exceeded: "Limite d'envoi quotidienne atteinte",
      upgrade_required: "Mise à niveau requise pour plus d'envois",
    },

    // ============================================================================
    // 🛡️ SÉCURITÉ
    // ============================================================================
    security: {
      rate_limit_exceeded:
        "Trop de requêtes. Veuillez patienter avant de refaire une requête",
      unauthorized: "Non autorisé",
      forbidden: "Accès interdit",
      not_found: "Ressource introuvable",
      internal_error: "Erreur interne du serveur",
    },
  },

  [SUPPORTED_LANGUAGES.EN]: {
    // ============================================================================
    // 🔐 AUTHENTICATION
    // ============================================================================
    auth: {
      // Error messages
      account_locked: "Account temporarily locked",
      invalid_credentials: "Invalid credentials",
      email_not_verified: "Email not verified",
      account_not_found: "Account not found",
      external_auth: "This account uses external authentication",
      password_error: "Error while verifying password",
      user_exists: "An account with this email address already exists",
      account_disabled:
        "Your account has been disabled. Please contact support.",
      token_invalid: "Invalid token",
      token_expired: "Token expired",
      token_required: "Token required",
      refresh_token_required: "Refresh token required",
      refresh_token_invalid: "Invalid refresh token",
      refresh_token_expired: "Refresh token expired",

      // Success messages
      account_created: "Account created successfully",
      login_success: "Login successful",
      token_refreshed: "Token refreshed successfully",
      logout_success: "Logout successful",
      profile_updated: "Profile updated successfully",
      account_deleted: "Account deleted successfully",
      password_reset_sent: "Password reset email sent",
      password_reset_success: "Password reset successfully",

      // Authentication error messages
      missing_token: "Access token required",
      invalid_token: "Invalid token",
      token_expired: "Token expired",
      token_revoked: "Token revoked",
      user_not_found: "User not found",
      account_disabled: "Account disabled",
      account_locked: "Account temporarily locked",
    },

    // ============================================================================
    // ✅ VALIDATION
    // ============================================================================
    validation: {
      // Generic fields
      required: "This field is required",
      invalid: "Invalid format",
      min_length: "Must contain at least {min} characters",
      max_length: "Cannot exceed {max} characters",
      at_least_one_field: "At least one field must be provided",
      pattern: "Format not allowed",

      // Specific fields
      name: {
        required: "Name is required",
        min_length: "Name must be at least {min} characters long",
        max_length: "Name cannot exceed {max} characters",
        pattern:
          "Name can only contain letters, numbers, spaces, apostrophes, dots and hyphens",
        empty: "Name cannot be empty",
      },
      email: {
        required: "Email is required",
        invalid: "Invalid email format",
        max_length: "Email cannot exceed {max} characters",
        empty: "Email cannot be empty",
        exists: "An account with this email address already exists",
      },
      password: {
        required: "Password is required",
        min_length: "Password must be at least {min} characters long",
        max_length: "Password cannot exceed {max} characters",
        pattern:
          "Password must contain at least one lowercase letter, one uppercase letter and one number",
        auth_provider_required: "Password is required for email authentication",
        invalid: "The provided password is invalid",
        not_configured: "This user does not have a password configured",
      },
      new_password: {
        required: "New password is required",
        min_length: "New password must be at least {min} characters long",
        max_length: "New password cannot exceed {max} characters",
        pattern:
          "New password must contain at least one lowercase letter, one uppercase letter and one number",
        same_as_current: "New password must be different from current password",
      },
      current_password: {
        required: "Current password is required",
        invalid: "Current password is incorrect",
      },
      reset_token: {
        required: "Reset token is required",
        invalid: "Invalid or expired reset token",
      },
      refresh_token: {
        required: "Refresh token is required",
        invalid: "Invalid refresh token format",
      },
      profile_picture: {
        invalid: "Invalid profile picture URL format",
      },
      file_size: {
        too_large: "Maximum allowed size is 5MB",
        truncated:
          "File has been truncated and exceeds the maximum allowed size",
      },
      file: {
        required: "Please select an image file for your avatar",
      },
      file_type: {
        invalid: "File type not allowed. Allowed types: {types}",
      },
      file_corrupted: {
        invalid: "The file does not appear to be a valid image",
      },
      display_name: {
        max_length: "Display name cannot exceed {max} characters",
      },
      theme: {
        invalid: "Invalid theme",
      },
      language: {
        invalid: "Unsupported language",
      },
      default_tone: {
        invalid: "Invalid default tone",
      },
      default_length: {
        invalid: "Invalid default length",
      },
      provider: {
        invalid: "Unsupported provider",
      },
      user_id: {
        required: "User ID required",
        invalid: "Invalid user ID",
      },
      at_least_one_field: "At least one field must be provided for update",
    },

    // ============================================================================
    // 👤 USER
    // ============================================================================
    user: {
      not_found: "User not found",
      profile_error: "Error retrieving profile",
      profile_retrieved: "Profile retrieved successfully",
      name_empty: "Name cannot be empty",
      update_error: "Error during update",
      delete_error: "Error during deletion",
      avatar_error: "Error managing avatar",
      no_avatar: "No avatar to delete",
    },

    // ============================================================================
    // 📧 EMAIL ACCOUNTS
    // ============================================================================
    email_account: {
      not_found: "This email account does not exist or does not belong to you",
      disconnect_error: "Error disconnecting account",
      health_error: "Error checking account health",
      cleanup_error: "Error cleaning up accounts",
      created: "Email account connected successfully",
      disconnected: "Email account disconnected",
      health_check_failed: "Account health check failed",
    },

    // ============================================================================
    // ✅ SUCCESS
    // ============================================================================
    success: {
      name_updated: "Username updated",
      profile_updated: "Profile updated successfully",
      avatar_updated: "Avatar updated successfully",
      avatar_deleted: "Avatar deleted",
      account_deleted: "User account permanently deleted",
      email_account_disconnected: "Email account disconnected",
      accounts_cleaned: "Inactive email accounts cleaned",
      failed_accounts_cleaned: "Failed accounts cleaned",
      password_changed: "Password changed successfully",
      password_reset_sent: "Password reset email sent",
      password_reset_completed: "Password reset successfully",
    },

    // ============================================================================
    // 📝 LOGS
    // ============================================================================
    logs: {
      name_updated: "Username updated",
      profile_updated: "User profile updated",
      avatar_updated: "Avatar updated",
      avatar_deleted: "Avatar deleted",
      account_deleted: "User account permanently deleted",
      email_account_disconnected: "Email account disconnected",
      accounts_cleaned: "Inactive email accounts cleaned",
      failed_accounts_cleaned: "Failed accounts cleaned",
      old_avatar_delete_failed: "Could not delete old avatar",
      avatar_delete_failed: "Could not delete avatar during account deletion",
      account_locked: "Account locked",
      account_unlocked: "Account unlocked",
      email_account_created: "Email account created",
      passwordChanged: "Password changed successfully",
      passwordResetRequested: "Password reset requested",
      passwordReset: "Password reset successfully",
      quota_exceeded: "Quota exceeded",
      quota_consumed: "Quota consumed",
      password_changed: "Password changed",
      password_reset_requested: "Password reset requested",
      password_reset: "Password reset",
    },

    // ============================================================================
    // 🏥 HEALTH
    // ============================================================================
    health: {
      token_expired: "Token expired - reconnection required",
      too_many_errors: "Too many errors - check configuration",
      not_used_recently: "Account not used for 30 days",
    },

    // ============================================================================
    // 📊 QUOTA
    // ============================================================================
    quota: {
      exceeded: "Daily sending limit reached",
      upgrade_required: "Upgrade required for more sends",
    },

    // ============================================================================
    // 🛡️ SECURITY
    // ============================================================================
    security: {
      rate_limit_exceeded:
        "Too many requests. Please wait before making another request",
      unauthorized: "Unauthorized",
      forbidden: "Forbidden",
      not_found: "Resource not found",
      internal_error: "Internal server error",
    },
  },
};

/**
 * 🌍 Helper pour obtenir une traduction avec fallback
 * @param {string} key - Clé de traduction (ex: "auth.login_success")
 * @param {string} language - Langue cible
 * @param {object} params - Paramètres d'interpolation
 * @returns {string} Message traduit
 */
export function getTranslation(
  key,
  language = SUPPORTED_LANGUAGES.FR,
  params = {}
) {
  try {
    // Valider la langue
    if (!Object.values(SUPPORTED_LANGUAGES).includes(language)) {
      language = SUPPORTED_LANGUAGES.FR;
    }

    // Obtenir le dictionnaire de langue
    const dict = TRANSLATIONS[language];
    if (!dict) {
      return getTranslation(key, SUPPORTED_LANGUAGES.FR, params);
    }

    // Naviguer dans l'objet avec la clé
    const keys = key.split(".");
    let translation = dict;

    for (const k of keys) {
      if (translation && typeof translation === "object" && translation[k]) {
        translation = translation[k];
      } else {
        // Fallback vers le français si pas trouvé
        if (language !== SUPPORTED_LANGUAGES.FR) {
          return getTranslation(key, SUPPORTED_LANGUAGES.FR, params);
        }
        return key; // Retourner la clé si pas trouvé même en français
      }
    }

    // Vérifier que c'est une string
    if (typeof translation !== "string") {
      return key;
    }

    // Interpoler les paramètres
    return interpolateParams(translation, params);
  } catch (error) {
    console.error("Translation error:", {
      key,
      language,
      error: error.message,
    });
    return key;
  }
}

/**
 * 🔧 Interpoler les paramètres dans une chaîne
 * @param {string} text - Texte avec placeholders {param}
 * @param {object} params - Paramètres à interpoler
 * @returns {string} Texte avec paramètres remplacés
 */
function interpolateParams(text, params = {}) {
  if (!params || typeof params !== "object") {
    return text;
  }

  let result = text;
  Object.keys(params).forEach((key) => {
    const placeholder = new RegExp(`\\{${key}\\}`, "g");
    result = result.replace(placeholder, params[key]);
  });

  return result;
}

/**
 * 🌍 Obtenir toutes les traductions pour une langue
 * @param {string} language - Langue cible
 * @returns {object} Toutes les traductions pour la langue
 */
export function getAllTranslations(language = SUPPORTED_LANGUAGES.FR) {
  return TRANSLATIONS[language] || TRANSLATIONS[SUPPORTED_LANGUAGES.FR];
}

/**
 * 🌍 Vérifier si une clé de traduction existe
 * @param {string} key - Clé à vérifier
 * @param {string} language - Langue cible
 * @returns {boolean} True si la clé existe
 */
export function hasTranslation(key, language = SUPPORTED_LANGUAGES.FR) {
  try {
    const dict = TRANSLATIONS[language];
    if (!dict) return false;

    const keys = key.split(".");
    let current = dict;

    for (const k of keys) {
      if (current && typeof current === "object" && current[k]) {
        current = current[k];
      } else {
        return false;
      }
    }

    return typeof current === "string";
  } catch {
    return false;
  }
}
