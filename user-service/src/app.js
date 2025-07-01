// ============================================================================
// 📁 src/app.js - Configuration principale avec Google OAuth et Multipart
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
import multipart from "@fastify/multipart";

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
import GoogleAuthService from "./services/googleAuthService.js";
import FileUploadService from "./services/fileUploadService.js";
import { setLogger as setAuthMiddlewareLogger } from "./middleware/auth.js";
import { setLogger as setValidationMiddlewareLogger } from "./middleware/validation.js";
import { setLogger as setUploadValidationLogger } from "./middleware/uploadValidation.js";

// ✨ Import du service Exceptionless centralisé
import exceptionlessService from "./utils/exceptionless.js";

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
    GoogleAuthService.setLogger(logger);
    FileUploadService.setLogger(logger); // 🆕 Service de fichiers
    setAuthMiddlewareLogger(logger);
    setValidationMiddlewareLogger(logger);
    setUploadValidationLogger(logger); // 🆕 Middleware upload

    logger.info("Logger injecté dans tous les modules", {
      modules: [
        "config",
        "controllers",
        "services",
        "middleware",
        "googleAuth",
        "fileUpload", // 🆕
        "uploadValidation", // 🆕
      ],
    });

    // ============================================================================
    // 🔍 INITIALISATION GOOGLE OAUTH SERVICE
    // ============================================================================
    const googleAuthInitialized = GoogleAuthService.initialize();
    if (googleAuthInitialized) {
      logger.success("Google OAuth Service initialisé", {
        clientConfigured: !!appConfig.GOOGLE_CLIENT_ID,
      });
    } else {
      logger.warn("Google OAuth Service non disponible", {
        reason: "GOOGLE_CLIENT_ID manquant",
        impact: "Authentification Google désactivée",
      });
    }

    // ============================================================================
    // 🚨 INITIALISATION D'EXCEPTIONLESS (CENTRALISÉ)
    // ============================================================================
    await exceptionlessService.initialize(logger, appConfig);

    // ============================================================================
    // 🛡️ SÉCURITÉ ET PLUGINS DE BASE
    // ============================================================================

    // Helmet pour la sécurité des en-têtes HTTP
    await fastify.register(helmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https:"],
          scriptSrc: ["'self'", "'unsafe-eval'"],
          imgSrc: ["'self'", "data:", "https:", "validator.swagger.io"],
          fontSrc: ["'self'", "https:", "data:"],
          connectSrc: ["'self'"],
        },
      },
    });

    // Plugin sensible pour des utilitaires pratiques
    await fastify.register(sensible);

    // 🆕 Configuration Multipart pour les uploads de fichiers
    await fastify.register(multipart, {
      limits: {
        fieldNameSize: 100, // Limite du nom de champ
        fieldSize: 100, // Limite de la valeur du champ
        fields: 10, // Nombre max de champs non-fichiers
        fileSize: 5 * 1024 * 1024, // 5MB par fichier
        files: 1, // Nombre max de fichiers
        headerPairs: 2000, // Nombre max de paires header
      },
      attachFieldsToBody: false, // Ne pas attacher automatiquement
    });

    logger.success("Plugin multipart configuré", {
      maxFileSize: "5MB",
      maxFiles: 1,
      maxFields: 10,
    });

    // Configuration CORS améliorée
    await fastify.register(cors, {
      origin: (origin, callback) => {
        if (appConfig.NODE_ENV === "development") {
          // En développement, accepter toutes les origines
          callback(null, true);
          return;
        }

        const allowedOrigins = [
          "https://app.emailight.com",
          "https://emailight.com",
          // Ajout des origines locales pour développement
          "http://localhost:3001",
          "http://127.0.0.1:3001",
          "http://0.0.0.0:3001",
        ];

        // Autoriser les requêtes sans origin (Postman, curl, etc.)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          logger.warn("Origine CORS non autorisée", { origin });
          callback(new Error("Non autorisé par CORS"), false);
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Accept"],
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
    // 📊 DOCUMENTATION SWAGGER/OPENAPI 3.0
    // ============================================================================
    if (appConfig.NODE_ENV !== "production") {
      await fastify.register(swagger, {
        openapi: {
          openapi: "3.0.3",
          info: {
            title: "Emailight User Service API",
            description: "API de gestion des utilisateurs pour Emailight",
            version: "1.0.0",
            contact: {
              name: "Équipe Emailight",
              email: "dev@emailight.com",
            },
          },
          servers: [
            {
              // 🔥 CORRIGÉ: Utiliser localhost au lieu de HOST pour Swagger
              url: `http://localhost:${appConfig.PORT}`,
              description: "Serveur de développement (localhost)",
            },
            {
              url: `http://127.0.0.1:${appConfig.PORT}`,
              description: "Serveur de développement (127.0.0.1)",
            },
          ],
          components: {
            securitySchemes: {
              bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
              },
            },
          },
          tags: [
            {
              name: "Authentication",
              description: "Authentification et tokens",
            },
            { name: "Users", description: "Gestion des utilisateurs" },
            { name: "Preferences", description: "Préférences utilisateur" },
            { name: "Health", description: "Santé du service" },
          ],
        },
      });

      await fastify.register(swaggerUi, {
        routePrefix: "/docs",
        uiConfig: {
          docExpansion: "list",
          deepLinking: false,
        },
      });

      logger.info("Documentation Swagger UI configurée", {
        url: `http://localhost:${appConfig.PORT}/docs`,
      });
    }

    // ============================================================================
    // 🗄️ CONNEXION À LA BASE DE DONNÉES
    // ============================================================================
    await connectToDatabase(logger, appConfig, exceptionlessService);

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
    // 🔍 ROUTE DE SANTÉ
    // ============================================================================
    fastify.get("/health", async (request, reply) => {
      try {
        const dbStatus =
          mongoose.connection.readyState === 1 ? "connected" : "disconnected";

        // 🆕 Vérifier le statut Google OAuth
        const googleOAuthStatus = GoogleAuthService.getStatus();

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
            oauth: {
              google: googleOAuthStatus,
            },
            uploads: {
              multipart: true,
              maxFileSize: "5MB",
              supportedTypes: [
                "image/jpeg",
                "image/png",
                "image/webp",
                "image/gif",
              ],
            },
            exceptionless: exceptionlessService.getHealthStatus(),
            config: appConfig.getConfigSummary(),
          },
          "Service opérationnel"
        );
      } catch (error) {
        logger.error("Erreur lors de la vérification de santé", error);

        // L'erreur sera automatiquement capturée par le gestionnaire centralisé
        throw error;
      }
    });

    // ============================================================================
    // 🧪 ROUTE DE TEST GOOGLE OAUTH (développement uniquement)
    // ============================================================================
    if (appConfig.NODE_ENV === "development") {
      fastify.get("/test/google-oauth", async (request, reply) => {
        try {
          const testResult = await GoogleAuthService.testConfiguration();

          return reply.success(testResult, "Test Google OAuth");
        } catch (error) {
          logger.error("Erreur lors du test Google OAuth", error);

          return reply.code(500).send({
            success: false,
            error: "Erreur test Google OAuth",
            details: error.message,
          });
        }
      });

      // 🆕 Route de test pour les uploads (développement)
      fastify.get("/test/upload-config", async (request, reply) => {
        try {
          const uploadConfig = FileUploadService.getUploadConfig();

          return reply.success(uploadConfig, "Configuration upload");
        } catch (error) {
          logger.error("Erreur test configuration upload", error);

          return reply.code(500).send({
            success: false,
            error: "Erreur test upload",
            details: error.message,
          });
        }
      });
    }

    // ============================================================================
    // 📁 ROUTE STATIQUE POUR LES UPLOADS (en développement)
    // ============================================================================
    if (appConfig.NODE_ENV === "development") {
      // Servir les fichiers uploadés statiquement
      await fastify.register(import("@fastify/static"), {
        root: process.cwd(),
        prefix: "/uploads/",
        decorateReply: false,
      });

      logger.info("Service de fichiers statiques configuré", {
        prefix: "/uploads/",
        root: process.cwd(),
      });
    }

    // ============================================================================
    // 📍 ENREGISTREMENT DES ROUTES
    // ============================================================================
    await fastify.register(authRoutes, { prefix: "/api/v1/auth" });
    await fastify.register(userRoutes, { prefix: "/api/v1/users" });
    await fastify.register(preferencesRoutes, {
      prefix: "/api/v1/preferences",
    });

    // ============================================================================
    // 🚨 GESTION D'ERREURS CENTRALISÉE AVEC EXCEPTIONLESS
    // ============================================================================

    // Hook onError pour capturer les erreurs des hooks
    if (exceptionlessService.initialized) {
      fastify.addHook("onError", exceptionlessService.createErrorHook());
      logger.info("Hook onError Exceptionless configuré");
    }

    // Gestionnaire d'erreurs centralisé (remplace votre setErrorHandler actuel)
    fastify.setErrorHandler(
      exceptionlessService.createCentralizedErrorHandler()
    );

    // Gestionnaire 404 centralisé (remplace votre setNotFoundHandler actuel)
    fastify.setNotFoundHandler(exceptionlessService.createNotFoundHandler());

    logger.success("Application Fastify configurée avec succès", {
      routes: [
        "/health",
        ...(appConfig.NODE_ENV === "development"
          ? ["/docs", "/test/google-oauth", "/test/upload-config"]
          : ["/docs"]),
        "/api/v1/auth/*",
        "/api/v1/users/*",
        "/api/v1/preferences/*",
      ],
      plugins: [
        "cors",
        "helmet",
        "rateLimit",
        "jwt",
        "swagger",
        "swaggerUi",
        "multipart", // 🆕
      ],
      environment: appConfig.NODE_ENV,
      googleOAuth: googleAuthInitialized ? "✅ Activé" : "❌ Désactivé",
      fileUploads: "✅ Activé", // 🆕
      exceptionless: exceptionlessService.initialized
        ? "✅ Activé"
        : "❌ Désactivé",
      errorHandling: "✅ Centralisé",
    });
  } catch (error) {
    logger.error("Erreur lors de la configuration de l'application", error);

    // Reporter l'erreur de configuration à Exceptionless si initialisé
    if (exceptionlessService.initialized) {
      await exceptionlessService.submitError(error, {
        action: "app_configuration_error",
        critical: true,
        tags: ["startup", "configuration", "critical"],
      });
    }

    throw error;
  }
}

/**
 * 🗄️ Connexion à la base de données MongoDB avec reporting Exceptionless
 */
async function connectToDatabase(logger, appConfig, exceptionlessService) {
  try {
    logger.info("Connexion à MongoDB...", {
      uri: appConfig.MONGODB_URI.replace(/\/\/.*@/, "//***:***@"),
    });

    await mongoose.connect(appConfig.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    });

    // Événements de connexion avec reporting Exceptionless
    mongoose.connection.on("connected", () => {
      logger.success("Connexion MongoDB établie", {
        database: mongoose.connection.db.databaseName,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
      });
    });

    mongoose.connection.on("error", async (error) => {
      logger.error("Erreur MongoDB", error);

      if (exceptionlessService.initialized) {
        await exceptionlessService.submitError(error, {
          action: "database_error",
          critical: true,
          tags: ["database", "mongodb", "error"],
        });
      }
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

        if (exceptionlessService.initialized) {
          await exceptionlessService.submitError(error, {
            action: "database_shutdown_error",
            critical: true,
            tags: ["database", "mongodb", "shutdown", "error"],
          });
        }
      }
    });
  } catch (error) {
    logger.error("Impossible de se connecter à MongoDB", error, {
      uri: appConfig.MONGODB_URI.replace(/\/\/.*@/, "//***:***@"),
    });

    if (exceptionlessService.initialized) {
      await exceptionlessService.submitError(error, {
        action: "database_connection_failed",
        critical: true,
        data: {
          uri: appConfig.MONGODB_URI.replace(/\/\/.*@/, "//***:***@"),
        },
        tags: ["database", "mongodb", "connection", "startup", "critical"],
      });
    }

    throw error;
  }
}
