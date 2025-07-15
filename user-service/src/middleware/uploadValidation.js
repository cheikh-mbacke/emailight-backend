// ============================================================================
// 📁 src/middleware/uploadValidation.js - Validation des uploads de fichiers
// ============================================================================

// ✅ Logger par défaut avec injection
let logger = {
  error: (msg, error, context) => {
    // Fallback to console if no logger injected
    if (typeof console !== 'undefined') {
      console.error(`❌ [UPLOAD] ${msg}`, error || "", context || "");
    }
  },
  debug: (msg, data, context) => {
    // Fallback to console if no logger injected
    if (typeof console !== 'undefined') {
      console.log(`🔍 [UPLOAD] ${msg}`, data || "", context || "");
    }
  },
  warn: (msg, data, context) => {
    // Fallback to console if no logger injected
    if (typeof console !== 'undefined') {
      console.warn(`⚠️ [UPLOAD] ${msg}`, data || "", context || "");
    }
  },
  info: (msg, data, context) => {
    // Fallback to console if no logger injected
    if (typeof console !== 'undefined') {
      console.log(`📡 [UPLOAD] ${msg}`, data || "", context || "");
    }
  },
};

/**
 * ✅ Injection du logger
 */
export const setLogger = (injectedLogger) => {
  logger = injectedLogger;
};

/**
 * 📤 Configuration des uploads
 */
const uploadConfig = {
  avatar: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ],
    maxFiles: 1,
  },
};

/**
 * 🛡️ Middleware de validation des uploads d'avatar
 */
export const validateAvatarUpload = async (request, reply) => {
  try {
    logger.debug(
      "Validation upload avatar en cours",
      {
        endpoint: `${request.method} ${request.url}`,
        contentType: request.headers["content-type"],
      },
      {
        action: "avatar_upload_validation_start",
        endpoint: `${request.method} ${request.url}`,
        userId: request.user?._id?.toString(),
      }
    );

    // Vérifier que c'est bien un multipart/form-data
    if (!request.isMultipart()) {
      logger.warn(
        "Tentative d'upload sans multipart/form-data",
        {
          contentType: request.headers["content-type"],
          endpoint: `${request.method} ${request.url}`,
        },
        {
          action: "invalid_upload_content_type",
          endpoint: `${request.method} ${request.url}`,
          userId: request.user?._id?.toString(),
        }
      );

      return reply.code(400).send({
        error: "Format de requête invalide",
        message: "L'upload nécessite le format multipart/form-data",
        code: "INVALID_CONTENT_TYPE",
      });
    }

    logger.debug(
      "Validation upload avatar réussie",
      {
        endpoint: `${request.method} ${request.url}`,
      },
      {
        action: "avatar_upload_validation_success",
        endpoint: `${request.method} ${request.url}`,
        userId: request.user?._id?.toString(),
      }
    );
  } catch (error) {
    // 🚨 Erreur système lors de la validation
    logger.error("Erreur système de validation d'upload", error, {
      action: "upload_validation_system_error",
      endpoint: `${request.method} ${request.url}`,
      userId: request.user?._id?.toString(),
      errorType: error.name || "unknown",
    });

    // 🚨 Laisser remonter les erreurs système au gestionnaire centralisé
    throw error;
  }
};

/**
 * 📋 Middleware générique de validation de fichier
 */
export const validateFileUpload = (fileType = "avatar") => {
  return async (request, reply) => {
    try {
      const config = uploadConfig[fileType];

      if (!config) {
        logger.error(
          `Configuration upload manquante pour le type: ${fileType}`,
          null,
          {
            action: "upload_config_missing",
            fileType,
            endpoint: `${request.method} ${request.url}`,
          }
        );

        return reply.code(500).send({
          error: "Configuration upload manquante",
          message: `Type de fichier ${fileType} non configuré`,
          code: "UPLOAD_CONFIG_MISSING",
        });
      }

      // Validation du multipart sera faite au niveau du traitement du fichier
      logger.debug(
        `Validation upload ${fileType} préparée`,
        {
          maxFileSize: config.maxFileSize,
          allowedMimeTypes: config.allowedMimeTypes,
        },
        {
          action: "file_upload_validation_prepared",
          fileType,
          endpoint: `${request.method} ${request.url}`,
          userId: request.user?._id?.toString(),
        }
      );
    } catch (error) {
      logger.error(`Erreur validation upload ${fileType}`, error, {
        action: "file_upload_validation_error",
        fileType,
        endpoint: `${request.method} ${request.url}`,
        userId: request.user?._id?.toString(),
      });

      throw error;
    }
  };
};

/**
 * 📊 Obtenir la configuration des uploads
 */
export const getUploadConfig = () => {
  return uploadConfig;
};

/**
 * 🔍 Valider les limites de fichier (utilisé par les services)
 */
export const validateFileLimits = (fileData, fileType = "avatar") => {
  const config = uploadConfig[fileType];
  const errors = [];

  if (!config) {
    throw new Error(`Configuration upload manquante pour le type: ${fileType}`);
  }

  // Vérifier la taille
  if (fileData.size > config.maxFileSize) {
    errors.push(
      `Fichier trop volumineux (max: ${Math.round(config.maxFileSize / 1024 / 1024)}MB)`
    );
  }

  // Vérifier le type MIME
  if (
    fileData.mimetype &&
    !config.allowedMimeTypes.includes(fileData.mimetype)
  ) {
    errors.push(
      `Type de fichier non autorisé. Types acceptés: ${config.allowedMimeTypes.join(", ")}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    config,
  };
};
