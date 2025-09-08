// ============================================================================
// 📁 src/constants/validationRules.js - Centralized validation rules
// ============================================================================

import { SECURITY } from "./enums.js";

/**
 * 🔐 Authentication & User validation rules
 * Single source of truth for all validation constraints
 */
export const VALIDATION_RULES = {
  // 👤 User profile validation
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
    PATTERN: /^[a-zA-ZÀ-ÿ0-9\s'.-]+$/, // Lettres, chiffres, espaces, apostrophes, points, tirets
    TRIM: true,
  },

  EMAIL: {
    PATTERN: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
    MAX_LENGTH: 255,
    TRIM: true,
    LOWERCASE: true,
  },

  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 128,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, // Au moins 1 minuscule, 1 majuscule, 1 chiffre
    BCRYPT_ROUNDS: SECURITY.BCRYPT_ROUNDS,
  },

  // 🔑 Token validation
  TOKEN: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 1000,
  },

  REFRESH_TOKEN: {
    MIN_LENGTH: 20,
    MAX_LENGTH: 1000,
  },

  // 🔄 Password reset
  PASSWORD_RESET_TOKEN: {
    MIN_LENGTH: 32,
    MAX_LENGTH: 64,
    EXPIRY_HOURS: 24,
  },

  EMAIL_VERIFICATION_TOKEN: {
    MIN_LENGTH: 32,
    MAX_LENGTH: 64,
    EXPIRY_HOURS: 48,
  },

  // 🖼️ Profile picture
  PROFILE_PICTURE: {
    URL_PATTERN: /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|bmp)(\?.*)?$/i,
    LOCAL_PATTERN: /^\/uploads\/.+\.(jpg|jpeg|png|gif|webp|bmp)$/i,
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/bmp",
    ],
  },

  // ⚙️ User preferences
  PREFERENCES: {
    THEME: {
      ALLOWED_VALUES: ["light", "dark", "auto"],
    },
    LANGUAGE: {
      ALLOWED_VALUES: [
        "FR",
        "EN",
        "ES",
        "DE",
        "IT",
        "PT",
        "NL",
        "RU",
        "ZH",
        "JA",
      ],
    },
    DEFAULT_TONE: {
      ALLOWED_VALUES: [
        "Professionnel",
        "Formelle",
        "Amical",
        "Familier",
        "Expert",
        "Confiant",
        "Aimant",
        "Prudent",
        "Affligeant",
        "Excitant",
        "Inspirant",
        "Informatif",
        "Direct",
        "Attentionné",
        "Surprise",
        "Persuasif",
        "Joyeux",
      ],
    },
    DEFAULT_LENGTH: {
      ALLOWED_VALUES: ["Court", "Moyen", "Long"],
    },
  },

  // 📧 Email account validation
  EMAIL_ACCOUNT: {
    PROVIDER: {
      ALLOWED_VALUES: ["gmail", "emailight", "yahoo", "other"],
    },
    DISPLAY_NAME: {
      MAX_LENGTH: 100,
    },
  },

  // 🆔 MongoDB ObjectId validation
  OBJECT_ID: {
    PATTERN: /^[0-9a-fA-F]{24}$/,
  },
};

/**
 * 🛡️ Security validation rules
 */
export const SECURITY_RULES = {
  LOGIN_ATTEMPTS: {
    MAX_ATTEMPTS: SECURITY.MAX_LOGIN_ATTEMPTS,
    LOCK_DURATION: SECURITY.ACCOUNT_LOCK_DURATION,
  },

  PASSWORD_RESET: {
    MAX_ATTEMPTS: 3,
    COOLDOWN_MINUTES: 15,
  },

  SESSION: {
    ACCESS_TOKEN_EXPIRY: "24h",
    REFRESH_TOKEN_EXPIRY: "7d",
  },
};

/**
 * 🎯 Helper functions for validation
 */
export const VALIDATION_HELPERS = {
  /**
   * Check if string matches pattern
   */
  matchesPattern: (value, pattern) => {
    return pattern.test(value);
  },

  /**
   * Check if string length is within bounds
   */
  isLengthValid: (value, min, max) => {
    if (!value) return false;
    const length = value.length;
    return length >= min && length <= max;
  },

  /**
   * Check if email format is valid
   */
  isEmailValid: (email) => {
    return VALIDATION_RULES.EMAIL.PATTERN.test(email);
  },

  /**
   * Check if password meets security requirements
   */
  isPasswordSecure: (password) => {
    return VALIDATION_RULES.PASSWORD.PATTERN.test(password);
  },

  /**
   * Check if MongoDB ObjectId is valid
   */
  isObjectIdValid: (id) => {
    return VALIDATION_RULES.OBJECT_ID.PATTERN.test(id);
  },

  /**
   * Sanitize string input
   */
  sanitizeString: (value, options = {}) => {
    if (!value || typeof value !== "string") return value;

    let sanitized = value;

    if (options.trim !== false) {
      sanitized = sanitized.trim();
    }

    if (options.lowercase) {
      sanitized = sanitized.toLowerCase();
    }

    return sanitized;
  },
};

/**
 * 📋 Validation rule getters for easy access
 */
export const getValidationRule = (category, field) => {
  return VALIDATION_RULES[category]?.[field];
};

export const getSecurityRule = (category, field) => {
  return SECURITY_RULES[category]?.[field];
};
