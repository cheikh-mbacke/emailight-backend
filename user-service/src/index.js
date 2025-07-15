// ============================================================================
// 📁 src/index.js - Point d'entrée principal du service utilisateur
// ============================================================================

import { createServer } from "./server.js";
import config from "./config/env.js";

// Logger de base avant l'injection du logger externe
const baseLogger = {
  info: (msg, data) => {
    if (typeof console !== 'undefined') {
      console.log(`📡 [INDEX] ${msg}`, data || "");
    }
  },
  error: (msg, error) => {
    if (typeof console !== 'undefined') {
      console.error(`❌ [INDEX] ${msg}`, error || "");
    }
  },
  warn: (msg, data) => {
    if (typeof console !== 'undefined') {
      console.warn(`⚠️ [INDEX] ${msg}`, data || "");
    }
  },
  success: (msg, data) => {
    if (typeof console !== 'undefined') {
      console.log(`✅ [INDEX] ${msg}`, data || "");
    }
  },
};

/**
 * 🚀 Démarre le serveur principal
 */
async function startServer() {
  try {
    baseLogger.info("Démarrage du service utilisateur", {
      environment: config.NODE_ENV,
      port: config.PORT,
      host: config.HOST,
    });

    // Créer et configurer le serveur Fastify
    const server = await createServer({
      logger: baseLogger,
      config,
    });

    // Démarrer le serveur
    await server.listen({
      port: config.PORT,
      host: config.HOST,
    });

    baseLogger.success("Service utilisateur démarré avec succès", {
      url: `http://${config.HOST}:${config.PORT}`,
      environment: config.NODE_ENV,
      pid: process.pid,
    });

    // Afficher les routes disponibles en développement
    if (config.NODE_ENV === "development") {
      baseLogger.info("Routes disponibles", {
        swagger: `http://localhost:${config.PORT}/docs`,
        healthcheck: `http://localhost:${config.PORT}/health`,
        auth: `http://localhost:${config.PORT}/api/v1/auth`,
        users: `http://localhost:${config.PORT}/api/v1/users`,
        preferences: `http://localhost:${config.PORT}/api/v1/preferences`,
      });
    }

    return server;
  } catch (error) {
    baseLogger.error("Erreur fatale lors du démarrage", error);
    process.exit(1);
  }
}

/**
 * 🛑 Gestion propre de l'arrêt du serveur
 */
function setupGracefulShutdown(server) {
  const signals = ["SIGTERM", "SIGINT"];

  signals.forEach((signal) => {
    process.on(signal, async () => {
      baseLogger.info(`Signal ${signal} reçu, arrêt en cours...`);

      try {
        await server.close();
        baseLogger.success("Serveur arrêté proprement");
        process.exit(0);
      } catch (error) {
        baseLogger.error("Erreur lors de l'arrêt du serveur", error);
        process.exit(1);
      }
    });
  });

  process.on("uncaughtException", (error) => {
    baseLogger.error("Exception non capturée", error);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason, promise) => {
    baseLogger.error("Promesse rejetée non gérée", {
      reason,
      promise,
    });
    process.exit(1);
  });
}

// 🎯 Démarrage principal
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer()
    .then((server) => {
      setupGracefulShutdown(server);
    })
    .catch((error) => {
      baseLogger.error("Échec du démarrage", error);
      process.exit(1);
    });
}

export { startServer };
