// ============================================================================
// 📁 src/utils/errorCodes.js - Codes d'erreur étendus
// ============================================================================

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
  // 🆕 Nouveaux codes OAuth
  OAUTH_ERROR: "OAUTH_ERROR",
  GOOGLE_AUTH_FAILED: "GOOGLE_AUTH_FAILED",
  EXTERNAL_AUTH_ACCOUNT: "EXTERNAL_AUTH_ACCOUNT",
};

// 👤 Codes d'erreur utilisateur
export const USER_ERRORS = {
  USER_NOT_FOUND: "USER_NOT_FOUND",
  INVALID_NAME: "INVALID_NAME",
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
  // 🆕 Nouveaux codes utilisateur
  INVALID_USER_ID: "INVALID_USER_ID",
  PROFILE_UPDATE_FAILED: "PROFILE_UPDATE_FAILED",
  ACCOUNT_DELETION_FAILED: "ACCOUNT_DELETION_FAILED",
};

// ⚙️ Codes d'erreur de préférences
export const PREFERENCES_ERRORS = {
  INVALID_PREFERENCES: "INVALID_PREFERENCES",
  INVALID_PREFERENCE_VALUE: "INVALID_PREFERENCE_VALUE",
  INVALID_IMPORT_DATA: "INVALID_IMPORT_DATA",
  // 🆕 Nouveaux codes préférences
  PREFERENCES_UPDATE_FAILED: "PREFERENCES_UPDATE_FAILED",
  INVALID_TIMEZONE: "INVALID_TIMEZONE",
  INVALID_LANGUAGE: "INVALID_LANGUAGE",
  INVALID_THEME: "INVALID_THEME",
};

// 📧 Codes d'erreur de comptes email
export const EMAIL_ACCOUNT_ERRORS = {
  EMAIL_ACCOUNT_NOT_FOUND: "EMAIL_ACCOUNT_NOT_FOUND",
  EMAIL_LIMIT_REACHED: "EMAIL_LIMIT_REACHED",
  // 🆕 Nouveaux codes email
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
  INVALID_EMAIL_PROVIDER: "INVALID_EMAIL_PROVIDER",
  EMAIL_CONNECTION_FAILED: "EMAIL_CONNECTION_FAILED",
  TOKEN_REFRESH_FAILED: "TOKEN_REFRESH_FAILED",
  SMTP_CONNECTION_FAILED: "SMTP_CONNECTION_FAILED",
  SMTP_AUTH_FAILED: "SMTP_AUTH_FAILED",
  SMTP_CONFIG_INVALID: "SMTP_CONFIG_INVALID",
};

// 🎯 Codes d'erreur de validation
export const VALIDATION_ERRORS = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_EMAIL_FORMAT: "INVALID_EMAIL_FORMAT",
  INVALID_PASSWORD_FORMAT: "INVALID_PASSWORD_FORMAT",
  // 🆕 Nouveaux codes validation
  VALIDATION_FAILED: "VALIDATION_FAILED",
  INVALID_ID: "INVALID_ID",
  INVALID_OBJECT_ID: "INVALID_OBJECT_ID",
  REQUIRED_FIELD_MISSING: "REQUIRED_FIELD_MISSING",
  FIELD_TOO_LONG: "FIELD_TOO_LONG",
  FIELD_TOO_SHORT: "FIELD_TOO_SHORT",
  INVALID_FORMAT: "INVALID_FORMAT",
  DUPLICATE_RESOURCE: "DUPLICATE_RESOURCE",
};

// 🚦 Codes d'erreur de limitation
export const RATE_LIMIT_ERRORS = {
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  // 🆕 Nouveaux codes limitation
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",
  DAILY_LIMIT_EXCEEDED: "DAILY_LIMIT_EXCEEDED",
  QUOTA_LIMIT_EXCEEDED: "QUOTA_LIMIT_EXCEEDED",
};

// 🔒 Codes d'erreur d'autorisation
export const AUTHORIZATION_ERRORS = {
  FORBIDDEN: "FORBIDDEN",
  PREMIUM_REQUIRED: "PREMIUM_REQUIRED",
  // 🆕 Nouveaux codes autorisation
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  SUBSCRIPTION_REQUIRED: "SUBSCRIPTION_REQUIRED",
  FEATURE_NOT_AVAILABLE: "FEATURE_NOT_AVAILABLE",
};

// ⚙️ Codes d'erreur système
export const SYSTEM_ERRORS = {
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  // 🆕 Nouveaux codes système
  DATABASE_ERROR: "DATABASE_ERROR",
  DATABASE_TIMEOUT: "DATABASE_TIMEOUT",
  NETWORK_ERROR: "NETWORK_ERROR",
  CONFIGURATION_ERROR: "CONFIGURATION_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
  FILE_SYSTEM_ERROR: "FILE_SYSTEM_ERROR",
  ENCRYPTION_ERROR: "ENCRYPTION_ERROR",
};

// 🆕 Codes d'erreur de fichiers
export const FILE_ERRORS = {
  FILE_UPLOAD_ERROR: "FILE_UPLOAD_ERROR",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  INVALID_FILE_TYPE: "INVALID_FILE_TYPE",
  FILE_NOT_FOUND: "FILE_NOT_FOUND",
  FILE_PROCESSING_ERROR: "FILE_PROCESSING_ERROR",
  STORAGE_ERROR: "STORAGE_ERROR",
  INVALID_FILE_FORMAT: "INVALID_FILE_FORMAT",
};

// 🆕 Codes d'erreur de quota
export const QUOTA_ERRORS = {
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
  DAILY_QUOTA_EXCEEDED: "DAILY_QUOTA_EXCEEDED",
  MONTHLY_QUOTA_EXCEEDED: "MONTHLY_QUOTA_EXCEEDED",
  QUOTA_CALCULATION_ERROR: "QUOTA_CALCULATION_ERROR",
  QUOTA_RESET_FAILED: "QUOTA_RESET_FAILED",
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
  ...FILE_ERRORS, // 🆕
  ...QUOTA_ERRORS, // 🆕
};

/**
 * 🏷️ Messages d'erreur par défaut (français) - étendus
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
  [AUTH_ERRORS.OAUTH_ERROR]: "Erreur d'authentification OAuth",
  [AUTH_ERRORS.GOOGLE_AUTH_FAILED]: "Échec de l'authentification Google",
  [AUTH_ERRORS.EXTERNAL_AUTH_ACCOUNT]: "Compte lié à un service externe",

  // Utilisateur
  [USER_ERRORS.USER_NOT_FOUND]: "Utilisateur introuvable",
  [USER_ERRORS.INVALID_NAME]: "Le nom ne peut pas être vide",
  [USER_ERRORS.EMAIL_ALREADY_EXISTS]: "Cette adresse email est déjà utilisée",
  [USER_ERRORS.INVALID_USER_ID]: "ID utilisateur invalide",
  [USER_ERRORS.PROFILE_UPDATE_FAILED]: "Échec de la mise à jour du profil",
  [USER_ERRORS.ACCOUNT_DELETION_FAILED]: "Échec de la suppression du compte",

  // Préférences
  [PREFERENCES_ERRORS.INVALID_PREFERENCES]: "Données de préférences invalides",
  [PREFERENCES_ERRORS.INVALID_PREFERENCE_VALUE]:
    "Valeur de préférence invalide",
  [PREFERENCES_ERRORS.INVALID_IMPORT_DATA]: "Préférences importées invalides",
  [PREFERENCES_ERRORS.PREFERENCES_UPDATE_FAILED]:
    "Échec de la mise à jour des préférences",
  [PREFERENCES_ERRORS.INVALID_TIMEZONE]: "Timezone invalide",
  [PREFERENCES_ERRORS.INVALID_LANGUAGE]: "Langue non supportée",
  [PREFERENCES_ERRORS.INVALID_THEME]: "Thème invalide",

  // Comptes email
  [EMAIL_ACCOUNT_ERRORS.EMAIL_ACCOUNT_NOT_FOUND]:
    "Ce compte email n'existe pas ou ne vous appartient pas",
  [EMAIL_ACCOUNT_ERRORS.EMAIL_LIMIT_REACHED]:
    "Limite d'emails quotidienne atteinte",
  [EMAIL_ACCOUNT_ERRORS.QUOTA_EXCEEDED]: "Quota d'emails dépassé",
  [EMAIL_ACCOUNT_ERRORS.INVALID_EMAIL_PROVIDER]:
    "Fournisseur email non supporté",
  [EMAIL_ACCOUNT_ERRORS.EMAIL_CONNECTION_FAILED]:
    "Impossible de se connecter au compte email",
  [EMAIL_ACCOUNT_ERRORS.TOKEN_REFRESH_FAILED]:
    "Échec du renouvellement du token",
  [EMAIL_ACCOUNT_ERRORS.SMTP_CONNECTION_FAILED]: "Échec de la connexion SMTP",
  [EMAIL_ACCOUNT_ERRORS.SMTP_AUTH_FAILED]: "Échec de l'authentification SMTP",
  [EMAIL_ACCOUNT_ERRORS.SMTP_CONFIG_INVALID]: "Configuration SMTP invalide",

  // Validation
  [VALIDATION_ERRORS.VALIDATION_ERROR]: "Données invalides",
  [VALIDATION_ERRORS.INVALID_EMAIL_FORMAT]: "Format d'email invalide",
  [VALIDATION_ERRORS.INVALID_PASSWORD_FORMAT]:
    "Format de mot de passe invalide",
  [VALIDATION_ERRORS.VALIDATION_FAILED]: "Échec de la validation",
  [VALIDATION_ERRORS.INVALID_ID]: "ID invalide",
  [VALIDATION_ERRORS.INVALID_OBJECT_ID]: "ObjectId MongoDB invalide",
  [VALIDATION_ERRORS.REQUIRED_FIELD_MISSING]: "Champ requis manquant",
  [VALIDATION_ERRORS.FIELD_TOO_LONG]: "Champ trop long",
  [VALIDATION_ERRORS.FIELD_TOO_SHORT]: "Champ trop court",
  [VALIDATION_ERRORS.INVALID_FORMAT]: "Format invalide",
  [VALIDATION_ERRORS.DUPLICATE_RESOURCE]: "Ressource déjà existante",

  // Limitation
  [RATE_LIMIT_ERRORS.RATE_LIMIT_EXCEEDED]:
    "Trop de requêtes, veuillez patienter",
  [RATE_LIMIT_ERRORS.TOO_MANY_REQUESTS]: "Trop de requêtes simultanées",
  [RATE_LIMIT_ERRORS.DAILY_LIMIT_EXCEEDED]: "Limite quotidienne dépassée",
  [RATE_LIMIT_ERRORS.QUOTA_LIMIT_EXCEEDED]: "Limite de quota atteinte",

  // Autorisation
  [AUTHORIZATION_ERRORS.FORBIDDEN]: "Accès interdit",
  [AUTHORIZATION_ERRORS.PREMIUM_REQUIRED]: "Abonnement premium requis",
  [AUTHORIZATION_ERRORS.INSUFFICIENT_PERMISSIONS]: "Permissions insuffisantes",
  [AUTHORIZATION_ERRORS.SUBSCRIPTION_REQUIRED]: "Abonnement requis",
  [AUTHORIZATION_ERRORS.FEATURE_NOT_AVAILABLE]: "Fonctionnalité non disponible",

  // Système
  [SYSTEM_ERRORS.INTERNAL_ERROR]: "Erreur interne du serveur",
  [SYSTEM_ERRORS.SERVICE_UNAVAILABLE]: "Service temporairement indisponible",
  [SYSTEM_ERRORS.DATABASE_ERROR]: "Erreur de base de données",
  [SYSTEM_ERRORS.DATABASE_TIMEOUT]: "Timeout de base de données",
  [SYSTEM_ERRORS.NETWORK_ERROR]: "Erreur réseau",
  [SYSTEM_ERRORS.CONFIGURATION_ERROR]: "Erreur de configuration",
  [SYSTEM_ERRORS.EXTERNAL_SERVICE_ERROR]: "Erreur de service externe",
  [SYSTEM_ERRORS.FILE_SYSTEM_ERROR]: "Erreur du système de fichiers",
  [SYSTEM_ERRORS.ENCRYPTION_ERROR]: "Erreur de chiffrement",

  // Fichiers
  [FILE_ERRORS.FILE_UPLOAD_ERROR]: "Erreur lors de l'upload du fichier",
  [FILE_ERRORS.FILE_TOO_LARGE]: "Fichier trop volumineux",
  [FILE_ERRORS.INVALID_FILE_TYPE]: "Type de fichier non autorisé",
  [FILE_ERRORS.FILE_NOT_FOUND]: "Fichier introuvable",
  [FILE_ERRORS.FILE_PROCESSING_ERROR]: "Erreur lors du traitement du fichier",
  [FILE_ERRORS.STORAGE_ERROR]: "Erreur de stockage",
  [FILE_ERRORS.INVALID_FILE_FORMAT]: "Format de fichier invalide",

  // Quota
  [QUOTA_ERRORS.QUOTA_EXCEEDED]: "Quota dépassé",
  [QUOTA_ERRORS.DAILY_QUOTA_EXCEEDED]: "Quota journalier dépassé",
  [QUOTA_ERRORS.MONTHLY_QUOTA_EXCEEDED]: "Quota mensuel dépassé",
  [QUOTA_ERRORS.QUOTA_CALCULATION_ERROR]: "Erreur de calcul de quota",
  [QUOTA_ERRORS.QUOTA_RESET_FAILED]: "Échec de la remise à zéro du quota",
};

/**
 * 🆕 Mapping des types d'erreur vers les codes HTTP
 */
export const ERROR_TYPE_TO_HTTP_STATUS = {
  // Validation → 400
  validation: 400,
  format: 400,
  required: 400,

  // Auth → 401
  auth: 401,
  authentication: 401,
  token: 401,

  // Authorization → 403
  authorization: 403,
  permission: 403,
  subscription: 403,

  // Not Found → 404
  notFound: 404,
  missing: 404,

  // Conflict → 409
  conflict: 409,
  duplicate: 409,
  exists: 409,

  // Rate Limit → 429
  rateLimit: 429,
  quota: 429,
  limit: 429,

  // Server → 500
  system: 500,
  database: 500,
  network: 500,
  file: 500,
  encryption: 500,
  configuration: 500,
  external: 502,
  timeout: 504,
};

/**
 * 🆕 Catégories d'erreur pour le monitoring et les métriques
 */
export const ERROR_CATEGORIES = {
  USER_INPUT: "user_input", // Erreurs causées par l'utilisateur
  BUSINESS_LOGIC: "business", // Erreurs de logique métier
  SYSTEM: "system", // Erreurs système/infrastructure
  EXTERNAL: "external", // Erreurs de services externes
  SECURITY: "security", // Erreurs de sécurité
  PERFORMANCE: "performance", // Erreurs de performance/timeout
};

/**
 * 🆕 Mapping des codes d'erreur vers les catégories
 */
export const ERROR_CODE_CATEGORIES = {
  // User Input
  [VALIDATION_ERRORS.VALIDATION_ERROR]: ERROR_CATEGORIES.USER_INPUT,
  [VALIDATION_ERRORS.INVALID_EMAIL_FORMAT]: ERROR_CATEGORIES.USER_INPUT,
  [VALIDATION_ERRORS.INVALID_PASSWORD_FORMAT]: ERROR_CATEGORIES.USER_INPUT,
  [VALIDATION_ERRORS.REQUIRED_FIELD_MISSING]: ERROR_CATEGORIES.USER_INPUT,
  [VALIDATION_ERRORS.FIELD_TOO_LONG]: ERROR_CATEGORIES.USER_INPUT,
  [VALIDATION_ERRORS.FIELD_TOO_SHORT]: ERROR_CATEGORIES.USER_INPUT,
  [FILE_ERRORS.FILE_TOO_LARGE]: ERROR_CATEGORIES.USER_INPUT,
  [FILE_ERRORS.INVALID_FILE_TYPE]: ERROR_CATEGORIES.USER_INPUT,

  // Business Logic
  [USER_ERRORS.USER_NOT_FOUND]: ERROR_CATEGORIES.BUSINESS_LOGIC,
  [EMAIL_ACCOUNT_ERRORS.EMAIL_LIMIT_REACHED]: ERROR_CATEGORIES.BUSINESS_LOGIC,
  [QUOTA_ERRORS.QUOTA_EXCEEDED]: ERROR_CATEGORIES.BUSINESS_LOGIC,
  [AUTH_ERRORS.ACCOUNT_LOCKED]: ERROR_CATEGORIES.BUSINESS_LOGIC,
  [AUTHORIZATION_ERRORS.PREMIUM_REQUIRED]: ERROR_CATEGORIES.BUSINESS_LOGIC,

  // System
  [SYSTEM_ERRORS.DATABASE_ERROR]: ERROR_CATEGORIES.SYSTEM,
  [SYSTEM_ERRORS.FILE_SYSTEM_ERROR]: ERROR_CATEGORIES.SYSTEM,
  [SYSTEM_ERRORS.CONFIGURATION_ERROR]: ERROR_CATEGORIES.SYSTEM,
  [SYSTEM_ERRORS.ENCRYPTION_ERROR]: ERROR_CATEGORIES.SYSTEM,

  // External
  [SYSTEM_ERRORS.EXTERNAL_SERVICE_ERROR]: ERROR_CATEGORIES.EXTERNAL,
  [EMAIL_ACCOUNT_ERRORS.SMTP_CONNECTION_FAILED]: ERROR_CATEGORIES.EXTERNAL,
  [AUTH_ERRORS.GOOGLE_AUTH_FAILED]: ERROR_CATEGORIES.EXTERNAL,

  // Security
  [AUTH_ERRORS.INVALID_CREDENTIALS]: ERROR_CATEGORIES.SECURITY,
  [AUTH_ERRORS.TOKEN_EXPIRED]: ERROR_CATEGORIES.SECURITY,
  [AUTH_ERRORS.INVALID_TOKEN]: ERROR_CATEGORIES.SECURITY,
  [AUTHORIZATION_ERRORS.FORBIDDEN]: ERROR_CATEGORIES.SECURITY,

  // Performance
  [SYSTEM_ERRORS.DATABASE_TIMEOUT]: ERROR_CATEGORIES.PERFORMANCE,
  [RATE_LIMIT_ERRORS.RATE_LIMIT_EXCEEDED]: ERROR_CATEGORIES.PERFORMANCE,
  [SYSTEM_ERRORS.NETWORK_ERROR]: ERROR_CATEGORIES.PERFORMANCE,
};

/**
 * 🆕 Niveaux de criticité des erreurs
 */
export const ERROR_SEVERITY = {
  LOW: "low", // Erreurs attendues, gérables
  MEDIUM: "medium", // Erreurs importantes mais non critiques
  HIGH: "high", // Erreurs graves nécessitant attention
  CRITICAL: "critical", // Erreurs critiques nécessitant intervention immédiate
};

/**
 * 🆕 Mapping des codes vers les niveaux de criticité
 */
export const ERROR_CODE_SEVERITY = {
  // Low - Erreurs utilisateur courantes
  [VALIDATION_ERRORS.VALIDATION_ERROR]: ERROR_SEVERITY.LOW,
  [VALIDATION_ERRORS.INVALID_EMAIL_FORMAT]: ERROR_SEVERITY.LOW,
  [USER_ERRORS.USER_NOT_FOUND]: ERROR_SEVERITY.LOW,
  [AUTH_ERRORS.INVALID_CREDENTIALS]: ERROR_SEVERITY.LOW,

  // Medium - Erreurs métier
  [EMAIL_ACCOUNT_ERRORS.EMAIL_LIMIT_REACHED]: ERROR_SEVERITY.MEDIUM,
  [QUOTA_ERRORS.QUOTA_EXCEEDED]: ERROR_SEVERITY.MEDIUM,
  [AUTH_ERRORS.ACCOUNT_LOCKED]: ERROR_SEVERITY.MEDIUM,
  [FILE_ERRORS.FILE_UPLOAD_ERROR]: ERROR_SEVERITY.MEDIUM,

  // High - Erreurs système importantes
  [SYSTEM_ERRORS.DATABASE_ERROR]: ERROR_SEVERITY.HIGH,
  [SYSTEM_ERRORS.EXTERNAL_SERVICE_ERROR]: ERROR_SEVERITY.HIGH,
  [EMAIL_ACCOUNT_ERRORS.SMTP_CONNECTION_FAILED]: ERROR_SEVERITY.HIGH,

  // Critical - Erreurs critiques
  [SYSTEM_ERRORS.DATABASE_TIMEOUT]: ERROR_SEVERITY.CRITICAL,
  [SYSTEM_ERRORS.CONFIGURATION_ERROR]: ERROR_SEVERITY.CRITICAL,
  [SYSTEM_ERRORS.ENCRYPTION_ERROR]: ERROR_SEVERITY.CRITICAL,
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

/**
 * 🆕 Obtient la catégorie d'une erreur
 */
export function getErrorCategory(code) {
  return ERROR_CODE_CATEGORIES[code] || ERROR_CATEGORIES.SYSTEM;
}

/**
 * 🆕 Obtient le niveau de criticité d'une erreur
 */
export function getErrorSeverity(code) {
  return ERROR_CODE_SEVERITY[code] || ERROR_SEVERITY.MEDIUM;
}

/**
 * 🆕 Obtient le status HTTP approprié pour un type d'erreur
 */
export function getHttpStatusForErrorType(errorType) {
  return ERROR_TYPE_TO_HTTP_STATUS[errorType] || 500;
}

/**
 * 🆕 Analyse un code d'erreur et retourne ses métadonnées
 */
export function analyzeErrorCode(code) {
  return {
    code,
    message: getDefaultMessage(code),
    category: getErrorCategory(code),
    severity: getErrorSeverity(code),
    isValid: isValidErrorCode(code),
    isCritical: getErrorSeverity(code) === ERROR_SEVERITY.CRITICAL,
    isUserError: getErrorCategory(code) === ERROR_CATEGORIES.USER_INPUT,
    isSystemError: getErrorCategory(code) === ERROR_CATEGORIES.SYSTEM,
  };
}

/**
 * 🆕 Helper pour créer des métriques d'erreur
 */
export function createErrorMetrics(errors = []) {
  const metrics = {
    total: errors.length,
    byCategory: {},
    bySeverity: {},
    byCode: {},
    criticalCount: 0,
    userErrorCount: 0,
    systemErrorCount: 0,
  };

  errors.forEach((error) => {
    const code = error.code || "UNKNOWN";
    const category = getErrorCategory(code);
    const severity = getErrorSeverity(code);

    // Count by category
    metrics.byCategory[category] = (metrics.byCategory[category] || 0) + 1;

    // Count by severity
    metrics.bySeverity[severity] = (metrics.bySeverity[severity] || 0) + 1;

    // Count by code
    metrics.byCode[code] = (metrics.byCode[code] || 0) + 1;

    // Special counters
    if (severity === ERROR_SEVERITY.CRITICAL) {
      metrics.criticalCount++;
    }

    if (category === ERROR_CATEGORIES.USER_INPUT) {
      metrics.userErrorCount++;
    }

    if (category === ERROR_CATEGORIES.SYSTEM) {
      metrics.systemErrorCount++;
    }
  });

  return metrics;
}
