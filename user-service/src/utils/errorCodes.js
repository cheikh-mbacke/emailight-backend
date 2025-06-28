/**
 * 📋 Codes d'erreur simplifiés - Uniquement les codes réellement utilisés
 */

// 🔐 Codes d'erreur d'authentification
export const AUTH_ERRORS = {
  USER_EXISTS: "USER_EXISTS",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  ACCOUNT_DISABLED: "ACCOUNT_DISABLED",
  INVALID_CURRENT_PASSWORD: "INVALID_CURRENT_PASSWORD",
  INVALID_RESET_TOKEN: "INVALID_RESET_TOKEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  MISSING_TOKEN: "MISSING_TOKEN",
  INVALID_TOKEN: "INVALID_TOKEN",
};

// 👤 Codes d'erreur utilisateur
export const USER_ERRORS = {
  USER_NOT_FOUND: "USER_NOT_FOUND",
  INVALID_NAME: "INVALID_NAME",
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
};

// ⚙️ Codes d'erreur de préférences
export const PREFERENCES_ERRORS = {
  INVALID_PREFERENCES: "INVALID_PREFERENCES",
  INVALID_PREFERENCE_VALUE: "INVALID_PREFERENCE_VALUE",
  INVALID_IMPORT_DATA: "INVALID_IMPORT_DATA",
};

// 📧 Codes d'erreur de comptes email
export const EMAIL_ACCOUNT_ERRORS = {
  EMAIL_ACCOUNT_NOT_FOUND: "EMAIL_ACCOUNT_NOT_FOUND",
  EMAIL_LIMIT_REACHED: "EMAIL_LIMIT_REACHED",
};

// 🎯 Codes d'erreur de validation
export const VALIDATION_ERRORS = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_EMAIL_FORMAT: "INVALID_EMAIL_FORMAT",
  INVALID_PASSWORD_FORMAT: "INVALID_PASSWORD_FORMAT",
};

// 🚦 Codes d'erreur de limitation
export const RATE_LIMIT_ERRORS = {
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
};

// 🔒 Codes d'erreur d'autorisation
export const AUTHORIZATION_ERRORS = {
  FORBIDDEN: "FORBIDDEN",
  PREMIUM_REQUIRED: "PREMIUM_REQUIRED",
};

// ⚙️ Codes d'erreur système
export const SYSTEM_ERRORS = {
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
};

// 📤 Export centralisé de tous les codes
export const ERROR_CODES = {
  ...AUTH_ERRORS,
  ...USER_ERRORS,
  ...PREFERENCES_ERRORS,
  ...EMAIL_ACCOUNT_ERRORS,
  ...VALIDATION_ERRORS,
  ...RATE_LIMIT_ERRORS,
  ...AUTHORIZATION_ERRORS,
  ...SYSTEM_ERRORS,
};

/**
 * 🏷️ Messages d'erreur par défaut (français)
 */
export const DEFAULT_ERROR_MESSAGES = {
  // Authentification
  [AUTH_ERRORS.USER_EXISTS]: "Un compte avec cette adresse email existe déjà",
  [AUTH_ERRORS.INVALID_CREDENTIALS]: "Email ou mot de passe incorrect",
  [AUTH_ERRORS.ACCOUNT_LOCKED]: "Compte temporairement verrouillé",
  [AUTH_ERRORS.ACCOUNT_DISABLED]: "Votre compte a été désactivé",
  [AUTH_ERRORS.INVALID_CURRENT_PASSWORD]:
    "Le mot de passe actuel est incorrect",
  [AUTH_ERRORS.INVALID_RESET_TOKEN]:
    "Token de réinitialisation invalide ou expiré",
  [AUTH_ERRORS.TOKEN_EXPIRED]:
    "Votre session a expiré, veuillez vous reconnecter",
  [AUTH_ERRORS.MISSING_TOKEN]: "Token d'authentification requis",
  [AUTH_ERRORS.INVALID_TOKEN]: "Token d'authentification invalide",

  // Utilisateur
  [USER_ERRORS.USER_NOT_FOUND]: "Utilisateur introuvable",
  [USER_ERRORS.INVALID_NAME]: "Le nom ne peut pas être vide",
  [USER_ERRORS.EMAIL_ALREADY_EXISTS]: "Cette adresse email est déjà utilisée",

  // Préférences
  [PREFERENCES_ERRORS.INVALID_PREFERENCES]: "Données de préférences invalides",
  [PREFERENCES_ERRORS.INVALID_PREFERENCE_VALUE]:
    "Valeur de préférence invalide",
  [PREFERENCES_ERRORS.INVALID_IMPORT_DATA]: "Préférences importées invalides",

  // Comptes email
  [EMAIL_ACCOUNT_ERRORS.EMAIL_ACCOUNT_NOT_FOUND]:
    "Ce compte email n'existe pas ou ne vous appartient pas",
  [EMAIL_ACCOUNT_ERRORS.EMAIL_LIMIT_REACHED]:
    "Limite d'emails quotidienne atteinte",

  // Validation
  [VALIDATION_ERRORS.VALIDATION_ERROR]: "Données invalides",
  [VALIDATION_ERRORS.INVALID_EMAIL_FORMAT]: "Format d'email invalide",
  [VALIDATION_ERRORS.INVALID_PASSWORD_FORMAT]:
    "Format de mot de passe invalide",

  // Limitation
  [RATE_LIMIT_ERRORS.RATE_LIMIT_EXCEEDED]:
    "Trop de requêtes, veuillez patienter",

  // Autorisation
  [AUTHORIZATION_ERRORS.FORBIDDEN]: "Accès interdit",
  [AUTHORIZATION_ERRORS.PREMIUM_REQUIRED]: "Abonnement premium requis",

  // Système
  [SYSTEM_ERRORS.INTERNAL_ERROR]: "Erreur interne du serveur",
  [SYSTEM_ERRORS.SERVICE_UNAVAILABLE]: "Service temporairement indisponible",
};

/**
 * 📝 Obtient le message par défaut pour un code d'erreur
 */
export function getDefaultMessage(code) {
  return DEFAULT_ERROR_MESSAGES[code] || "Une erreur est survenue";
}

/**
 * 🔍 Utilitaire pour vérifier si un code d'erreur existe
 */
export function isValidErrorCode(code) {
  return Object.values(ERROR_CODES).includes(code);
}
