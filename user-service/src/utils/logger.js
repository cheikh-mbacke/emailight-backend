const Sentry = require("@sentry/node");
const dotenv = require("dotenv");
dotenv.config();

const isSentryEnabled = Boolean(process.env.GLITCHTIP_DSN);
const isVerbose =
  process.env.VERBOSE_LOGS === "true" || process.env.NODE_ENV === "development";

  console.log(
    "🔍 [Sentry Debug] process.env.GLITCHTIP_DSN =",
    process.env.GLITCHTIP_DSN
  );


// Sentry init
if (isSentryEnabled) {
  try {
    Sentry.init({
      dsn: process.env.GLITCHTIP_DSN,
      debug: process.env.NODE_ENV === "development",
      environment: process.env.NODE_ENV,
      tracesSampleRate: parseFloat(
        process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1"
      ),
    });
  } catch (error) {
    console.error("❌ Error initializing Sentry:", error);
  }
} else {
  console.warn("⚠️ Sentry is disabled because GLITCHTIP_DSN is not provided.");
}

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

const getTimestamp = () => {
  return new Date().toLocaleString(process.env.LOCALE || "fr-FR", {
    timeZone: process.env.TIMEZONE || "Europe/Paris",
    hour12: false,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const setUserContext = (userId, email) => {
  if (isSentryEnabled) {
    Sentry.setUser({ id: userId, email });
  }
};

const setTags = (tags) => {
  if (isSentryEnabled) {
    Sentry.setTags(tags);
  }
};

const logger = {
  info: (message, data = "", context = {}) => {
    console.log(`[${getTimestamp()}] ${LOG_LEVELS.INFO} ${message}`, data);
  },
  success: (message, data = "", context = {}) => {
    console.log(`[${getTimestamp()}] ${LOG_LEVELS.SUCCESS} ${message}`, data);
  },
  warn: (message, data = "", context = {}) => {
    console.warn(`[${getTimestamp()}] ${LOG_LEVELS.WARNING} ${message}`, data);
    if (isSentryEnabled) {
      if (context.userId) setUserContext(context.userId, context.email);
      Sentry.captureMessage(`[WARN] ${message}`, "warning");
    }
  },
  debug: (message, data = "", context = {}) => {
    if (isVerbose) {
      console.log(`[${getTimestamp()}] ${LOG_LEVELS.DEBUG} ${message}`, data);
    }
  },
  error: (message, error = "", context = {}) => {
    console.error(`[${getTimestamp()}] ${LOG_LEVELS.ERROR} ${message}`, error);
    if (isSentryEnabled) {
      if (context.userId) setUserContext(context.userId, context.email);
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
  auth: (message, data = "", context = {}) => {
    console.log(
      `[${getTimestamp()}] ${LOG_LEVELS.AUTH} [AUTH] ${message}`,
      data
    );
    if (isSentryEnabled) {
      Sentry.addBreadcrumb({
        message,
        level: "info",
        category: "auth",
        data: typeof data === "object" ? data : { auth: data },
      });
    }
  },
  db: (message, data = "", context = {}) => {
    console.log(
      `[${getTimestamp()}] ${LOG_LEVELS.DB} [DATABASE] ${message}`,
      data
    );
    if (isSentryEnabled) {
      Sentry.addBreadcrumb({
        message,
        level: "info",
        category: "database",
        data: typeof data === "object" ? data : { db: data },
      });
    }
  },
  api: (message, data = "", context = {}) => {
    console.log(`[${getTimestamp()}] ${LOG_LEVELS.API} [API] ${message}`, data);
    if (isSentryEnabled) {
      Sentry.addBreadcrumb({
        message,
        level: "info",
        category: "api",
        data: typeof data === "object" ? data : { api: data },
      });
    }
  },
  user: (message, data = "", context = {}) => {
    console.log(
      `[${getTimestamp()}] ${LOG_LEVELS.USER} [USER] ${message}`,
      data
    );
    if (isSentryEnabled && context.userId) {
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

function createFastifyLogger() {
  return {
    onRequest: (request, reply, done) => {
      logger.info(`[REQUEST] ${request.method} ${request.url}`, {
        params: request.params,
        query: request.query,
        body: request.body,
      });
      done();
    },
    onResponse: (request, reply, done) => {
      logger.info(
        `[RESPONSE] ${request.method} ${request.url} -> ${reply.statusCode}`
      );
      done();
    },
  };
}

module.exports = { logger, setUserContext, setTags, createFastifyLogger };

