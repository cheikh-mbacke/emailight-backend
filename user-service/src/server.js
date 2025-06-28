// ============================================================================
// 📁 src/server.js - Configuration et création du serveur Fastify
// ============================================================================

import Fastify from "fastify";
import config from "./config/env.js";
import { createApp } from "./app.js";

/**
 * 🏗️ Crée et configure une instance du serveur Fastify
 */
export async function createServer(options = {}) {
  const { logger = console, config: serverConfig = config } = options;

  try {
    // Configuration de base de Fastify
    const fastifyOptions = {
      logger: {
        level: serverConfig.LOG_LEVEL || "info",
        // En production, utiliser un format JSON pour les logs
        ...(serverConfig.NODE_ENV === "production" && {
          transport: {
            target: "pino-pretty",
            options: {
              translateTime: "HH:MM:ss Z",
              ignore: "pid,hostname",
            },
          },
        }),
      },
      // Configuration des CORS et sécurité
      trustProxy: true,
      disableRequestLogging: serverConfig.NODE_ENV === "production",
      ignoreTrailingSlash: true,
      ignoreDuplicateSlashes: true,
      // Limite de taille pour les payloads
      bodyLimit: 1048576, // 1MB
    };

    // Créer l'instance Fastify
    const server = Fastify(fastifyOptions);

    // Logger personnalisé injecté
    let appLogger = logger;

    // Si un logger Fastify est disponible, l'utiliser
    if (server.log && typeof server.log.info === "function") {
      appLogger = {
        info: (msg, data, context) =>
          server.log.info({ data, context }, `📡 ${msg}`),
        warn: (msg, data, context) =>
          server.log.warn({ data, context }, `⚠️ ${msg}`),
        error: (msg, error, context) =>
          server.log.error({ error, context }, `❌ ${msg}`),
        success: (msg, data, context) =>
          server.log.info({ data, context }, `✅ ${msg}`),
        auth: (msg, data, context) =>
          server.log.info({ data, context }, `🔐 ${msg}`),
        user: (msg, data, context) =>
          server.log.info({ data, context }, `👤 ${msg}`),
        debug: (msg, data, context) =>
          server.log.debug({ data, context }, `🔍 ${msg}`),
      };
    }

    // Configurer l'application avec le logger injecté
    await createApp(server, {
      logger: appLogger,
      config: serverConfig,
    });

    logger.success("Serveur Fastify configuré avec succès", {
      environment: serverConfig.NODE_ENV,
      port: serverConfig.PORT,
      loggingEnabled: serverConfig.ENABLE_LOGGING,
    });

    return server;
  } catch (error) {
    logger.error("Erreur lors de la création du serveur", error);
    throw error;
  }
}

/**
 * 🧪 Fonction utilitaire pour créer un serveur de test
 */
export async function createTestServer(overrides = {}) {
  const testConfig = {
    ...config,
    NODE_ENV: "test",
    ENABLE_LOGGING: false,
    LOG_LEVEL: "error",
    ...overrides,
  };

  const testLogger = {
    info: () => {},
    warn: () => {},
    error: console.error,
    success: () => {},
    auth: () => {},
    user: () => {},
    debug: () => {},
  };

  return createServer({
    logger: testLogger,
    config: testConfig,
  });
}
