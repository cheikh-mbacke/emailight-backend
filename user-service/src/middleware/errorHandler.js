// ============================================================================
// 📁 src/middleware/errorHandler.js - Gestionnaire d'erreurs centralisé
// ============================================================================

import { SystemError } from "../utils/customError.js";
import { I18nService } from "../services/i18nService.js";

/**
 * 🔧 Middleware de gestion d'erreurs centralisé
 * Standardise la gestion des erreurs dans tous les controllers
 */
export const createErrorHandler = (logger) => {
  return async (error, request, reply) => {
    try {
      // Extraire les informations de contexte
      const context = {
        method: request.method,
        url: request.url,
        userId: request.user?._id?.toString(),
        action: `${request.method} ${request.url}`,
      };

      // Déterminer le type d'erreur et la réponse appropriée
      const errorResponse = await buildErrorResponse(error, request, context);

      // Logger l'erreur avec le niveau approprié
      logError(error, context, logger);

      // Retourner la réponse d'erreur standardisée
      return reply.code(errorResponse.statusCode).send(errorResponse);
    } catch (handlerError) {
      // En cas d'erreur dans le gestionnaire lui-même
      logger?.error("Erreur dans le gestionnaire d'erreurs", handlerError, {
        originalError: error.message,
        action: "error_handler_failed",
      });

      // Réponse de fallback
      return reply.code(500).send({
        error: "Erreur interne du serveur",
        code: "INTERNAL_ERROR",
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  };
};

/**
 * 🏗️ Construit une réponse d'erreur standardisée
 */
async function buildErrorResponse(error, request, context) {
  // Déterminer la langue de l'utilisateur
  const userLanguage = I18nService.getUserLanguage(request.user) || "FR";

  // Erreurs opérationnelles (métier)
  if (error.isOperational) {
    return {
      error: error.message,
      code: error.code || "OPERATIONAL_ERROR",
      statusCode: error.statusCode || 400,
      details: error.details || null,
      timestamp: new Date().toISOString(),
      // Ajouter des détails en développement
      ...(process.env.NODE_ENV === "development" && {
        stack: error.stack,
        context,
      }),
    };
  }

  // Erreurs de validation Joi
  if (error.validation) {
    return {
      error: "Données invalides",
      code: "VALIDATION_ERROR",
      statusCode: 400,
      details: error.validation,
      timestamp: new Date().toISOString(),
    };
  }

  // Erreurs JWT
  if (error.code && error.code.startsWith("FST_JWT_")) {
    return {
      error: "Token d'authentification invalide",
      code: "INVALID_TOKEN",
      statusCode: 401,
      timestamp: new Date().toISOString(),
    };
  }

  // Erreurs système (non opérationnelles)
  return {
    error: "Erreur interne du serveur",
    code: "SYSTEM_ERROR",
    statusCode: 500,
    timestamp: new Date().toISOString(),
    // En développement, exposer plus de détails
    ...(process.env.NODE_ENV === "development" && {
      originalError: error.message,
      stack: error.stack,
      context,
    }),
  };
}

/**
 * 📝 Log l'erreur avec le niveau approprié
 */
function logError(error, context, logger) {
  if (!logger) return;

  const logData = {
    error: error.message,
    code: error.code,
    statusCode: error.statusCode,
    ...context,
  };

  // Déterminer le niveau de log selon le type d'erreur
  if (error.statusCode >= 500) {
    logger.error("Erreur serveur", error, logData);
  } else if (error.statusCode >= 400) {
    logger.warn("Erreur client", error, logData);
  } else {
    logger.info("Erreur informationnelle", error, logData);
  }
}

/**
 * 🔧 Wrapper pour les controllers - simplifie la gestion d'erreurs
 */
export const withErrorHandling = (controllerMethod) => {
  return async (request, reply) => {
    try {
      return await controllerMethod(request, reply);
    } catch (error) {
      // Si c'est déjà une erreur opérationnelle, la laisser passer
      if (error.isOperational) {
        throw error;
      }

      // Sinon, la transformer en erreur système
      throw new SystemError("Erreur lors de l'exécution de la requête", error, {
        method: request.method,
        url: request.url,
        userId: request.user?._id?.toString(),
      });
    }
  };
};

/**
 * 🎯 Gestionnaire d'erreurs pour les routes spécifiques
 */
export const handleControllerError = (error, request, reply, logger) => {
  // Si c'est une erreur opérationnelle, la gérer directement
  if (error.isOperational) {
    return reply.code(error.statusCode || 400).send({
      error: error.message,
      code: error.code,
      statusCode: error.statusCode || 400,
      details: error.details || null,
      timestamp: new Date().toISOString(),
    });
  }

  // Sinon, logger et retourner une erreur générique
  logger?.error("Erreur non opérationnelle dans le controller", error, {
    method: request.method,
    url: request.url,
    userId: request.user?._id?.toString(),
  });

  return reply.code(500).send({
    error: "Erreur interne du serveur",
    code: "SYSTEM_ERROR",
    statusCode: 500,
    timestamp: new Date().toISOString(),
  });
};
