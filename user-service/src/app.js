const fastify = require("fastify");
const config = require("./config/env");
const { logger, createFastifyLogger } = require("./utils/logger");

/**
 * 🚀 Créer et configurer l'instance Fastify
 */
const createApp = async () => {
  // Configuration Fastify
  const app = fastify({
    logger: false, // Désactiver le logger intégré, on utilise le nôtre
    trustProxy: true,
    disableRequestLogging: true, // On gère nous-mêmes le logging
  });

  // ============================================================================
  // 🔌 PLUGINS FASTIFY
  // ============================================================================

  // 🛡️ Helmet - Sécurité HTTP headers
  await app.register(require("@fastify/helmet"), {
    crossOriginEmbedderPolicy: false, // Pour éviter les problèmes de CORS
    contentSecurityPolicy: false, // Désactivé pour l'API
  });

  // 🌐 CORS - Cross-Origin Resource Sharing
  await app.register(require("@fastify/cors"), {
    origin: (origin, callback) => {
      // En développement, autoriser localhost
      if (config.NODE_ENV === "development") {
        const allowedOrigins = [
          "http://localhost:3000",
          "http://localhost:3001",
          "http://localhost:8080",
          "http://127.0.0.1:3000",
        ];

        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("CORS non autorisé"), false);
        }
      } else {
        // En production, configurer selon vos domaines
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("CORS non autorisé"), false);
        }
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  // 🔐 JWT - Authentification
  await app.register(require("@fastify/jwt"), {
    secret: config.JWT_SECRET,
    sign: {
      expiresIn: config.JWT_EXPIRES_IN,
    },
    verify: {
      extractToken: (request) => {
        // Extraire le token du header Authorization
        const authHeader = request.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
          return authHeader.substring(7);
        }
        return null;
      },
    },
  });

  // 🚦 Rate Limiting
  await app.register(require("@fastify/rate-limit"), {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW,
    skipOnError: true, // Ne pas bloquer en cas d'erreur Redis
    keyGenerator: (request) => {
      // Utiliser l'ID utilisateur si authentifié, sinon l'IP
      return request.user?.id || request.ip;
    },
    errorResponseBuilder: (request, context) => {
      return {
        error: "Trop de requêtes",
        message: `Maximum ${context.max} requêtes par ${Math.floor(context.timeWindow / 1000)} secondes`,
        retryAfter: Math.round(context.timeWindow / 1000),
      };
    },
  });

  // ============================================================================
  // 🎯 ROUTES
  // ============================================================================

  // 🏥 Route de santé
  app.get("/health", async (request, reply) => {
    const { healthCheck } = require("./config/database");
    const dbHealth = await healthCheck();

    return {
      status: "ok",
      service: "user-service",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbHealth,
      environment: config.NODE_ENV,
    };
  });

  // 📊 Route d'informations (développement uniquement)
  if (config.NODE_ENV === "development") {
    app.get("/info", async (request, reply) => {
      return {
        service: "emailight-user-service",
        version: "1.0.0",
        environment: config.NODE_ENV,
        node_version: process.version,
        memory_usage: process.memoryUsage(),
        uptime: process.uptime(),
        configuration: config.getConfigSummary
          ? config.getConfigSummary()
          : {
              jwt_configured: !!config.JWT_SECRET,
              database_uri: config.MONGODB_URI.replace(/\/\/.*@/, "//***:***@"),
              port: config.PORT,
            },
      };
    });
  }

  // 🔐 Routes d'authentification
  await app.register(require("./routes/auth"), { prefix: "/auth" });

  // 👤 Routes utilisateur
  await app.register(require("./routes/users"), { prefix: "/users" });

  // ⚙️ Routes de préférences
  await app.register(require("./routes/preferences"), {
    prefix: "/preferences",
  });

  // ============================================================================
  // 🎪 HOOKS ET MIDDLEWARE GLOBAUX
  // ============================================================================

  // 📝 Hook de logging personnalisé
  const fastifyLogger = createFastifyLogger();
  app.addHook("onRequest", fastifyLogger.onRequest);
  app.addHook("onResponse", fastifyLogger.onResponse);

  // 🚨 Gestionnaire d'erreurs global
  app.setErrorHandler(async (error, request, reply) => {
    const context = request.logContext || {};

    // Log de l'erreur avec contexte
    logger.error(
      "Erreur non gérée dans Fastify",
      {
        error: error.message,
        stack: error.stack,
        method: request.method,
        url: request.url,
        statusCode: error.statusCode,
      },
      {
        ...context,
        action: "unhandled_error",
        endpoint: `${request.method} ${request.url}`,
      }
    );

    // Erreurs de validation Joi
    if (error.validation) {
      return reply.code(400).send({
        error: "Données invalides",
        message: "Les données fournies ne respectent pas le format attendu",
        details: error.validation,
      });
    }

    // Erreurs MongoDB
    if (error.name === "MongoError" || error.name === "ValidationError") {
      if (error.code === 11000) {
        logger.warn(
          "Tentative de création d'un doublon",
          { error: error.message },
          context
        );
        return reply.code(409).send({
          error: "Conflit de données",
          message: "Un utilisateur avec cet email existe déjà",
        });
      }

      logger.error("Erreur MongoDB", { error: error.message }, context);
      return reply.code(400).send({
        error: "Erreur de base de données",
        message:
          config.NODE_ENV === "development"
            ? error.message
            : "Données invalides",
      });
    }

    // Erreurs JWT (déjà gérées par le middleware auth)
    if (error.code && error.code.startsWith("FST_JWT_")) {
      return reply.code(401).send({
        error: "Authentification échouée",
        message: "Token invalide ou expiré",
      });
    }

    // Erreur générique
    const statusCode = error.statusCode || 500;

    return reply.code(statusCode).send({
      error: statusCode === 500 ? "Erreur serveur" : error.message,
      message:
        config.NODE_ENV === "development"
          ? error.message
          : "Une erreur interne est survenue",
      ...(config.NODE_ENV === "development" && { stack: error.stack }),
    });
  });

  // 🔍 Handler pour les routes non trouvées
  app.setNotFoundHandler(async (request, reply) => {
    return reply.code(404).send({
      error: "Route non trouvée",
      message: `La route ${request.method} ${request.url} n'existe pas`,
      availableRoutes: [
        "GET /health",
        "POST /auth/register",
        "POST /auth/login",
        "GET /auth/me",
        "PATCH /auth/me",
        "DELETE /auth/me",
        "GET /users/me",
        "PATCH /users/me",
        "GET /preferences",
        "PATCH /preferences",
      ],
    });
  });

  // ============================================================================
  // 🎭 DECORATORS FASTIFY
  // ============================================================================

  // Décorateur pour les réponses de succès standardisées
  app.decorateReply("success", function (data, message = "Succès") {
    return this.send({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  });

  // Décorateur pour les réponses d'erreur standardisées
  app.decorateReply(
    "error",
    function (message, statusCode = 500, details = null) {
      return this.code(statusCode).send({
        success: false,
        error: message,
        details,
        timestamp: new Date().toISOString(),
      });
    }
  );

  // Décorateur pour vérifier les permissions
  app.decorateRequest("hasPermission", function (permission) {
    return (
      this.user &&
      this.user.permissions &&
      this.user.permissions.includes(permission)
    );
  });

  return app;
};

module.exports = createApp;
