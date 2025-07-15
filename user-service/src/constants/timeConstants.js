// ============================================================================
// src/constants/timeConstants.js - Constantes temporelles et durées
// ============================================================================

/**
 * ⏰ Durées en millisecondes
 */
export const DURATION = {
  // Secondes
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,

  // Durées spécifiques business
  THIRTY_DAYS: 30 * 24 * 60 * 60 * 1000,
  THREE_MONTHS: 90 * 24 * 60 * 60 * 1000,
  ONE_YEAR: 365 * 24 * 60 * 60 * 1000,
};

/**
 * 🔐 Constantes de sécurité et nettoyage
 */
export const SECURITY_INTERVALS = {
  // Durées de verrouillage et expiration
  ACCOUNT_LOCK_DURATION: 2 * DURATION.HOUR,
  PASSWORD_RESET_EXPIRY: 1 * DURATION.HOUR,
  EMAIL_VERIFICATION_EXPIRY: 24 * DURATION.HOUR,

  // Nettoyage automatique
  INACTIVE_ACCOUNT_THRESHOLD: DURATION.THIRTY_DAYS,
  TOKEN_CLEANUP_THRESHOLD: 7 * DURATION.DAY,
  OLD_PASSWORD_WARNING: DURATION.ONE_YEAR,

  // Activité utilisateur
  INACTIVE_SESSION_THRESHOLD: 30 * DURATION.MINUTE,
  LAST_USED_WARNING_THRESHOLD: DURATION.THIRTY_DAYS,
};

/**
 * 📧 Constantes email et quotas
 */
export const EMAIL_CONSTANTS = {
  // Timeouts et retry
  SMTP_TIMEOUT: 10 * DURATION.SECOND,
  SMTP_TEST_TIMEOUT: 30 * DURATION.SECOND,
  IMAP_TIMEOUT: 15 * DURATION.SECOND,

  // Intervalles de nettoyage
  QUOTA_RESET_INTERVAL: DURATION.HOUR, // Vérification toutes les heures
  HEALTH_CHECK_INTERVAL: 5 * DURATION.MINUTE,

  // Seuils d'erreur
  MAX_ERROR_COUNT: 10,
  ERROR_RESET_INTERVAL: DURATION.DAY,
};

/**
 * 📁 Constantes de fichiers et uploads
 */
export const FILE_CONSTANTS = {
  // Durées de conservation
  TEMP_FILE_CLEANUP: 1 * DURATION.HOUR,
  ORPHANED_FILE_CLEANUP: 7 * DURATION.DAY,

  // Timeouts upload
  UPLOAD_TIMEOUT: 30 * DURATION.SECOND,
  AVATAR_PROCESSING_TIMEOUT: 10 * DURATION.SECOND,
};

/**
 * 🧹 Constantes de maintenance et nettoyage
 */
export const MAINTENANCE = {
  // Intervalles de nettoyage
  DAILY_CLEANUP: DURATION.DAY,
  WEEKLY_CLEANUP: DURATION.WEEK,

  // Seuils pour considérer les données obsolètes
  SUSPICIOUS_ACTIVITY_RETENTION: DURATION.THIRTY_DAYS,
  AUDIT_LOG_RETENTION: DURATION.THREE_MONTHS,
  DEVICE_FINGERPRINT_RETENTION: DURATION.THREE_MONTHS,

  // Limites de conservation
  MAX_SUSPICIOUS_FLAGS: 10,
  MAX_KNOWN_DEVICES: 5,
  MAX_AUDIT_ENTRIES_PER_USER: 1000,
};

/**
 * 🌐 Constantes de timezone et localisation
 */
export const TIMEZONE_CONSTANTS = {
  // Timezone par défaut
  DEFAULT_TIMEZONE: "Europe/Paris",

  // Timezones supportées (principales)
  SUPPORTED_TIMEZONES: [
    "Europe/Paris",
    "Europe/London",
    "Europe/Berlin",
    "Europe/Madrid",
    "Europe/Rome",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Toronto",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Asia/Dubai",
    "Australia/Sydney",
    "UTC",
  ],

  // Validation timezone
  TIMEZONE_REGEX: /^[A-Za-z_]+\/[A-Za-z_]+$/,
};

/**
 * 🔢 Limites numériques
 */
export const LIMITS = {
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Strings et textes
  MAX_NAME_LENGTH: 100,
  MIN_NAME_LENGTH: 2,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_USER_AGENT_LENGTH: 500,

  // Arrays et collections
  MAX_CONNECTED_ACCOUNTS: 10,
  MAX_SUSPICIOUS_FLAGS: 10,
  MAX_KNOWN_DEVICES: 5,

  // Scores et pourcentages
  MIN_SECURITY_SCORE: 0,
  MAX_SECURITY_SCORE: 100,
  SECURITY_WARNING_THRESHOLD: 70,
  SECURITY_CRITICAL_THRESHOLD: 50,
};

/**
 * 🎯 Helpers pour calculer des durées
 */
export const TIME_HELPERS = {
  /**
   * Vérifie si une date est expirée
   */
  isExpired: (date, duration = 0) => {
    if (!date) return true;
    return Date.now() - new Date(date).getTime() > duration;
  },

  /**
   * Calcule la date d'expiration
   */
  getExpiryDate: (duration) => {
    return new Date(Date.now() + duration);
  },

  /**
   * Vérifie si c'est un nouveau jour dans une timezone
   */
  isNewDay: (lastDate, timezone = TIMEZONE_CONSTANTS.DEFAULT_TIMEZONE) => {
    if (!lastDate) return true;

    try {
      const today = new Date().toLocaleDateString("en-CA", {
        timeZone: timezone,
      });
      const lastDay = new Date(lastDate).toLocaleDateString("en-CA", {
        timeZone: timezone,
      });
      return today !== lastDay;
    } catch (error) {
      // Fallback UTC
      const today = new Date().toISOString().split("T")[0];
      const lastDay = new Date(lastDate).toISOString().split("T")[0];
      return today !== lastDay;
    }
  },

  /**
   * Obtient le début de la journée dans une timezone
   */
  getStartOfDay: (timezone = TIMEZONE_CONSTANTS.DEFAULT_TIMEZONE) => {
    try {
      const today = new Date();
      const todayStr = today.toLocaleDateString("en-CA", {
        timeZone: timezone,
      });
      return new Date(todayStr + "T00:00:00");
    } catch (error) {
      // Fallback UTC
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      return today;
    }
  },

  /**
   * Formate une durée pour l'affichage
   */
  formatDuration: (milliseconds) => {
    const days = Math.floor(milliseconds / DURATION.DAY);
    const hours = Math.floor((milliseconds % DURATION.DAY) / DURATION.HOUR);
    const minutes = Math.floor(
      (milliseconds % DURATION.HOUR) / DURATION.MINUTE
    );

    if (days > 0) return `${days}j ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  },
};

/**
 * 🔧 Configuration d'environnement avec fallbacks
 */
export const ENV_CONSTANTS = {
  // URLs et domaines
  DEFAULT_BASE_URL: "http://localhost:3001",
  DEFAULT_FRONTEND_URL: "http://localhost:3000",

  // Sécurité
  DEFAULT_BCRYPT_ROUNDS: 12,
  DEFAULT_JWT_EXPIRY: "15m",
  DEFAULT_REFRESH_TOKEN_EXPIRY: "7d",

  // Performance
  DEFAULT_CACHE_TTL: 5 * DURATION.MINUTE,
  DEFAULT_REQUEST_TIMEOUT: 30 * DURATION.SECOND,
};

export default {
  DURATION,
  SECURITY_INTERVALS,
  EMAIL_CONSTANTS,
  FILE_CONSTANTS,
  MAINTENANCE,
  TIMEZONE_CONSTANTS,
  LIMITS,
  TIME_HELPERS,
  ENV_CONSTANTS,
};
