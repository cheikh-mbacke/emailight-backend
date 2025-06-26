// ============================================================================
// 📁 src/server.js - Serveur HTTP principal
// ============================================================================

const createApp = require("./app");
const {
  connectDB,
  disconnectDB,
  setLogger: setDbLogger,
} = require("./config/database");
const config = require("./config/env");
const { logger } = require("./utils/logger");

/**
 * 🚀 Démarrer le serveur
 */
const startServer = async () => {
  let app;

  try {
    // ✅ Injecter le logger dans tous les modules de config
    setDbLogger(logger);
    if (config.setLogger) {
      config.setLogger(logger);
      config.revalidateWithLogger(); // Re-valider avec le bon logger
    }

    logger.info("Démarrage du service utilisateur...", {
      environment: config.NODE_ENV,
      port: config.PORT,
      nodeVersion: process.version,
      pid: process.pid,
    });

    // 🗃️ Connexion à la base de données
    await connectDB();

    // 🚀 Création de l'application Fastify
    logger.info("Configuration de Fastify...");
    app = await createApp();

    // 🎧 Démarrage du serveur HTTP
    logger.info("Démarrage du serveur HTTP...");
    await app.listen({
      port: config.PORT,
      host: config.HOST,
    });

    logger.success(
      "Service utilisateur démarré avec succès!",
      {
        url: `http://${config.HOST}:${config.PORT}`,
        healthEndpoint: `http://${config.HOST}:${config.PORT}/health`,
        environment: config.NODE_ENV,
        pid: process.pid,
        nodeVersion: process.version,
      },
      {
        action: "service_started",
      }
    );

    if (config.NODE_ENV === "development") {
      logger.debug("Endpoints de développement disponibles", {
        info: `http://${config.HOST}:${config.PORT}/info`,
        endpoints: [
          "POST /auth/register",
          "POST /auth/login",
          "GET  /auth/me",
          "GET  /users/me",
          "PATCH /users/me",
          "GET  /preferences",
          "PATCH /preferences",
        ],
      });
    }

    return app;
  } catch (error) {
    logger.error("Erreur lors du démarrage du serveur", error, {
      action: "service_startup_failed",
      environment: config.NODE_ENV,
    });

    // Nettoyage en cas d'erreur
    if (app) {
      try {
        await app.close();
      } catch (closeError) {
        logger.error("Erreur lors de la fermeture de Fastify", closeError);
      }
    }

    await disconnectDB();
    process.exit(1);
  }
};

/**
 * 🛑 Arrêt propre du serveur
 */
const gracefulShutdown = async (signal, app) => {
  logger.info(
    `Signal ${signal} reçu, arrêt en cours...`,
    {
      signal,
      pid: process.pid,
      uptime: process.uptime(),
    },
    {
      action: "graceful_shutdown_start",
    }
  );

  const shutdownTimeout = setTimeout(() => {
    logger.error(
      "Timeout lors de l'arrêt gracieux, forçage de la fermeture",
      null,
      {
        action: "graceful_shutdown_timeout",
      }
    );
    process.exit(1);
  }, 10000); // 10 secondes max pour l'arrêt

  try {
    // Arrêter d'accepter de nouvelles connexions
    if (app) {
      logger.info("Fermeture du serveur HTTP...");
      await app.close();
      logger.success("Serveur HTTP fermé");
    }

    // Fermer la connexion à la base de données
    logger.info("Fermeture de la connexion MongoDB...");
    await disconnectDB();

    clearTimeout(shutdownTimeout);

    logger.success(
      "Arrêt propre terminé",
      {
        signal,
        totalUptime: process.uptime(),
      },
      {
        action: "graceful_shutdown_complete",
      }
    );

    process.exit(0);
  } catch (error) {
    clearTimeout(shutdownTimeout);
    logger.error("Erreur lors de l'arrêt", error, {
      action: "graceful_shutdown_error",
      signal,
    });
    process.exit(1);
  }
};

/**
 * 🎭 Gestionnaires de signaux système
 */
const setupSignalHandlers = (app) => {
  // SIGTERM (terminaison propre - Docker, PM2, etc.)
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM", app));

  // SIGINT (Ctrl+C)
  process.on("SIGINT", () => gracefulShutdown("SIGINT", app));

  // Note: Les erreurs non capturées sont déjà gérées par le logger
  // Mais on peut ajouter des logs spécifiques au service
  process.on("uncaughtException", (error) => {
    logger.error("Exception non capturée dans user-service", error, {
      action: "uncaught_exception",
      pid: process.pid,
    });
    gracefulShutdown("uncaughtException", app);
  });

  process.on("unhandledRejection", (reason, promise) => {
    logger.error(
      "Promesse rejetée non gérée dans user-service",
      {
        reason: reason instanceof Error ? reason : new Error(String(reason)),
        promise: promise.toString(),
      },
      {
        action: "unhandled_rejection",
        pid: process.pid,
      }
    );
    gracefulShutdown("unhandledRejection", app);
  });
};

/**
 * 🎬 Point d'entrée principal
 */
const main = async () => {
  try {
    const app = await startServer();
    setupSignalHandlers(app);

    // Log de démarrage réussi après configuration complète
    logger.success(
      "User-service opérationnel",
      {
        environment: config.NODE_ENV,
        port: config.PORT,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
      },
      {
        action: "service_ready",
      }
    );
  } catch (error) {
    logger.error("Échec du démarrage du user-service", error, {
      action: "service_startup_failed",
    });
    process.exit(1);
  }
};

// Démarrer le serveur si ce fichier est exécuté directement
if (require.main === module) {
  main();
}

module.exports = { startServer, gracefulShutdown };
