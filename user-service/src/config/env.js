// ============================================================================
// 📁 src/config/env.js - Configuration avec OAuth Gmail et SMTP
// ============================================================================

// ❌ PAS de require("dotenv").config() - tout vient de docker-compose

// Default logger (fallback to console)
let logger = {
  info: (msg, data) => {
    if (typeof console !== "undefined") {
      console.log(`📡 [CONFIG] ${msg}`, data || "");
    }
  },
  warn: (msg, data) => {
    if (typeof console !== "undefined") {
      console.warn(`⚠️ [CONFIG] ${msg}`, data || "");
    }
  },
  error: (msg, error) => {
    if (typeof console !== "undefined") {
      console.error(`❌ [CONFIG] ${msg}`, error || "");
    }
  },
  success: (msg, data) => {
    if (typeof console !== "undefined") {
      console.log(`✅ [CONFIG] ${msg}`, data || "");
    }
  },
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
  // ============================================================================
  // 🌍 ENVIRONNEMENT ET BASE
  // ============================================================================
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.USER_SERVICE_PORT) || 3001,
  HOST: process.env.HOST || "0.0.0.0",

  // ============================================================================
  // 🗄️ BASE DE DONNÉES
  // ============================================================================
  MONGODB_URI:
    process.env.MONGODB_URI ||
    "mongodb://emailight_app:your_secure_app_password_here@mongodb:27017/emailight",

  // ============================================================================
  // 🔐 SÉCURITÉ ET CHIFFREMENT
  // ============================================================================
  JWT_SECRET:
    process.env.JWT_SECRET || "your_super_secret_jwt_key_change_in_production",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  // 🆕 Clé de chiffrement pour les tokens OAuth et credentials SMTP (AES-256)
  ENCRYPTION_KEY:
    process.env.ENCRYPTION_KEY || process.env.TOKEN_ENCRYPTION_KEY,

  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,

  // ============================================================================
  // 🔒 RATE LIMITING
  // ============================================================================
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000,

  // ============================================================================
  // 🆕 GMAIL OAUTH (connexions email)
  // ============================================================================
  GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET,
  GMAIL_REDIRECT_URI:
    process.env.GMAIL_REDIRECT_URI ||
    "http://localhost:3000/auth/gmail/callback",

  // ============================================================================
  // 🆕 TOKEN REFRESH SERVICE
  // ============================================================================
  TOKEN_REFRESH_INTERVAL_MINUTES: parseInt(
    process.env.TOKEN_REFRESH_INTERVAL_MINUTES || "60"
  ), // Refresh toutes les 60 minutes par défaut
  TOKEN_REFRESH_THRESHOLD_MINUTES: parseInt(
    process.env.TOKEN_REFRESH_THRESHOLD_MINUTES || "30"
  ), // Refresh si expire dans 30 minutes

  // ============================================================================
  // 🆕 SMTP CONFIGURATION
  // ============================================================================
  // Timeout pour les connexions SMTP (en millisecondes)
  SMTP_TIMEOUT: parseInt(process.env.SMTP_TIMEOUT) || 10000,

  // Nombre maximum de connexions SMTP simultanées
  SMTP_MAX_CONNECTIONS: parseInt(process.env.SMTP_MAX_CONNECTIONS) || 5,

  // Limite de messages SMTP par minute
  SMTP_RATE_LIMIT: parseInt(process.env.SMTP_RATE_LIMIT) || 10,

  // Configuration SMTP système (pour les emails de notification)
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,

  // ============================================================================
  // 📁 UPLOAD CONFIGURATION
  // ============================================================================
  UPLOAD_MAX_SIZE: parseInt(process.env.UPLOAD_MAX_SIZE) || 5 * 1024 * 1024, // 5MB
  UPLOAD_ALLOWED_TYPES: process.env.UPLOAD_ALLOWED_TYPES?.split(",") || [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/bmp",
  ],

  // ============================================================================
  // 🔧 REDIS (pour les queues)
  // ============================================================================
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",

  // ============================================================================
  // 🚨 MONITORING ET LOGGING
  // ============================================================================
  ENABLE_LOGGING: process.env.ENABLE_LOGGING !== "false",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  VERBOSE_LOGS: process.env.VERBOSE_LOGS === "true",

  GLITCHTIP_DSN: process.env.GLITCHTIP_DSN,
  GLITCHTIP_TRACES_SAMPLE_RATE: parseFloat(
    process.env.GLITCHTIP_TRACES_SAMPLE_RATE || "0.1"
  ),

  USER_SERVICE_EXCEPTIONLESS_API_KEY:
    process.env.USER_SERVICE_EXCEPTIONLESS_API_KEY,
  USER_SERVICE_EXCEPTIONLESS_SERVER_URL:
    process.env.USER_SERVICE_EXCEPTIONLESS_SERVER_URL ||
    "http://exceptionless:8080",

  // ============================================================================
  // 🌍 LOCALE ET DIVERS
  // ============================================================================
  LOCALE: process.env.LOCALE || "fr-FR",
  TIMEZONE: process.env.TIMEZONE || "Europe/Paris",

  // ============================================================================
  // 🆕 CONFIGURATION PRODUCTION (optionnel)
  // ============================================================================
  APP_BASE_URL: process.env.APP_BASE_URL || "http://localhost:3001",
  APP_NAME: process.env.APP_NAME || "Emailight",
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || "support@emailight.com",

  // CORS Origins autorisées
  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(",") || [
    "http://localhost:3001",
    "https://app.emailight.com",
  ],
};

/**
 * 🆕 Générer une clé de chiffrement (helper pour le développement)
 */
export const generateEncryptionKey = () => {
  const crypto = require("crypto");
  return crypto.randomBytes(32).toString("hex");
};

/**
 * 🆕 Obtenir la configuration SMTP par défaut
 */
export const getDefaultSmtpConfig = () => {
  return {
    timeout: config.SMTP_TIMEOUT,
    maxConnections: config.SMTP_MAX_CONNECTIONS,
    rateLimit: config.SMTP_RATE_LIMIT,
    pool: true,
    secure: false, // Utilisera STARTTLS par défaut
    requireTLS: true,
    tls: {
      rejectUnauthorized: config.NODE_ENV === "production", // Plus strict en production
    },
  };
};

/**
 * 🆕 Obtenir la configuration de chiffrement
 */
export const getEncryptionConfig = () => {
  if (!config.ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY non configuré");
  }

  return {
    algorithm: "aes-256-gcm",
    key: Buffer.from(config.ENCRYPTION_KEY, "hex"),
    keyLength: 32, // 32 bytes = 256 bits
  };
};

/**
 * Validate critical environment variables and emit warnings/errors
 */
const validateConfig = () => {
  const errors = [];
  const warnings = [];

  // ============================================================================
  // 🔐 VALIDATION CRITIQUE
  // ============================================================================
  const criticalVars = ["JWT_SECRET", "ENCRYPTION_KEY"];
  const defaultValues = {
    JWT_SECRET: "your_super_secret_jwt_key_change_in_production",
    ENCRYPTION_KEY: "your-32-character-secret-key-here",
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

  // Validation JWT_SECRET
  if (config.JWT_SECRET && config.JWT_SECRET.length < 32) {
    warnings.push(
      "JWT_SECRET devrait contenir au moins 32 caractères pour plus de sécurité"
    );
  }

  // 🆕 Validation ENCRYPTION_KEY (plus stricte)
  if (config.ENCRYPTION_KEY) {
    if (config.ENCRYPTION_KEY.length !== 64) {
      if (config.NODE_ENV === "production") {
        errors.push(
          "ENCRYPTION_KEY doit être une clé hexadécimale de 64 caractères (32 bytes)"
        );
      } else {
        warnings.push(
          "ENCRYPTION_KEY doit être une clé hexadécimale de 64 caractères (32 bytes)"
        );
      }
    }

    // Vérifier que c'est bien de l'hexadécimal
    if (!/^[0-9a-fA-F]{64}$/.test(config.ENCRYPTION_KEY)) {
      errors.push("ENCRYPTION_KEY doit être une chaîne hexadécimale valide");
    }
  } else if (config.NODE_ENV === "production") {
    errors.push(
      "ENCRYPTION_KEY est obligatoire en production pour chiffrer les credentials SMTP"
    );
  }

  // ============================================================================
  // 🗄️ VALIDATION BASE DE DONNÉES
  // ============================================================================
  if (!config.MONGODB_URI.includes("emailight")) {
    warnings.push(
      "MONGODB_URI ne semble pas pointer vers la base de données emailight"
    );
  }

  // ============================================================================
  // 🔒 VALIDATION SÉCURITÉ
  // ============================================================================
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

  // ============================================================================
  // 🆕 VALIDATION GMAIL OAUTH (connexions email)
  // ============================================================================
  if (!config.GMAIL_CLIENT_ID || !config.GMAIL_CLIENT_SECRET) {
    if (config.NODE_ENV === "production") {
      warnings.push(
        "GMAIL_CLIENT_ID et GMAIL_CLIENT_SECRET recommandés en production pour OAuth Gmail"
      );
    } else {
      logger.info("Gmail OAuth désactivé - Clés non configurées");
    }
  } else {
    logger.success("Gmail OAuth configuré", {
      clientId: config.GMAIL_CLIENT_ID ? "***configured***" : "not_configured",
      redirectUri: config.GMAIL_REDIRECT_URI,
    });
  }

  // ============================================================================
  // 🆕 VALIDATION TOKEN REFRESH
  // ============================================================================
  if (config.TOKEN_REFRESH_INTERVAL_MINUTES < 30) {
    warnings.push(
      "TOKEN_REFRESH_INTERVAL_MINUTES trop court, minimum recommandé: 30 minutes"
    );
  }

  if (config.TOKEN_REFRESH_THRESHOLD_MINUTES < 10) {
    warnings.push(
      "TOKEN_REFRESH_THRESHOLD_MINUTES trop court, minimum recommandé: 10 minutes"
    );
  }

  // ============================================================================
  // 🆕 VALIDATION SMTP
  // ============================================================================
  if (config.SMTP_TIMEOUT < 5000) {
    warnings.push("SMTP_TIMEOUT très court, minimum recommandé: 5000ms");
  }

  if (config.SMTP_MAX_CONNECTIONS < 1 || config.SMTP_MAX_CONNECTIONS > 20) {
    warnings.push("SMTP_MAX_CONNECTIONS devrait être entre 1 et 20");
  }

  if (config.SMTP_RATE_LIMIT > 60) {
    warnings.push(
      "SMTP_RATE_LIMIT élevé, risque de dépassement des quotas providers"
    );
  }

  // ============================================================================
  // 🆕 VALIDATION UPLOADS
  // ============================================================================
  if (config.UPLOAD_MAX_SIZE > 10 * 1024 * 1024) {
    // 10MB
    warnings.push("UPLOAD_MAX_SIZE très élevé, peut impacter les performances");
  }

  // ============================================================================
  // 🚨 VALIDATION EXCEPTIONLESS
  // ============================================================================
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

  // ============================================================================
  // 🔥 GESTION DES ERREURS CRITIQUES
  // ============================================================================
  if (errors.length > 0) {
    const errorMessage = `Variables d'environnement critiques manquantes ou invalides : ${errors.join(
      ", "
    )}`;
    logger.error(
      errorMessage,
      { errors, environment: config.NODE_ENV },
      {
        action: "config_validation_failed",
      }
    );

    if (config.NODE_ENV === "production") {
      throw new Error(errorMessage);
    }
  }

  // ============================================================================
  // ⚠️ GESTION DES AVERTISSEMENTS
  // ============================================================================
  if (warnings.length > 0) {
    logger.warn(
      "Avertissements de configuration",
      {
        warnings,
        environment: config.NODE_ENV,
        recommendations: [
          "Vérifiez vos variables d'environnement en production",
          "Utilisez des clés sécurisées de longueur appropriée",
          "Configurez Google OAuth pour l'authentification sociale",
          "Configurez Gmail OAuth pour les connexions email",
          "Générez une ENCRYPTION_KEY avec: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
          "Référez-vous à la documentation pour les bonnes pratiques",
        ],
      },
      {
        action: "config_validation_warnings",
      }
    );
  }

  // ============================================================================
  // ✅ VALIDATION RÉUSSIE
  // ============================================================================
  logger.success(
    "Configuration validée avec succès",
    {
      environment: config.NODE_ENV,
      port: config.PORT,
      database: config.MONGODB_URI.replace(/\/\/.*@/, "//***:***@"),
      security: {
        jwt_configured: !!config.JWT_SECRET,
        encryption_configured: !!config.ENCRYPTION_KEY,
        encryption_key_valid: config.ENCRYPTION_KEY?.length === 64,
        bcrypt_rounds: config.BCRYPT_ROUNDS,
      },
      oauth: {
        google_enabled: false,
        gmail_enabled: !!(config.GMAIL_CLIENT_ID && config.GMAIL_CLIENT_SECRET),
      },
      smtp: {
        timeout: config.SMTP_TIMEOUT,
        max_connections: config.SMTP_MAX_CONNECTIONS,
        rate_limit: config.SMTP_RATE_LIMIT,
        system_smtp_configured: !!(config.SMTP_HOST && config.SMTP_USER),
      },
      token_refresh: {
        interval_minutes: config.TOKEN_REFRESH_INTERVAL_MINUTES,
        threshold_minutes: config.TOKEN_REFRESH_THRESHOLD_MINUTES,
      },
      uploads: {
        max_size_mb: Math.round(config.UPLOAD_MAX_SIZE / 1024 / 1024),
        allowed_types: config.UPLOAD_ALLOWED_TYPES.length,
      },
      monitoring: {
        glitchtip_enabled: !!config.GLITCHTIP_DSN,
        exceptionless_configured: !!config.USER_SERVICE_EXCEPTIONLESS_API_KEY,
      },
      warnings_count: warnings.length,
      errors_count: errors.length,
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
      encryption_configured: !!config.ENCRYPTION_KEY,
      encryption_key_valid: config.ENCRYPTION_KEY?.length === 64,
      bcrypt_rounds: config.BCRYPT_ROUNDS,
      rate_limiting: {
        max_requests: config.RATE_LIMIT_MAX,
        window_ms: config.RATE_LIMIT_WINDOW,
      },
    },
    oauth: {
      google: {
        enabled: false,
        client_id: "not_configured",
        redirect_uri: "not_configured",
      },
      gmail: {
        enabled: !!(config.GMAIL_CLIENT_ID && config.GMAIL_CLIENT_SECRET),
        client_id: config.GMAIL_CLIENT_ID
          ? "***configured***"
          : "not_configured",
        redirect_uri: config.GMAIL_REDIRECT_URI,
      },
    },
    smtp: {
      timeout: config.SMTP_TIMEOUT,
      max_connections: config.SMTP_MAX_CONNECTIONS,
      rate_limit: config.SMTP_RATE_LIMIT,
      system_smtp_configured: !!(config.SMTP_HOST && config.SMTP_USER),
    },
    tokenRefresh: {
      intervalMinutes: config.TOKEN_REFRESH_INTERVAL_MINUTES,
      thresholdMinutes: config.TOKEN_REFRESH_THRESHOLD_MINUTES,
    },
    uploads: {
      max_size_mb: Math.round(config.UPLOAD_MAX_SIZE / 1024 / 1024),
      allowed_types: config.UPLOAD_ALLOWED_TYPES,
    },
    features: {
      logging_enabled: config.ENABLE_LOGGING,
      verbose_logs: config.VERBOSE_LOGS,
      glitchtip_enabled: !!config.GLITCHTIP_DSN,
      exceptionless_enabled: !!config.USER_SERVICE_EXCEPTIONLESS_API_KEY,
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
    app: {
      name: config.APP_NAME,
      base_url: config.APP_BASE_URL,
      support_email: config.SUPPORT_EMAIL,
      cors_origins: config.CORS_ORIGINS.length,
    },
    locale: {
      language: config.LOCALE,
      timezone: config.TIMEZONE,
    },
  };
};

/**
 * 📊 Obtenir les métriques de configuration
 */
export const getConfigMetrics = () => {
  const summary = getConfigSummary();

  return {
    totalConfigured: Object.values(summary).filter((section) =>
      typeof section === "object"
        ? Object.values(section).some(
            (v) =>
              v === true || (typeof v === "string" && v.includes("configured"))
          )
        : !!section
    ).length,
    criticalMissing: [
      !config.JWT_SECRET && "JWT_SECRET",
      !config.ENCRYPTION_KEY && "ENCRYPTION_KEY",
      !config.MONGODB_URI && "MONGODB_URI",
    ].filter(Boolean),
    optionalMissing: [
      !config.GMAIL_CLIENT_ID && "GMAIL_CLIENT_ID",

      !config.USER_SERVICE_EXCEPTIONLESS_API_KEY && "EXCEPTIONLESS_API_KEY",
    ].filter(Boolean),
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString(),
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
  getConfigMetrics,
  getDefaultSmtpConfig,
  getEncryptionConfig,
  generateEncryptionKey,
  revalidateWithLogger,
};
