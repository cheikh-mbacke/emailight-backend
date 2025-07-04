import Joi from "joi";

// ✅ Logger par défaut avec injection
let logger = {
  error: (msg, error, context) =>
    console.error(`❌ [VALIDATION] ${msg}`, error || "", context || ""),
  debug: (msg, data, context) =>
    console.log(`🔍 [VALIDATION] ${msg}`, data || "", context || ""),
  warn: (msg, data, context) =>
    console.warn(`⚠️ [VALIDATION] ${msg}`, data || "", context || ""),
  info: (msg, data, context) =>
    console.log(`📡 [VALIDATION] ${msg}`, data || "", context || ""),
};

/**
 * ✅ Injection du logger
 */
export const setLogger = (injectedLogger) => {
  logger = injectedLogger;
};

/**
 * 📝 Joi validation schemas
 */
export const schemas = {
  // 🔐 User registration
  register: Joi.object({
    name: Joi.string().trim().min(2).max(100).required().messages({
      "string.empty": "Le nom est requis",
      "string.min": "Le nom doit contenir au moins 2 caractères",
      "string.max": "Le nom ne peut pas dépasser 100 caractères",
      "any.required": "Le nom est obligatoire",
    }),
    email: Joi.string().email().lowercase().trim().required().messages({
      "string.email": "Format d'email invalide",
      "string.empty": "L'email est requis",
      "any.required": "L'email est obligatoire",
    }),
    password: Joi.string().min(6).max(128).required().messages({
      "string.min": "Le mot de passe doit contenir au moins 6 caractères",
      "string.max": "Le mot de passe ne peut pas dépasser 128 caractères",
      "string.empty": "Le mot de passe est requis",
      "any.required": "Le mot de passe est obligatoire",
    }),
  }),

  // 🔑 User login
  login: Joi.object({
    email: Joi.string().email().lowercase().trim().required().messages({
      "string.email": "Format d'email invalide",
      "string.empty": "L'email est requis",
      "any.required": "L'email est obligatoire",
    }),
    password: Joi.string().required().messages({
      "string.empty": "Le mot de passe est requis",
      "any.required": "Le mot de passe est obligatoire",
    }),
  }),

  // 🔄 Refresh token
  refreshToken: Joi.object({
    refreshToken: Joi.string().trim().required().messages({
      "string.empty": "Le token de rafraîchissement est requis",
      "any.required": "Le token de rafraîchissement est obligatoire",
    }),
  }),

  // 🔍 Google OAuth
  googleAuth: Joi.object({
    googleToken: Joi.string().trim().required().messages({
      "string.empty": "Le token Google est requis",
      "any.required": "Le token Google est obligatoire",
    }),
  }),

  // 👤 Profile update
  updateProfile: Joi.object({
    name: Joi.string().trim().min(2).max(100).optional().messages({
      "string.min": "Le nom doit contenir au moins 2 caractères",
      "string.max": "Le nom ne peut pas dépasser 100 caractères",
    }),
    email: Joi.string().email().lowercase().trim().optional().messages({
      "string.email": "Format d'email invalide",
    }),
    currentPassword: Joi.string()
      .when("newPassword", {
        is: Joi.exist(),
        then: Joi.required(),
        otherwise: Joi.optional(),
      })
      .messages({
        "any.required":
          "Le mot de passe actuel est requis pour changer de mot de passe",
      }),
    newPassword: Joi.string().min(6).max(128).optional().messages({
      "string.min":
        "Le nouveau mot de passe doit contenir au moins 6 caractères",
      "string.max":
        "Le nouveau mot de passe ne peut pas dépasser 128 caractères",
    }),
  })
    .min(1)
    .messages({
      "object.min": "Au moins un champ doit être fourni pour la mise à jour",
    }),

  // 🔄 Forgot password
  forgotPassword: Joi.object({
    email: Joi.string().email().lowercase().trim().required().messages({
      "string.email": "Format d'email invalide",
      "string.empty": "L'email est requis",
      "any.required": "L'email est obligatoire",
    }),
  }),

  // 🔒 Reset password
  resetPassword: Joi.object({
    token: Joi.string().trim().required().messages({
      "string.empty": "Le token de réinitialisation est requis",
      "any.required": "Le token de réinitialisation est obligatoire",
    }),
    password: Joi.string().min(6).max(128).required().messages({
      "string.min": "Le mot de passe doit contenir au moins 6 caractères",
      "string.max": "Le mot de passe ne peut pas dépasser 128 caractères",
      "string.empty": "Le nouveau mot de passe est requis",
      "any.required": "Le nouveau mot de passe est obligatoire",
    }),
  }),

  // ⚙️ User preferences
  updatePreferences: Joi.object({
    theme: Joi.string().valid("light", "dark", "auto").optional().messages({
      "any.only": "Le thème doit être light, dark ou auto",
    }),
    language: Joi.string()
      .valid("FR", "EN", "ES", "DE", "IT", "PT", "NL", "RU", "ZH", "JA")
      .optional()
      .messages({
        "any.only": "Langue non supportée",
      }),
    defaultTone: Joi.string()
      .valid(
        "Professionnel",
        "Formelle",
        "Amical",
        "Familier",
        "Expert",
        "Confiant",
        "Aimant",
        "Prudent",
        "Affligeant",
        "Excitant",
        "Inspirant",
        "Informatif",
        "Direct",
        "Attentionné",
        "Surprise",
        "Persuasif",
        "Joyeux"
      )
      .optional()
      .messages({
        "any.only": "Ton invalide",
      }),
    defaultLength: Joi.string()
      .valid("Court", "Moyen", "Long")
      .optional()
      .messages({
        "any.only": "La longueur doit être Court, Moyen ou Long",
      }),
    defaultEmoji: Joi.boolean().optional(),
    emailNotifications: Joi.boolean().optional(),
    marketingEmails: Joi.boolean().optional(),
    autoSaveDrafts: Joi.boolean().optional(),
  })
    .min(1)
    .messages({
      "object.min": "Au moins une préférence doit être fournie",
    }),

  // 📧 Add email account (future use)
  addEmailAccount: Joi.object({
    email: Joi.string().email().lowercase().trim().required().messages({
      "string.email": "Format d'email invalide",
      "string.empty": "L'email est requis",
      "any.required": "L'email est obligatoire",
    }),
    provider: Joi.string()
      .valid("gmail", "outlook", "yahoo", "other")
      .default("gmail")
      .messages({
        "any.only": "Provider non supporté",
      }),
    displayName: Joi.string().trim().max(100).optional().messages({
      "string.max": "Le nom d'affichage ne peut pas dépasser 100 caractères",
    }),
  }),
};

/**
 * 🏭 Factory function to create a Fastify validation middleware
 */
const createValidationMiddleware = (schema, target = "body") => {
  return async (request, reply) => {
    try {
      let dataToValidate;

      // Select the target part of the request
      switch (target) {
        case "body":
          dataToValidate = request.body;
          break;
        case "query":
          dataToValidate = request.query;
          break;
        case "params":
          dataToValidate = request.params;
          break;
        default:
          dataToValidate = request.body;
      }

      // Log validation attempt
      logger.debug(
        "Validation en cours",
        {
          target,
          endpoint: `${request.method} ${request.url}`,
          dataKeys: Object.keys(dataToValidate || {}),
        },
        {
          action: "validation_start",
          endpoint: `${request.method} ${request.url}`,
        }
      );

      // Perform Joi validation
      const { error, value } = schema.validate(dataToValidate, {
        abortEarly: false, // Show all errors
        stripUnknown: true, // Remove unknown fields
        convert: true, // Auto-convert types
      });

      if (error) {
        const errors = error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
          value: detail.context?.value,
        }));

        logger.warn(
          "Échec de validation",
          {
            endpoint: `${request.method} ${request.url}`,
            errorsCount: errors.length,
            errors: errors.map((e) => e.field),
          },
          {
            action: "validation_failed",
            endpoint: `${request.method} ${request.url}`,
          }
        );

        // 🎯 Erreur de validation = 400 (métier) - gestion locale
        return reply.code(400).send({
          error: "Données invalides",
          message: "Les données fournies ne respectent pas le format attendu",
          details: errors,
        });
      }

      // Log successful validation
      logger.debug(
        "Validation réussie",
        {
          endpoint: `${request.method} ${request.url}`,
          validatedFields: Object.keys(value || {}),
        },
        {
          action: "validation_success",
          endpoint: `${request.method} ${request.url}`,
        }
      );

      // Replace raw data with validated and cleaned values
      if (target === "body") {
        request.body = value;
      } else if (target === "query") {
        request.query = value;
      } else if (target === "params") {
        request.params = value;
      }
    } catch (validationError) {
      // 🚨 Erreur système lors de la validation (problème Joi, etc.)
      logger.error("Erreur système de validation", validationError, {
        action: "validation_system_error",
        endpoint: `${request.method} ${request.url}`,
        target,
        errorType: validationError.name || "unknown",
      });

      // 🚨 Laisser remonter les erreurs système au gestionnaire centralisé
      throw validationError;
    }
  };
};

/**
 * 📋 Pre-configured validation middlewares
 */
export const validateRegister = createValidationMiddleware(schemas.register);
export const validateLogin = createValidationMiddleware(schemas.login);
export const validateRefreshToken = createValidationMiddleware(
  schemas.refreshToken
);
export const validateGoogleAuth = createValidationMiddleware(
  schemas.googleAuth
);
export const validateUpdateProfile = createValidationMiddleware(
  schemas.updateProfile
);
export const validateForgotPassword = createValidationMiddleware(
  schemas.forgotPassword
);
export const validateResetPassword = createValidationMiddleware(
  schemas.resetPassword
);
export const validateUpdatePreferences = createValidationMiddleware(
  schemas.updatePreferences
);
export const validateAddEmailAccount = createValidationMiddleware(
  schemas.addEmailAccount
);

// URL param validation
export const validateUserId = createValidationMiddleware(
  Joi.object({
    id: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "ID utilisateur invalide",
        "any.required": "ID utilisateur requis",
      }),
  }),
  "params"
);

/**
 * 🛡️ Generic middleware for custom schema validation
 */
export const validate = (schema, target = "body") => {
  return createValidationMiddleware(schema, target);
};
