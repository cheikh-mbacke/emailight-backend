// ============================================================================
// 📁 src/utils/logger.js - Logger avec GlitchTip pour user-service
// ============================================================================

const Sentry = require("@sentry/node");
const config = require("../config/env");

// Vérifier si GlitchTip/Sentry est activé
const isGlitchTipEnabled = Boolean(
  process.env.GLITCHTIP_DSN || process.env.SENTRY_DSN
);
const isVerbose =
  process.env.VERBOSE_LOGS === "true" || config.NODE_ENV === "development";

// Initialisation conditionnelle de GlitchTip
if (isGlitchTipEnabled) {
  try {
    Sentry.init({
      dsn: process.env.GLITCHTIP_DSN || process.env.SENTRY_DSN,
      debug: config.NODE_ENV === "development",
      environment: config.NODE_ENV,
      serverName: "user-service",
      tracesSampleRate: parseFloat(
        process.env.GLITCHTIP_TRACES_SAMPLE_RATE || "0.1"
      ),
      beforeSend(event) {
        // Filtrer les erreurs non critiques en production
        if (config.NODE_ENV === "production" && event.level === "info") {
          return null;
        }
        return event;
      },
      integrations: [
        new Sentry.Integrations.Http({ breadcrumbs: true, tracing: true }),
        new Sentry.Integrations.OnUncaughtException(),
        new Sentry.Integrations.OnUnhandledRejection(),
      ],
    });

    console.log("✅ GlitchTip initialisé avec succès");
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation de GlitchTip:", error);
  }
} else {
  console.warn("⚠️ GlitchTip désactivé - GLITCHTIP_DSN non fourni");
}

// Niveaux de log avec emojis (style Emailight)
const LOG_LEVELS = {
  INFO: "📡",
  SUCCESS: "✅",
  ERROR: "❌",
  DEBUG: "🔍",
  WARNING: "⚠️",
  AUTH: "🔐",
  DB: "🗃️",
  API: "🌐",
  USER: "👤",
};

// Fonction pour obtenir un timestamp localisé
const getTimestamp = () => {
  return new Date().toLocaleString(process.env.LOCALE || "fr-FR", {
    timeZone: process.env.TIMEZONE || "Europe/Paris",
    hour12: false, // Format 24h
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// Fonction pour ajouter le contexte utilisateur à GlitchTip
const setUserContext = (userId, email) => {
  if (isGlitchTipEnabled) {
    Sentry.setUser({
      id: userId,
      email: email,
    });
  }
};

// Fonction pour ajouter des tags personnalisés
const setTags = (tags) => {
  if (isGlitchTipEnabled) {
    Sentry.setTags(tags);
  }
};

// Logger principal avec méthodes spécialisées
const logger = {
  // Log d'information générale
  info: (message, data = "", context = {}) => {
    const logMessage = `[${getTimestamp()}] ${LOG_LEVELS.INFO} [USER-SERVICE] ${message}`;
    console.log(logMessage, data);

    if (isGlitchTipEnabled && context.userId) {
      Sentry.addBreadcrumb({
        message,
        level: "info",
        data: typeof data === "object" ? data : { info: data },
      });
    }
  },

  // Log de succès
  success: (message, data = "", context = {}) => {
    const logMessage = `[${getTimestamp()}] ${LOG_LEVELS.SUCCESS} [USER-SERVICE] ${message}`;
    console.log(logMessage, data);

    if (isGlitchTipEnabled && context.userId) {
      Sentry.addBreadcrumb({
        message,
        level: "info",
        data: typeof data === "object" ? data : { success: data },
      });
    }
  },

  // Log d'avertissement
  warn: (message, data = "", context = {}) => {
    const logMessage = `[${getTimestamp()}] ${LOG_LEVELS.WARNING} [USER-SERVICE] ${message}`;
    console.warn(logMessage, data);

    if (isGlitchTipEnabled) {
      if (context.userId) setUserContext(context.userId, context.email);
      Sentry.captureMessage(`[WARN] ${message}`, "warning");
    }
  },

  // Log de debug (uniquement en mode verbose)
  debug: (message, data = "", context = {}) => {
    if (isVerbose) {
      const logMessage = `[${getTimestamp()}] ${LOG_LEVELS.DEBUG} [USER-SERVICE] ${message}`;
      console.log(logMessage, data);
    }
  },

  // Log d'erreur avec remontée GlitchTip
  error: (message, error = "", context = {}) => {
    const logMessage = `[${getTimestamp()}] ${LOG_LEVELS.ERROR} [USER-SERVICE] ${message}`;
    console.error(logMessage, error);

    if (isGlitchTipEnabled) {
      // Ajouter le contexte utilisateur si disponible
      if (context.userId) {
        setUserContext(context.userId, context.email);
      }

      // Ajouter des tags pour faciliter le filtrage
      setTags({
        service: "user-service",
        action: context.action || "unknown",
        endpoint: context.endpoint || "unknown",
      });

      if (error instanceof Error) {
        Sentry.captureException(error);
      } else {
        Sentry.captureException(new Error(`${message}: ${error}`));
      }
    }
  },

  // Log spécifique aux opérations d'authentification
  auth: (message, data = "", context = {}) => {
    const logMessage = `[${getTimestamp()}] ${LOG_LEVELS.AUTH} [AUTH] ${message}`;
    console.log(logMessage, data);

    if (isGlitchTipEnabled) {
      Sentry.addBreadcrumb({
        message,
        level: "info",
        category: "auth",
        data: typeof data === "object" ? data : { auth: data },
      });
    }
  },

  // Log spécifique aux opérations base de données
  db: (message, data = "", context = {}) => {
    const logMessage = `[${getTimestamp()}] ${LOG_LEVELS.DB} [DATABASE] ${message}`;
    console.log(logMessage, data);

    if (isGlitchTipEnabled) {
      Sentry.addBreadcrumb({
        message,
        level: "info",
        category: "database",
        data: typeof data === "object" ? data : { db: data },
      });
    }
  },

  // Log spécifique aux appels API
  api: (message, data = "", context = {}) => {
    const logMessage = `[${getTimestamp()}] ${LOG_LEVELS.API} [API] ${message}`;
    console.log(logMessage, data);

    if (isGlitchTipEnabled) {
      Sentry.addBreadcrumb({
        message,
        level: "info",
        category: "api",
        data: typeof data === "object" ? data : { api: data },
      });
    }
  },

  // Log spécifique aux actions utilisateur
  user: (message, data = "", context = {}) => {
    const logMessage = `[${getTimestamp()}] ${LOG_LEVELS.USER} [USER] ${message}`;
    console.log(logMessage, data);

    if (isGlitchTipEnabled && context.userId) {
      setUserContext(context.userId, context.email);
      Sentry.addBreadcrumb({
        message,
        level: "info",
        category: "user",
        data: typeof data === "object" ? data : { user: data },
      });
    }
  },
};

// Gestion globale des erreurs non capturées
process.on("unhandledRejection", (reason, promise) => {
  const errorMessage = "⚠️ Unhandled Promise Rejection dans user-service";
  console.error(errorMessage, reason);

  if (isGlitchTipEnabled) {
    Sentry.captureException(
      reason instanceof Error ? reason : new Error(String(reason))
    );
  }
});

process.on("uncaughtException", (error) => {
  const errorMessage = "💥 Uncaught Exception dans user-service";
  console.error(errorMessage, error);

  if (isGlitchTipEnabled) {
    Sentry.captureException(error);
  }
});

// Gestion graceful shutdown pour GlitchTip
const gracefulShutdown = (signal) => {
  console.log(`🚦 User-service arrêt via ${signal}`);

  if (isGlitchTipEnabled) {
    Sentry.captureMessage(`User-service terminé via ${signal}`, "info");
    // Attendre que GlitchTip envoie les données
    return Sentry.close(2000);
  }

  return Promise.resolve();
};

process.on("SIGTERM", () => {
  gracefulShutdown("SIGTERM").then(() => process.exit(0));
});

process.on("SIGINT", () => {
  gracefulShutdown("SIGINT").then(() => process.exit(0));
});

// Middleware Fastify pour le logging automatique
const createFastifyLogger = () => {
  return {
    onRequest: async (request, reply) => {
      request.startTime = Date.now();

      // Ajouter le contexte utilisateur si JWT présent
      if (request.headers.authorization) {
        try {
          const payload = request.server.jwt.decode(
            request.headers.authorization.replace("Bearer ", "")
          );
          if (payload.userId) {
            request.logContext = {
              userId: payload.userId,
              endpoint: `${request.method} ${request.url}`,
            };
          }
        } catch (e) {
          // Ignorer les erreurs de décodage JWT ici
        }
      }
    },

    onResponse: async (request, reply) => {
      const duration = Date.now() - request.startTime;
      const context = request.logContext || {};

      const logData = {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        duration: `${duration}ms`,
        ip: request.ip,
        userAgent: request.headers["user-agent"],
      };

      if (reply.statusCode >= 400) {
        logger.warn(
          `Requête échouée: ${request.method} ${request.url}`,
          logData,
          {
            ...context,
            action: "request_failed",
          }
        );
      } else {
        logger.api(
          `Requête traitée: ${request.method} ${request.url}`,
          logData,
          context
        );
      }
    },
  };
};

module.exports = {
  logger,
  setUserContext,
  setTags,
  createFastifyLogger,
};
