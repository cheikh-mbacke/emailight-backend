// ============================================================================
// 📁 src/utils/exceptionless.js - Service Exceptionless pour gestion centralisée
// ============================================================================

import { Exceptionless } from "@exceptionless/node";

/**
 * 🔧 Service Exceptionless centralisé pour l'infrastructure
 */
class ExceptionlessService {
  constructor() {
    this.initialized = false;
    this.logger = null;
    this.config = null;
  }

  /**
   * 🚀 Initialise le service Exceptionless
   */
  async initialize(logger, config) {
    this.logger = logger;
    this.config = config;

    try {
      // Vérifier si l'API key est configurée
      if (!config.USER_SERVICE_EXCEPTIONLESS_API_KEY) {
        logger.warn(
          "Exceptionless API key non configurée, désactivation du reporting d'erreurs"
        );
        return;
      }

      // Configuration du client Exceptionless
      await Exceptionless.startup((c) => {
        c.apiKey = config.USER_SERVICE_EXCEPTIONLESS_API_KEY;

        // Configuration du serveur self-hosted
        if (config.USER_SERVICE_EXCEPTIONLESS_SERVER_URL) {
          c.serverUrl = config.USER_SERVICE_EXCEPTIONLESS_SERVER_URL;
        }

        // Configuration des données par défaut
        c.defaultData["service"] = "user-service";
        c.defaultData["environment"] = config.NODE_ENV;
        c.defaultData["version"] = "1.0.0";
        c.defaultData["host"] = `${config.HOST}:${config.PORT}`;

        // Tags par défaut
        c.defaultTags.push(
          "user-service",
          "fastify",
          "nodejs",
          config.NODE_ENV
        );

        // Configuration pour les environnements Docker/Container
        c.usePersistedQueueStorage = false;

        // Debug en développement
        if (config.NODE_ENV === "development") {
          c.defaultTags.push("development");
        }
      });

      this.initialized = true;

      logger.success("Exceptionless initialisé avec succès", {
        serverUrl: config.USER_SERVICE_EXCEPTIONLESS_SERVER_URL,
        environment: config.NODE_ENV,
        service: "user-service",
      });
    } catch (error) {
      logger.error("Erreur lors de l'initialisation d'Exceptionless", error);
      // Ne pas faire échouer l'application si Exceptionless ne peut pas s'initialiser
    }
  }

  /**
   * 📝 Soumettre une erreur à Exceptionless (pour la gestion centralisée)
   */
  async submitError(error, context = {}) {
    if (!this.initialized) {
      return;
    }

    try {
      const event = Exceptionless.createException(error);

      // Ajouter le contexte de la requête si disponible
      if (context.request) {
        event.addRequestInfo(context.request);
      }

      // Ajouter des données personnalisées
      if (context.userId) {
        event.setUserIdentity(context.userId);
      }

      if (context.action) {
        event.setProperty("action", context.action);
      }

      if (context.data) {
        event.setProperty("customData", context.data);
      }

      // Marquer comme critique si spécifié
      if (context.critical) {
        event.markAsCritical();
      }

      // Ajouter des tags
      if (context.tags && Array.isArray(context.tags)) {
        context.tags.forEach((tag) => event.addTags(tag));
      }

      await event.submit();

      if (this.logger) {
        this.logger.debug("Erreur envoyée à Exceptionless", {
          errorMessage: error.message,
          action: context.action,
          userId: context.userId,
        });
      }
    } catch (submitError) {
      if (this.logger) {
        this.logger.error(
          "Erreur lors de l'envoi à Exceptionless",
          submitError
        );
      }
    }
  }

  /**
   * 🔍 Créer un gestionnaire d'erreurs Fastify centralisé avec Exceptionless
   */
  createCentralizedErrorHandler() {
    return async (error, request, reply) => {
      // Extraire les informations de contexte pour Exceptionless
      const context = {
        request: {
          method: request.method,
          url: request.url,
          headers: {
            "user-agent": request.headers["user-agent"],
            "content-type": request.headers["content-type"],
            authorization: request.headers.authorization
              ? "[REDACTED]"
              : undefined,
          },
          ip: request.ip,
          body: this._sanitizeRequestBody(request.body),
          params: request.params,
          query: request.query,
        },
        action: `${request.method} ${request.url}`,
        userId: request.user?.id || request.user?.userId,
        critical: error.statusCode >= 500,
        tags: ["centralized-error", "fastify"],
      };

      // Ajouter des tags selon le type d'erreur
      if (error.statusCode) {
        context.tags.push(`http-${error.statusCode}`);
      }

      if (error.validation) {
        context.tags.push("validation-error");
        context.data = { validationErrors: error.validation };
      }

      if (error.code) {
        context.tags.push(`error-code-${error.code}`);

        if (error.code.startsWith("FST_JWT_")) {
          context.tags.push("jwt-error");
        }
      }

      // Déterminer le niveau de criticité
      if (error.statusCode >= 500) {
        context.tags.push("server-error", "critical");
        context.critical = true;
      } else if (error.statusCode >= 400) {
        context.tags.push("client-error");
      }

      // Soumettre l'erreur à Exceptionless
      await this.submitError(error, context);

      // Log local de l'erreur avec le niveau approprié
      const logLevel = error.statusCode >= 500 ? "error" : "warn";
      this.logger[logLevel](
        "Erreur capturée par le gestionnaire centralisé",
        error,
        {
          method: request.method,
          url: request.url,
          statusCode: error.statusCode || 500,
          userId: context.userId,
          errorCode: error.code,
          action: "centralized_error_handler",
        }
      );

      // Retourner la réponse d'erreur standardisée
      return this._buildErrorResponse(error, reply);
    };
  }

  /**
   * 🎯 Créer un hook onError pour capturer les erreurs des hooks Fastify
   */
  createErrorHook() {
    return async (request, reply, error) => {
      const context = {
        request: {
          method: request.method,
          url: request.url,
          ip: request.ip,
          userAgent: request.headers["user-agent"],
        },
        userId: request.user?.id || request.user?.userId,
        action: `${request.method} ${request.url}`,
        tags: ["fastify-hook-error", "lifecycle-error"],
        critical: true, // Les erreurs de hooks sont généralement critiques
      };

      await this.submitError(error, context);
    };
  }

  /**
   * 🚫 Créer un gestionnaire pour les routes non trouvées (404)
   */
  createNotFoundHandler() {
    return async (request, reply) => {
      // Créer une erreur factice pour Exceptionless
      const notFoundError = new Error(
        `Route not found: ${request.method} ${request.url}`
      );
      notFoundError.statusCode = 404;
      notFoundError.code = "ROUTE_NOT_FOUND";

      const context = {
        request: {
          method: request.method,
          url: request.url,
          ip: request.ip,
          userAgent: request.headers["user-agent"],
        },
        action: "route_not_found",
        tags: ["404", "not-found", request.method.toLowerCase()],
        critical: false,
      };

      // Soumettre à Exceptionless comme un événement de log plutôt qu'une erreur
      if (this.initialized) {
        try {
          const event = Exceptionless.createLog(
            `404 Not Found: ${request.method} ${request.url}`,
            "Warn"
          );

          if (context.request) {
            event.setProperty("request", context.request);
          }

          context.tags.forEach((tag) => event.addTags(tag));

          await event.submit();
        } catch (submitError) {
          this.logger?.error(
            "Erreur lors de l'envoi du 404 à Exceptionless",
            submitError
          );
        }
      }

      this.logger?.warn("Route non trouvée", {
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
      });
    };
  }

  /**
   * 🏥 Vérifier la santé du service Exceptionless
   */
  getHealthStatus() {
    return {
      initialized: this.initialized,
      apiKeyConfigured: !!this.config?.USER_SERVICE_EXCEPTIONLESS_API_KEY,
      serverUrl:
        this.config?.USER_SERVICE_EXCEPTIONLESS_SERVER_URL ||
        "https://api.exceptionless.io",
    };
  }

  /**
   * 🧹 Nettoyer les données sensibles du body de la requête
   */
  _sanitizeRequestBody(body) {
    if (!body || typeof body !== "object") {
      return body;
    }

    const sanitized = { ...body };
    const sensitiveFields = ["password", "token", "secret", "key", "auth"];

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = "[REDACTED]";
      }
    }

    return sanitized;
  }

  /**
   * 📋 Construire une réponse d'erreur standardisée
   */
  _buildErrorResponse(error, reply) {
    // Format uniformisé pour toutes les erreurs
    const statusCode = error.statusCode || 500;
    const isProduction = this.config?.NODE_ENV === "production";

    // Structure de base uniformisée
    const errorResponse = {
      statusCode,
      success: false,
      timestamp: new Date().toISOString(),
    };

    // Gestion des erreurs opérationnelles (erreurs métier)
    if (error.isOperational) {
      return reply.code(statusCode).send({
        ...errorResponse,
        code: error.code || "OPERATION_ERROR",
        error: error.message || "Erreur d'opération",
        message:
          error.userMessage || error.message || "Une erreur s'est produite",
      });
    }

    // Gestion des erreurs de validation Fastify
    if (error.validation) {
      return reply.code(400).send({
        ...errorResponse,
        statusCode: 400,
        code: "VALIDATION_ERROR",
        error: "Données invalides",
        message: "Les données fournies ne respectent pas le format attendu",
        details: error.validation,
      });
    }

    // Gestion des erreurs JWT
    if (error.code && error.code.startsWith("FST_JWT_")) {
      return reply.code(401).send({
        ...errorResponse,
        statusCode: 401,
        code: error.code,
        error: "Erreur d'authentification",
        message: "Token invalide ou expiré",
      });
    }

    // Gestion des erreurs de taux limite
    if (error.statusCode === 429) {
      return reply.code(429).send({
        ...errorResponse,
        statusCode: 429,
        code: "RATE_LIMIT_EXCEEDED",
        error: "Trop de requêtes",
        message: "Veuillez patienter avant de refaire une requête",
        retryAfter: error.retryAfter,
      });
    }

    // Erreur générique
    return reply.code(statusCode).send({
      ...errorResponse,
      code: statusCode >= 500 ? "INTERNAL_SERVER_ERROR" : "CLIENT_ERROR",
      error:
        statusCode >= 500 ? "Erreur interne du serveur" : "Erreur de requête",
      message:
        statusCode >= 500
          ? "Une erreur inattendue s'est produite"
          : error.message || "Requête invalide",
      ...(!isProduction &&
        statusCode >= 500 && {
          details: error.message,
          stack: error.stack,
        }),
    });
  }
}

// Instance singleton
const exceptionlessService = new ExceptionlessService();

export default exceptionlessService;
