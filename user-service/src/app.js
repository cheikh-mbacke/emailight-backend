// ============================================================================
// 📁 src/app.js - Configuration principale de l'application Fastify
// ============================================================================

import mongoose from "mongoose";
import config from "./config/env.js";

// Import des plugins et middlewares
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import jwt from "@fastify/jwt";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import sensible from "@fastify/sensible";

// Import des routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import preferencesRoutes from "./routes/preferences.js";

// Import des services et middlewares
import AuthController from "./controllers/authController.js";
import UserController from "./controllers/userController.js";
import PreferencesController from "./controllers/preferencesController.js";
import AuthService from "./services/authService.js";
import UserService from "./services/userService.js";
import PreferencesService from "./services/preferencesService.js";
import { setLogger as setAuthMiddlewareLogger } from "./middleware/auth.js";
import { setLogger as setValidationMiddlewareLogger } from "./middleware/validation.js";

/**
 * 🏗️ Configure l'application Fastify principale
 */
export async function createApp(fastify, options = {}) {
  const { logger, config: appConfig = config } = options;

  try {
    // ============================================================================
    // 🔧 INJECTION DU LOGGER DANS TOUS LES MODULES
    // ============================================================================
    appConfig.setLogger(logger);
    AuthController.setLogger(logger);
    UserController.setLogger(logger);
    PreferencesController.setLogger(logger);
    AuthService.setLogger(logger);
    UserService.setLogger(logger);
    PreferencesService.setLogger(logger);
    setAuthMiddlewareLogger(logger);
    setValidationMiddlewareLogger(logger);

    logger.info("Logger injecté dans tous les modules", {
      modules: ["config", "controllers", "services", "middleware"],
    });

    // ============================================================================
    // 🛡️ SÉCURITÉ ET PLUGINS DE BASE
    // ============================================================================

    // Helmet pour la sécurité des en-têtes HTTP (adapté pour Swagger UI)
    await fastify.register(helmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https:"],
          scriptSrc: ["'self'", "'unsafe-eval'"], // Nécessaire pour Swagger UI
          imgSrc: ["'self'", "data:", "https:", "validator.swagger.io"],
          fontSrc: ["'self'", "https:", "data:"],
          connectSrc: ["'self'"],
        },
      },
    });

    // Plugin sensible pour des utilitaires pratiques
    await fastify.register(sensible);

    // Configuration CORS
    await fastify.register(cors, {
      origin: (origin, callback) => {
        // En développement, autoriser toutes les origins
        if (appConfig.NODE_ENV === "development") {
          callback(null, true);
          return;
        }

        // En production, autoriser seulement certaines origins
        const allowedOrigins = [
          "https://app.emailight.com",
          "https://emailight.com",
          // Ajouter d'autres domaines autorisés ici
        ];

        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Non autorisé par CORS"), false);
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    });

    // Limitation du débit des requêtes
    await fastify.register(rateLimit, {
      max: appConfig.RATE_LIMIT_MAX,
      timeWindow: appConfig.RATE_LIMIT_WINDOW,
      errorResponseBuilder: () => ({
        success: false,
        error: "Trop de requêtes",
        message: "Veuillez patienter avant de refaire une requête",
        retryAfter: Math.ceil(appConfig.RATE_LIMIT_WINDOW / 1000),
        timestamp: new Date().toISOString(),
      }),
    });

    // ============================================================================
    // 🔐 CONFIGURATION JWT
    // ============================================================================
    await fastify.register(jwt, {
      secret: appConfig.JWT_SECRET,
      sign: {
        expiresIn: appConfig.JWT_EXPIRES_IN,
      },
      verify: {
        maxAge: appConfig.JWT_EXPIRES_IN,
      },
    });

    // ============================================================================
    // 📊 DOCUMENTATION SWAGGER/OPENAPI 3.0 - VERSION MODERNE
    // ============================================================================
    if (appConfig.NODE_ENV !== "production") {
      await fastify.register(swagger, {
        openapi: {
          openapi: "3.0.3",
          info: {
            title: "Emailight User Service API",
            description:
              "API de gestion des utilisateurs pour Emailight - Service moderne avec authentification JWT",
            version: "1.0.0",
            contact: {
              name: "Équipe Emailight",
              email: "dev@emailight.com",
            },
            license: {
              name: "MIT",
              url: "https://opensource.org/licenses/MIT",
            },
          },
          servers: [
            {
              url: `http://${appConfig.HOST}:${appConfig.PORT}`,
              description: "Serveur de développement",
            },
            {
              url: "https://api.emailight.com",
              description: "Serveur de production",
            },
          ],
          components: {
            securitySchemes: {
              bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
                description: "Token JWT obtenu via /api/v1/auth/login",
              },
            },
            schemas: {
              Error: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  error: { type: "string" },
                  message: { type: "string" },
                  code: { type: "string", nullable: true },
                  timestamp: { type: "string", format: "date-time" },
                },
                required: ["success", "error", "message", "timestamp"],
              },
              Success: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: { type: "object" },
                  message: { type: "string" },
                  timestamp: { type: "string", format: "date-time" },
                },
                required: ["success", "data", "message", "timestamp"],
              },
              User: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  email: { type: "string", format: "email" },
                  firstName: { type: "string" },
                  lastName: { type: "string" },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
          security: [
            {
              bearerAuth: [],
            },
          ],
          tags: [
            {
              name: "Authentication",
              description: "Endpoints d'authentification et gestion des tokens",
            },
            {
              name: "Users",
              description: "Gestion des profils utilisateurs",
            },
            {
              name: "Preferences",
              description: "Configuration des préférences utilisateur",
            },
            {
              name: "Health",
              description: "Vérifications de santé et monitoring",
            },
          ],
          externalDocs: {
            description: "Documentation complète",
            url: "https://docs.emailight.com",
          },
        },
        stripBasePath: true,
        exposeHeadRoutes: false,
        hideUntagged: true,
        hiddenTag: "X-HIDDEN",
      });

      await fastify.register(swaggerUi, {
        routePrefix: "/docs",
        uiConfig: {
          docExpansion: "list",
          deepLinking: false,
          displayOperationId: false,
          defaultModelsExpandDepth: 1,
          defaultModelExpandDepth: 1,
          defaultModelRendering: "example",
          displayRequestDuration: true,
          tryItOutEnabled: true,
          filter: true,
          showExtensions: true,
          showCommonExtensions: true,
        },
        uiHooks: {
          onRequest: function (request, reply, next) {
            logger.debug("Accès à la documentation Swagger", {
              ip: request.ip,
              userAgent: request.headers["user-agent"],
            });
            next();
          },
          preHandler: function (request, reply, next) {
            next();
          },
        },
        staticCSP: true,
        transformStaticCSP: (header) => header,
        theme: {
          title: "Emailight API Documentation",
          css: [
            {
              filename: "theme.css",
              content: `
                .swagger-ui .topbar {
                  background-color: #1a1a1a;
                  padding: 10px 0;
                }
                .swagger-ui .topbar .download-url-wrapper {
                  display: none;
                }
                .swagger-ui .info .title {
                  color: #3b82f6;
                }
                .swagger-ui .scheme-container {
                  background: #f8f9fa;
                  padding: 10px;
                  border-radius: 4px;
                }
              `,
            },
          ],
        },
      });

      logger.info("Documentation Swagger UI configurée", {
        url: `http://${appConfig.HOST}:${appConfig.PORT}/docs`,
        openapi_version: "3.0.3",
      });
    }

    // ============================================================================
    // 🗄️ CONNEXION À LA BASE DE DONNÉES
    // ============================================================================
    await connectToDatabase(logger, appConfig);

    // ============================================================================
    // 🎨 DÉCORATEURS FASTIFY PERSONNALISÉS
    // ============================================================================

    // Décorateur pour les réponses de succès standardisées
    fastify.decorateReply("success", function (data, message = "Succès") {
      return this.send({
        success: true,
        data,
        message,
        timestamp: new Date().toISOString(),
      });
    });

    // Décorateur pour les réponses d'erreur standardisées
    fastify.decorateReply("error", function (message, code = null) {
      return this.send({
        success: false,
        error: message,
        code,
        message:
          typeof message === "string" ? message : "Une erreur est survenue",
        timestamp: new Date().toISOString(),
      });
    });

    // ============================================================================
    // 🔍 ROUTE DE SANTÉ AVEC SCHÉMA OPENAPI MODERNE
    // ============================================================================
    fastify.get(
      "/health",
      {
        schema: {
          tags: ["Health"],
          summary: "Vérification de santé du service",
          description:
            "Endpoint pour vérifier l'état de santé du service et de ses dépendances",
          security: [], // Pas d'authentification requise
          response: {
            200: {
              description: "Service en bonne santé",
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                data: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                      enum: ["healthy", "unhealthy"],
                      example: "healthy",
                    },
                    service: {
                      type: "string",
                      example: "user-service",
                    },
                    version: {
                      type: "string",
                      example: "1.0.0",
                    },
                    environment: {
                      type: "string",
                      enum: ["development", "staging", "production"],
                      example: "development",
                    },
                    database: {
                      type: "object",
                      properties: {
                        status: {
                          type: "string",
                          enum: ["connected", "disconnected"],
                          example: "connected",
                        },
                        name: {
                          type: "string",
                          example: "MongoDB",
                        },
                      },
                    },
                    config: {
                      type: "object",
                      description:
                        "Résumé de la configuration (sans données sensibles)",
                    },
                  },
                  required: ["status", "service", "version"],
                },
                message: {
                  type: "string",
                  example: "Service opérationnel",
                },
                timestamp: {
                  type: "string",
                  format: "date-time",
                },
              },
              required: ["success", "data", "message", "timestamp"],
            },
            503: {
              description: "Service indisponible",
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                error: { type: "string", example: "Service indisponible" },
                message: { type: "string" },
                code: { type: "string", nullable: true },
                timestamp: { type: "string", format: "date-time" },
              },
              required: ["success", "error", "message", "timestamp"],
            },
          },
        },
      },
      async (request, reply) => {
        try {
          const dbStatus =
            mongoose.connection.readyState === 1 ? "connected" : "disconnected";

          return reply.success(
            {
              status: "healthy",
              service: "user-service",
              version: "1.0.0",
              environment: appConfig.NODE_ENV,
              database: {
                status: dbStatus,
                name: "MongoDB",
              },
              config: appConfig.getConfigSummary(),
            },
            "Service opérationnel"
          );
        } catch (error) {
          logger.error("Erreur lors de la vérification de santé", error);
          return reply.code(503).error("Service indisponible");
        }
      }
    );

    // ============================================================================
    // 📍 ENREGISTREMENT DES ROUTES
    // ============================================================================

    // Routes d'authentification
    await fastify.register(authRoutes, { prefix: "/api/v1/auth" });

    // Routes des utilisateurs
    await fastify.register(userRoutes, { prefix: "/api/v1/users" });

    // Routes des préférences
    await fastify.register(preferencesRoutes, {
      prefix: "/api/v1/preferences",
    });

    // ============================================================================
    // 🚨 GESTIONNAIRE D'ERREURS GLOBAL AVEC SUPPORT OPENAPI
    // ============================================================================
    fastify.setErrorHandler(async (error, request, reply) => {
      // Log de l'erreur
      logger.error("Erreur non gérée", error, {
        method: request.method,
        url: request.url,
        statusCode: error.statusCode || 500,
        action: "unhandled_error",
      });

      // Réponses standardisées selon les schémas OpenAPI

      // Gestion des erreurs opérationnelles
      if (error.isOperational) {
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message,
          code: error.code,
          message: error.userMessage || error.message,
          timestamp: new Date().toISOString(),
        });
      }

      // Gestion des erreurs de validation Joi/Fastify
      if (error.validation) {
        return reply.code(400).send({
          success: false,
          error: "Données invalides",
          message: "Les données fournies ne respectent pas le format attendu",
          details: error.validation,
          timestamp: new Date().toISOString(),
        });
      }

      // Gestion des erreurs JWT
      if (error.code && error.code.startsWith("FST_JWT_")) {
        return reply.code(401).send({
          success: false,
          error: "Erreur d'authentification",
          message: "Token invalide ou expiré",
          code: error.code,
          timestamp: new Date().toISOString(),
        });
      }

      // Gestion des erreurs de taux limite
      if (error.statusCode === 429) {
        return reply.code(429).send({
          success: false,
          error: "Trop de requêtes",
          message: "Veuillez patienter avant de refaire une requête",
          retryAfter: error.retryAfter,
          timestamp: new Date().toISOString(),
        });
      }

      // Erreur générique
      const isProduction = appConfig.NODE_ENV === "production";
      return reply.code(500).send({
        success: false,
        error: "Erreur interne du serveur",
        message: "Une erreur inattendue s'est produite",
        timestamp: new Date().toISOString(),
        ...(!isProduction && {
          details: error.message,
          stack: error.stack,
        }),
      });
    });

    // ============================================================================
    // 🎯 GESTIONNAIRE 404 AMÉLIORÉ
    // ============================================================================
    fastify.setNotFoundHandler(async (request, reply) => {
      logger.warn("Route non trouvée", {
        method: request.method,
        url: request.url,
        ip: request.ip,
        userAgent: request.headers["user-agent"],
      });

      return reply.code(404).send({
        success: false,
        error: "Route non trouvée",
        message: `${request.method} ${request.url} n'existe pas`,
        timestamp: new Date().toISOString(),
        availableRoutes: [
          "GET /health",
          ...(appConfig.NODE_ENV !== "production" ? ["GET /docs"] : []),
          "POST /api/v1/auth/register",
          "POST /api/v1/auth/login",
          "GET /api/v1/users/me",
          "GET /api/v1/preferences",
        ],
      });
    });

    logger.success("Application Fastify configurée avec succès", {
      routes: [
        "/health",
        ...(appConfig.NODE_ENV !== "production" ? ["/docs"] : []),
        "/api/v1/auth/*",
        "/api/v1/users/*",
        "/api/v1/preferences/*",
      ],
      plugins: ["cors", "helmet", "rateLimit", "jwt", "swagger", "swaggerUi"],
      environment: appConfig.NODE_ENV,
      openapi_version: "3.0.3",
    });
  } catch (error) {
    logger.error("Erreur lors de la configuration de l'application", error);
    throw error;
  }
}

/**
 * 🗄️ Connexion à la base de données MongoDB
 */
async function connectToDatabase(logger, appConfig) {
  try {
    logger.info("Connexion à MongoDB...", {
      uri: appConfig.MONGODB_URI.replace(/\/\/.*@/, "//***:***@"),
    });

    await mongoose.connect(appConfig.MONGODB_URI, {
      // Options de connexion modernes
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // Utiliser IPv4
    });

    // Événements de connexion
    mongoose.connection.on("connected", () => {
      logger.success("Connexion MongoDB établie", {
        database: mongoose.connection.db.databaseName,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
      });
    });

    mongoose.connection.on("error", (error) => {
      logger.error("Erreur MongoDB", error);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("Connexion MongoDB interrompue");
    });

    // Gestion propre de l'arrêt
    process.on("SIGINT", async () => {
      try {
        await mongoose.connection.close();
        logger.info("Connexion MongoDB fermée proprement");
      } catch (error) {
        logger.error("Erreur lors de la fermeture de MongoDB", error);
      }
    });
  } catch (error) {
    logger.error("Impossible de se connecter à MongoDB", error, {
      uri: appConfig.MONGODB_URI.replace(/\/\/.*@/, "//***:***@"),
    });
    throw error;
  }
}
