// ============================================================================
// 📁 src/config/env.js - Configuration pour Docker uniquement
// ============================================================================

// ❌ PAS de require("dotenv").config() - tout vient de docker-compose

// Default logger (fallback to console)
let logger = {
  info: (msg, data) => console.log(`📡 [CONFIG] ${msg}`, data || ""),
  warn: (msg, data) => console.warn(`⚠️ [CONFIG] ${msg}`, data || ""),
  error: (msg, error) => console.error(`❌ [CONFIG] ${msg}`, error || ""),
  success: (msg, data) => console.log(`✅ [CONFIG] ${msg}`, data || ""),
};

/**
 * Allows injecting an external logger
 */
export const setLogger = (externalLogger) => {
  logger = externalLogger;
};

/**
 * Load and validate environment variables (from Docker environment)
 */
const config = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.USER_SERVICE_PORT) || 3001,
  HOST: process.env.HOST || "0.0.0.0",

  MONGODB_URI:
    process.env.MONGODB_URI ||
    "mongodb://emailight_app:your_secure_app_password_here@mongodb:27017/emailight",

  JWT_SECRET:
    process.env.JWT_SECRET || "your_super_secret_jwt_key_change_in_production",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  TOKEN_ENCRYPTION_KEY:
    process.env.TOKEN_ENCRYPTION_KEY || "your-32-character-secret-key-here",

  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000,

  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,

  ENABLE_LOGGING: process.env.ENABLE_LOGGING !== "false",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",

  GLITCHTIP_DSN: process.env.GLITCHTIP_DSN,
  GLITCHTIP_TRACES_SAMPLE_RATE: parseFloat(
    process.env.GLITCHTIP_TRACES_SAMPLE_RATE || "0.1"
  ),

  // ✅ AJOUT DES VARIABLES EXCEPTIONLESS MANQUANTES
  USER_SERVICE_EXCEPTIONLESS_API_KEY:
    process.env.USER_SERVICE_EXCEPTIONLESS_API_KEY,
  USER_SERVICE_EXCEPTIONLESS_SERVER_URL:
    process.env.USER_SERVICE_EXCEPTIONLESS_SERVER_URL ||
    "http://exceptionless:8080",

  LOCALE: process.env.LOCALE || "fr-FR",
  TIMEZONE: process.env.TIMEZONE || "Europe/Paris",
  VERBOSE_LOGS: process.env.VERBOSE_LOGS === "true",
};

/**
 * Validate critical environment variables and emit warnings/errors
 */
const validateConfig = () => {
  const errors = [];
  const warnings = [];

  const criticalVars = ["JWT_SECRET", "TOKEN_ENCRYPTION_KEY"];
  const defaultValues = {
    JWT_SECRET: "your_super_secret_jwt_key_change_in_production",
    TOKEN_ENCRYPTION_KEY: "your-32-character-secret-key-here",
  };

  criticalVars.forEach((varName) => {
    if (!config[varName] || config[varName] === defaultValues[varName]) {
      if (config.NODE_ENV === "production") {
        errors.push(`${varName} doit être défini en production`);
      } else {
        warnings.push(`${varName} utilise une valeur par défaut`);
      }
    }
  });

  if (config.JWT_SECRET && config.JWT_SECRET.length < 32) {
    warnings.push(
      "JWT_SECRET devrait contenir au moins 32 caractères pour plus de sécurité"
    );
  }

  if (
    config.TOKEN_ENCRYPTION_KEY &&
    config.TOKEN_ENCRYPTION_KEY.length !== 32
  ) {
    warnings.push(
      "TOKEN_ENCRYPTION_KEY doit contenir exactement 32 caractères"
    );
  }

  if (!config.MONGODB_URI.includes("emailight")) {
    warnings.push(
      "MONGODB_URI ne semble pas pointer vers la base de données emailight"
    );
  }

  if (config.PORT < 1024 && config.NODE_ENV === "production") {
    warnings.push(
      "Les ports < 1024 nécessitent des privilèges root en production"
    );
  }

  if (config.RATE_LIMIT_MAX > 1000) {
    warnings.push(
      "RATE_LIMIT_MAX est très élevé, envisagez de le réduire pour plus de sécurité"
    );
  }

  if (config.BCRYPT_ROUNDS < 10) {
    warnings.push("BCRYPT_ROUNDS < 10 peut être insuffisamment sécurisé");
  } else if (config.BCRYPT_ROUNDS > 15) {
    warnings.push("BCRYPT_ROUNDS > 15 peut nuire aux performances");
  }

  // ✅ VALIDATION EXCEPTIONLESS
  if (!config.USER_SERVICE_EXCEPTIONLESS_API_KEY) {
    if (config.NODE_ENV === "production") {
      warnings.push(
        "USER_SERVICE_EXCEPTIONLESS_API_KEY recommandé en production pour le monitoring d'erreurs"
      );
    } else {
      logger.info("Exceptionless désactivé - Aucune clé API fournie");
    }
  } else {
    logger.success("Exceptionless configuré", {
      apiKey: "***configured***",
      serverUrl: config.USER_SERVICE_EXCEPTIONLESS_SERVER_URL,
    });
  }

  if (errors.length > 0) {
    const errorMessage = `Variables d'environnement critiques manquantes : ${errors.join(", ")}`;
    logger.error(
      errorMessage,
      { errors, environment: config.NODE_ENV },
      {
        action: "config_validation_failed",
      }
    );
    throw new Error(errorMessage);
  }

  if (warnings.length > 0) {
    logger.warn(
      "Avertissements de configuration",
      {
        warnings,
        environment: config.NODE_ENV,
        recommendations: [
          "Vérifiez vos variables d'environnement en production",
          "Utilisez des clés sécurisées de longueur appropriée",
          "Référez-vous à la documentation pour les bonnes pratiques",
        ],
      },
      {
        action: "config_validation_warnings",
      }
    );
  }

  logger.success(
    "Configuration validée avec succès",
    {
      environment: config.NODE_ENV,
      port: config.PORT,
      database: config.MONGODB_URI.replace(/\/\/.*@/, "//***:***@"),
      jwt_configured: !!config.JWT_SECRET,
      encryption_configured: !!config.TOKEN_ENCRYPTION_KEY,
      glitchtip_enabled: !!config.GLITCHTIP_DSN,
      exceptionless_configured: !!config.USER_SERVICE_EXCEPTIONLESS_API_KEY,
      warnings_count: warnings.length,
    },
    {
      action: "config_validated",
    }
  );
};

/**
 * Returns a safe summary of current configuration
 */
export const getConfigSummary = () => {
  return {
    environment: config.NODE_ENV,
    service: "user-service",
    port: config.PORT,
    host: config.HOST,
    database: {
      connected: config.MONGODB_URI.includes("emailight"),
      uri_masked: config.MONGODB_URI.replace(/\/\/.*@/, "//***:***@"),
    },
    security: {
      jwt_configured:
        !!config.JWT_SECRET &&
        config.JWT_SECRET !== "your_super_secret_jwt_key_change_in_production",
      encryption_configured:
        !!config.TOKEN_ENCRYPTION_KEY &&
        config.TOKEN_ENCRYPTION_KEY !== "your-32-character-secret-key-here",
      bcrypt_rounds: config.BCRYPT_ROUNDS,
    },
    features: {
      logging_enabled: config.ENABLE_LOGGING,
      verbose_logs: config.VERBOSE_LOGS,
      glitchtip_enabled: !!config.GLITCHTIP_DSN,
      exceptionless_enabled: !!config.USER_SERVICE_EXCEPTIONLESS_API_KEY,
      rate_limiting: {
        max_requests: config.RATE_LIMIT_MAX,
        window_ms: config.RATE_LIMIT_WINDOW,
      },
    },
    monitoring: {
      exceptionless: {
        enabled: !!config.USER_SERVICE_EXCEPTIONLESS_API_KEY,
        serverUrl: config.USER_SERVICE_EXCEPTIONLESS_SERVER_URL,
        apiKey: config.USER_SERVICE_EXCEPTIONLESS_API_KEY
          ? "***configured***"
          : "not_configured",
      },
    },
    locale: {
      language: config.LOCALE,
      timezone: config.TIMEZONE,
    },
  };
};

/**
 * Re-validates the configuration after injecting an external logger
 */
export const revalidateWithLogger = () => {
  logger.info("Revalidation de la configuration avec le logger injecté");
  validateConfig();
};

// Initial validation on import (with fallback logger)
validateConfig();

// ✅ Export ES modules cohérent
export default {
  ...config,
  setLogger,
  getConfigSummary,
  revalidateWithLogger,
};
