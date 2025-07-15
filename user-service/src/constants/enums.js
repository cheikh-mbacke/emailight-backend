// ============================================================================
// 📁 src/constants/enums.js - Application enumerations
// ============================================================================

/**
 * 🌍 Supported languages
 */
export const SUPPORTED_LANGUAGES = {
  FR: "FR",
  EN: "EN",
};

/**
 * 🎨 UI Theme options
 */
export const THEME_OPTIONS = {
  LIGHT: "light",
  DARK: "dark",
  AUTO: "auto",
};

/**
 * 🎭 Email tone options (multilingual)
 */
export const EMAIL_TONES = {
  // French tones
  FR: [
    "Accueillant",
    "Amical",
    "Apaisant",
    "Assertif",
    "Autoritaire",
    "Bienveillant",
    "Candide",
    "Chaleureux",
    "Clairvoyant",
    "Collaboratif",
    "Confidentiel",
    "Confiant",
    "Constructif",
    "Courtois",
    "Décidé",
    "Délicat",
    "Diplomatique",
    "Direct",
    "Drôle",
    "Empathique",
    "Encourageant",
    "Enthousiaste",
    "Excusant",
    "Ferme",
    "Formel",
    "Humble",
    "Informatif",
    "Inspirant",
    "Ironique",
    "Lucide",
    "Motivant",
    "Neutre",
    "Optimiste",
    "Persuasif",
    "Positif",
    "Professionnel",
    "Prudent",
    "Rassurant",
    "Reconnaissant",
    "Sincère",
    "Solennel",
    "Urgent",
  ],

  // English tones
  EN: [
    "Welcoming",
    "Friendly",
    "Soothing",
    "Assertive",
    "Authoritative",
    "Benevolent",
    "Candid",
    "Warm",
    "Insightful",
    "Collaborative",
    "Confidential",
    "Confident",
    "Constructive",
    "Courteous",
    "Decisive",
    "Delicate",
    "Diplomatic",
    "Direct",
    "Funny",
    "Empathetic",
    "Encouraging",
    "Enthusiastic",
    "Apologetic",
    "Firm",
    "Formal",
    "Humble",
    "Informative",
    "Inspiring",
    "Ironic",
    "Lucid",
    "Motivating",
    "Neutral",
    "Optimistic",
    "Persuasive",
    "Positive",
    "Professional",
    "Prudent",
    "Reassuring",
    "Grateful",
    "Sincere",
    "Solemn",
    "Urgent",
  ],
};

/**
 * 📏 Email length options (multilingual)
 */
export const EMAIL_LENGTHS = {
  FR: ["Court", "Moyen", "Long"],
  EN: ["Short", "Medium", "Long"],
};

/**
 * 🔐 Authentication providers
 */
export const AUTH_PROVIDERS = {
  EMAIL: "email",
  GOOGLE: "google",
};

/**
 * 💳 Subscription statuses
 */
export const SUBSCRIPTION_STATUS = {
  FREE: "free",
  PREMIUM: "premium",
  ENTERPRISE: "enterprise",
  SUSPENDED: "suspended",
};

/**
 * 📧 Email providers for connected accounts
 */
export const EMAIL_PROVIDERS = {
  GMAIL: "gmail",
  EMAILIGHT: "emailight",
  SMTP: "smtp",
};

/**
 * 🔐 Account health statuses
 */
export const HEALTH_STATUS = {
  HEALTHY: "healthy",
  TOKEN_EXPIRED: "token_expired",
  ERRORS: "errors",
  INACTIVE: "inactive",
};

/**
 * 📊 Daily email limits by subscription
 */
export const EMAIL_LIMITS = {
  [SUBSCRIPTION_STATUS.FREE]: 5,
  [SUBSCRIPTION_STATUS.PREMIUM]: 500,
  [SUBSCRIPTION_STATUS.ENTERPRISE]: 5000,
};

/**
 * 🛡️ Security constants
 */
export const SECURITY = {
  MAX_LOGIN_ATTEMPTS: 5,
  ACCOUNT_LOCK_DURATION: 2 * 60 * 60 * 1000, // 2 hours
  BCRYPT_ROUNDS: 12,
};

/**
 * 📁 File upload constants
 */
export const FILE_UPLOAD = {
  AVATAR: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    ALLOWED_EXTENSIONS: ["jpg", "jpeg", "png", "gif", "webp"],
  },
};

/**
 * 🎯 Helper functions to get enum values
 */
export const getEnumValues = {
  languages: () => Object.values(SUPPORTED_LANGUAGES),
  themes: () => Object.values(THEME_OPTIONS),
  authProviders: () => Object.values(AUTH_PROVIDERS),
  subscriptionStatuses: () => Object.values(SUBSCRIPTION_STATUS),
  emailProviders: () => Object.values(EMAIL_PROVIDERS),
  healthStatuses: () => Object.values(HEALTH_STATUS),

  // Language-specific helpers
  emailTones: (language = "FR") => EMAIL_TONES[language] || EMAIL_TONES.FR,
  emailLengths: (language = "FR") =>
    EMAIL_LENGTHS[language] || EMAIL_LENGTHS.FR,

  // Get default values
  defaultTone: (language = "FR") =>
    language === "EN" ? "Professional" : "Professionnel",
  defaultLength: (language = "FR") => (language === "EN" ? "Medium" : "Moyen"),
};
