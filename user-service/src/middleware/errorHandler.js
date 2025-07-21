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
        status: "failed",
        errorCode: "500",
        errorName: "INTERNAL_ERROR",
        errorMessage: "Erreur interne du serveur",
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
      status: "failed",
      errorCode: (error.statusCode || 400).toString(),
      errorName: error.code || "OPERATIONAL_ERROR",
      errorMessage: error.message,
      // Ajouter des détails en développement
      ...(process.env.NODE_ENV === "development" && {
        details: error.details || null,
        stack: error.stack,
        context,
      }),
    };
  }

  // Erreurs de validation Joi
  if (error.validation) {
    return {
      status: "failed",
      errorCode: "400",
      errorName: "VALIDATION_ERROR",
      errorMessage: "Données invalides",
      ...(process.env.NODE_ENV === "development" && {
        details: error.validation,
      }),
    };
  }

  // Erreurs JWT
  if (error.code && error.code.startsWith("FST_JWT_")) {
    return {
      status: "failed",
      errorCode: "401",
      errorName: "INVALID_TOKEN",
      errorMessage: "Token d'authentification invalide",
    };
  }

  // Erreurs système (non opérationnelles)
  return {
    status: "failed",
    errorCode: "500",
    errorName: "SYSTEM_ERROR",
    errorMessage: "Erreur interne du serveur",
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
      status: "failed",
      errorCode: (error.statusCode || 400).toString(),
      errorName: error.code,
      errorMessage: error.message,
      ...(process.env.NODE_ENV === "development" && {
        details: error.details || null,
      }),
    });
  }

  // Sinon, logger et retourner une erreur générique
  logger?.error("Erreur non opérationnelle dans le controller", error, {
    method: request.method,
    url: request.url,
    userId: request.user?._id?.toString(),
  });

  return reply.code(500).send({
    status: "failed",
    errorCode: "500",
    errorName: "SYSTEM_ERROR",
    errorMessage: "Erreur interne du serveur",
  });
};
