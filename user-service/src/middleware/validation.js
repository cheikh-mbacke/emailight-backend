// ============================================================================
// 📁 src/middleware/validation.js - Validation avec traductions centralisées
// ============================================================================

import Joi from "joi";
import I18nService from "../services/i18nService.js";
import { VALIDATION_RULES } from "../constants/validationRules.js";

// Logger par défaut avec injection
let logger = {
  debug: (msg, data) => {
    if (typeof console !== "undefined") {
      console.log(`✅ [VALID] ${msg}`, data || "");
    }
  },
  error: (msg, error) => {
    if (typeof console !== "undefined") {
      console.error(`❌ [VALID] ${msg}`, error || "");
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
 * 🌍 Créer un middleware de validation avec messages traduits
 * @param {object} schema - Schéma Joi
 * @param {string} target - Cible de validation ("body", "query", "params")
 * @returns {function} Middleware de validation
 */
const createValidationMiddleware = (schema, target = "body") => {
  return async (request, reply) => {
    try {
      // 🌍 Obtenir la langue de la requête
      const language = I18nService.getRequestLanguage(request);

      // Configurer Joi - les messages traduits sont définis dans chaque schéma
      const joiOptions = {
        abortEarly: false,
        allowUnknown: true,
        stripUnknown: true,
        // Pas de messages globaux - ils sont définis dans chaque champ des schémas
      };

      // Valider les données
      const dataToValidate = request[target];
      const { error, value } = schema.validate(dataToValidate, joiOptions);

      if (error) {
        logger.debug("Erreur de validation", {
          target,
          errors: error.details,
          language,
        });

        // Prendre le premier message d'erreur spécifique (le plus important)
        const firstError = error.details[0];
        const specificMessage = firstError.message;

        return reply.code(400).send({
          statusCode: 400,
          code: "VALIDATION_ERROR",
          error: "ValidationError",
          message: specificMessage,
        });
      }

      // Remplacer les données validées
      request[target] = value;
      logger.debug("Validation réussie", { target, language });
    } catch (error) {
      logger.error("Erreur dans le middleware de validation", {
        error: error.message,
        target,
      });
      return reply.code(500).send({
        success: false,
        error: "Erreur interne de validation",
        code: "VALIDATION_INTERNAL_ERROR",
      });
    }
  };
};

/**
 * 📝 Validation schemas avec messages traduits
 */
export const validationSchemas = {
  // 📝 User registration
  register: (request) => {
    const language = I18nService.getRequestLanguage(request);

    return Joi.object({
      name: Joi.string()
        .trim()
        .min(VALIDATION_RULES.NAME.MIN_LENGTH)
        .max(VALIDATION_RULES.NAME.MAX_LENGTH)
        .pattern(VALIDATION_RULES.NAME.PATTERN)
        .required()
        .messages({
          "string.empty": I18nService.getValidationMessage(
            "name",
            "required",
            language
          ),
          "string.min": I18nService.getValidationMessage(
            "name",
            "min_length",
            language,
            {
              min: VALIDATION_RULES.NAME.MIN_LENGTH,
            }
          ),
          "string.max": I18nService.getValidationMessage(
            "name",
            "max_length",
            language,
            {
              max: VALIDATION_RULES.NAME.MAX_LENGTH,
            }
          ),
          "string.pattern.base": I18nService.getValidationMessage(
            "name",
            "pattern",
            language
          ),
          "any.required": I18nService.getValidationMessage(
            "name",
            "required",
            language
          ),
        }),
      email: Joi.string()
        .email()
        .lowercase()
        .trim()
        .max(VALIDATION_RULES.EMAIL.MAX_LENGTH)
        .pattern(VALIDATION_RULES.EMAIL.PATTERN)
        .required()
        .messages({
          "string.email": I18nService.getValidationMessage(
            "email",
            "invalid",
            language
          ),
          "string.empty": I18nService.getValidationMessage(
            "email",
            "required",
            language
          ),
          "string.max": I18nService.getValidationMessage(
            "email",
            "max_length",
            language,
            {
              max: VALIDATION_RULES.EMAIL.MAX_LENGTH,
            }
          ),
          "string.pattern.base": I18nService.getValidationMessage(
            "email",
            "invalid",
            language
          ),
          "any.required": I18nService.getValidationMessage(
            "email",
            "required",
            language
          ),
        }),
      password: Joi.string()
        .min(VALIDATION_RULES.PASSWORD.MIN_LENGTH)
        .max(VALIDATION_RULES.PASSWORD.MAX_LENGTH)
        .pattern(VALIDATION_RULES.PASSWORD.PATTERN)
        .required()
        .messages({
          "string.min": I18nService.getValidationMessage(
            "password",
            "min_length",
            language,
            {
              min: VALIDATION_RULES.PASSWORD.MIN_LENGTH,
            }
          ),
          "string.max": I18nService.getValidationMessage(
            "password",
            "max_length",
            language,
            {
              max: VALIDATION_RULES.PASSWORD.MAX_LENGTH,
            }
          ),
          "string.pattern.base": I18nService.getValidationMessage(
            "password",
            "pattern",
            language
          ),
          "string.empty": I18nService.getValidationMessage(
            "password",
            "required",
            language
          ),
          "any.required": I18nService.getValidationMessage(
            "password",
            "required",
            language
          ),
        }),
    });
  },

  // 🔑 User login
  login: (request) => {
    const language = I18nService.getRequestLanguage(request);

    return Joi.object({
      email: Joi.string()
        .email()
        .lowercase()
        .trim()
        .required()
        .messages({
          "string.email": I18nService.getValidationMessage(
            "email",
            "invalid",
            language
          ),
          "string.empty": I18nService.getValidationMessage(
            "email",
            "required",
            language
          ),
          "any.required": I18nService.getValidationMessage(
            "email",
            "required",
            language
          ),
        }),
      password: Joi.string()
        .required()
        .messages({
          "string.empty": I18nService.getValidationMessage(
            "password",
            "required",
            language
          ),
          "any.required": I18nService.getValidationMessage(
            "password",
            "required",
            language
          ),
        }),
    });
  },

  // 🔄 Refresh token
  refreshToken: (request) => {
    const language = I18nService.getRequestLanguage(request);

    return Joi.object({
      refreshToken: Joi.string()
        .trim()
        .min(VALIDATION_RULES.REFRESH_TOKEN.MIN_LENGTH)
        .max(VALIDATION_RULES.REFRESH_TOKEN.MAX_LENGTH)
        .required()
        .messages({
          "string.empty": I18nService.getValidationMessage(
            "refresh_token",
            "required",
            language
          ),
          "string.min": I18nService.getValidationMessage(
            "refresh_token",
            "invalid",
            language
          ),
          "string.max": I18nService.getValidationMessage(
            "refresh_token",
            "invalid",
            language
          ),
          "any.required": I18nService.getValidationMessage(
            "refresh_token",
            "required",
            language
          ),
        }),
    });
  },

  // 🔍 Google OAuth
  googleAuth: (request) => {
    const language = I18nService.getRequestLanguage(request);

    return Joi.object({
      googleToken: Joi.string()
        .trim()
        .min(VALIDATION_RULES.GOOGLE_TOKEN.MIN_LENGTH)
        .max(VALIDATION_RULES.GOOGLE_TOKEN.MAX_LENGTH)
        .required()
        .messages({
          "string.empty": I18nService.getValidationMessage(
            "google_token",
            "required",
            language
          ),
          "string.min": I18nService.getValidationMessage(
            "google_token",
            "invalid",
            language
          ),
          "string.max": I18nService.getValidationMessage(
            "google_token",
            "invalid",
            language
          ),
          "any.required": I18nService.getValidationMessage(
            "google_token",
            "required",
            language
          ),
        }),
    });
  },

  // 🔄 Forgot password
  forgotPassword: (request) => {
    const language = I18nService.getRequestLanguage(request);

    return Joi.object({
      email: Joi.string()
        .email()
        .lowercase()
        .trim()
        .required()
        .messages({
          "string.email": I18nService.getValidationMessage(
            "email",
            "invalid",
            language
          ),
          "string.empty": I18nService.getValidationMessage(
            "email",
            "required",
            language
          ),
          "any.required": I18nService.getValidationMessage(
            "email",
            "required",
            language
          ),
        }),
    });
  },

  // 🔄 Reset password
  resetPassword: (request) => {
    const language = I18nService.getRequestLanguage(request);

    return Joi.object({
      token: Joi.string()
        .trim()
        .min(VALIDATION_RULES.TOKEN.MIN_LENGTH)
        .max(VALIDATION_RULES.TOKEN.MAX_LENGTH)
        .required()
        .messages({
          "string.empty": I18nService.getValidationMessage(
            "token",
            "required",
            language
          ),
          "string.min": I18nService.getValidationMessage(
            "token",
            "invalid",
            language
          ),
          "string.max": I18nService.getValidationMessage(
            "token",
            "invalid",
            language
          ),
          "any.required": I18nService.getValidationMessage(
            "token",
            "required",
            language
          ),
        }),
      newPassword: Joi.string()
        .min(VALIDATION_RULES.PASSWORD.MIN_LENGTH)
        .max(VALIDATION_RULES.PASSWORD.MAX_LENGTH)
        .pattern(VALIDATION_RULES.PASSWORD.PATTERN)
        .required()
        .messages({
          "string.min": I18nService.getValidationMessage(
            "new_password",
            "min_length",
            language,
            {
              min: VALIDATION_RULES.PASSWORD.MIN_LENGTH,
            }
          ),
          "string.max": I18nService.getValidationMessage(
            "new_password",
            "max_length",
            language,
            {
              max: VALIDATION_RULES.PASSWORD.MAX_LENGTH,
            }
          ),
          "string.pattern.base": I18nService.getValidationMessage(
            "new_password",
            "pattern",
            language
          ),
          "string.empty": I18nService.getValidationMessage(
            "new_password",
            "required",
            language
          ),
          "any.required": I18nService.getValidationMessage(
            "new_password",
            "required",
            language
          ),
        }),
    });
  },

  // 👤 Update profile
  updateProfile: (request) => {
    const language = I18nService.getRequestLanguage(request);

    return Joi.object({
      name: Joi.string()
        .trim()
        .min(VALIDATION_RULES.NAME.MIN_LENGTH)
        .max(VALIDATION_RULES.NAME.MAX_LENGTH)
        .pattern(VALIDATION_RULES.NAME.PATTERN)
        .optional()
        .messages({
          "string.min": I18nService.getValidationMessage(
            "name",
            "min_length",
            language,
            {
              min: VALIDATION_RULES.NAME.MIN_LENGTH,
            }
          ),
          "string.max": I18nService.getValidationMessage(
            "name",
            "max_length",
            language,
            {
              max: VALIDATION_RULES.NAME.MAX_LENGTH,
            }
          ),
          "string.pattern.base": I18nService.getValidationMessage(
            "name",
            "pattern",
            language
          ),
        }),
    })
      .min(1)
      .messages({
        "object.min": I18nService.getValidationMessage(
          "at_least_one_field",
          "at_least_one_field",
          language
        ),
      });
  },

  // 🔐 Change password
  changePassword: (request) => {
    const language = I18nService.getRequestLanguage(request);

    return Joi.object({
      currentPassword: Joi.string()
        .required()
        .messages({
          "string.empty": I18nService.getValidationMessage(
            "current_password",
            "required",
            language
          ),
          "any.required": I18nService.getValidationMessage(
            "current_password",
            "required",
            language
          ),
        }),
      newPassword: Joi.string()
        .min(VALIDATION_RULES.PASSWORD.MIN_LENGTH)
        .max(VALIDATION_RULES.PASSWORD.MAX_LENGTH)
        .pattern(VALIDATION_RULES.PASSWORD.PATTERN)
        .required()
        .messages({
          "string.min": I18nService.getValidationMessage(
            "new_password",
            "min_length",
            language,
            {
              min: VALIDATION_RULES.PASSWORD.MIN_LENGTH,
            }
          ),
          "string.max": I18nService.getValidationMessage(
            "new_password",
            "max_length",
            language,
            {
              max: VALIDATION_RULES.PASSWORD.MAX_LENGTH,
            }
          ),
          "string.pattern.base": I18nService.getValidationMessage(
            "new_password",
            "pattern",
            language
          ),
          "string.empty": I18nService.getValidationMessage(
            "new_password",
            "required",
            language
          ),
          "any.required": I18nService.getValidationMessage(
            "new_password",
            "required",
            language
          ),
        }),
    });
  },

  // ⚙️ Update preferences
  updatePreferences: (request) => {
    const language = I18nService.getRequestLanguage(request);

    return Joi.object({
      theme: Joi.string()
        .valid("light", "dark", "auto")
        .optional()
        .messages({
          "any.only": I18nService.getValidationMessage(
            "theme",
            "invalid",
            language
          ),
        }),
      language: Joi.string()
        .valid("FR", "EN")
        .optional()
        .messages({
          "any.only": I18nService.getValidationMessage(
            "language",
            "invalid",
            language
          ),
        }),
      defaultTone: Joi.string()
        .valid("Professionnel", "Amical", "Formel", "Décontracté")
        .optional()
        .messages({
          "any.only": I18nService.getValidationMessage(
            "default_tone",
            "invalid",
            language
          ),
        }),
      defaultLength: Joi.string()
        .valid("Court", "Moyen", "Long")
        .optional()
        .messages({
          "any.only": I18nService.getValidationMessage(
            "default_length",
            "invalid",
            language
          ),
        }),
    })
      .min(1)
      .messages({
        "object.min": I18nService.getValidationMessage(
          "at_least_one_field",
          "at_least_one_field",
          language
        ),
      });
  },

  // 📧 Email account validation
  emailAccount: (request) => {
    const language = I18nService.getRequestLanguage(request);

    return Joi.object({
      email: Joi.string()
        .email()
        .lowercase()
        .trim()
        .required()
        .messages({
          "string.email": I18nService.getValidationMessage(
            "email",
            "invalid",
            language
          ),
          "string.empty": I18nService.getValidationMessage(
            "email",
            "required",
            language
          ),
          "any.required": I18nService.getValidationMessage(
            "email",
            "required",
            language
          ),
        }),
      provider: Joi.string()
        .valid("gmail", "emailight", "yahoo", "smtp")
        .required()
        .messages({
          "any.only": I18nService.getValidationMessage(
            "provider",
            "invalid",
            language
          ),
        }),
      displayName: Joi.string()
        .max(100)
        .optional()
        .messages({
          "string.max": I18nService.getValidationMessage(
            "display_name",
            "max_length",
            language,
            { max: 100 }
          ),
        }),
    });
  },

  // 🆔 User ID validation
  userId: (request) => {
    const language = I18nService.getRequestLanguage(request);

    return Joi.object({
      userId: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
          "string.pattern.base": I18nService.getValidationMessage(
            "user_id",
            "invalid",
            language
          ),
          "any.required": I18nService.getValidationMessage(
            "user_id",
            "required",
            language
          ),
        }),
    });
  },
};

/**
 * 🏭 Factory function to create a Fastify validation middleware
 */
export const validate = (schema, target = "body") => {
  return createValidationMiddleware(schema, target);
};

/**
 * 📋 Export individual validation functions for convenience
 */
export const validateRegister = (request, reply) => {
  return createValidationMiddleware(
    validationSchemas.register(request),
    "body"
  )(request, reply);
};

export const validateLogin = (request, reply) => {
  return createValidationMiddleware(validationSchemas.login(request), "body")(
    request,
    reply
  );
};

export const validateRefreshToken = (request, reply) => {
  return createValidationMiddleware(
    validationSchemas.refreshToken(request),
    "body"
  )(request, reply);
};

export const validateGoogleAuth = (request, reply) => {
  return createValidationMiddleware(
    validationSchemas.googleAuth(request),
    "body"
  )(request, reply);
};

export const validateForgotPassword = (request, reply) => {
  return createValidationMiddleware(
    validationSchemas.forgotPassword(request),
    "body"
  )(request, reply);
};

export const validateResetPassword = (request, reply) => {
  return createValidationMiddleware(
    validationSchemas.resetPassword(request),
    "body"
  )(request, reply);
};

export const validateUpdateProfile = (request, reply) => {
  return createValidationMiddleware(
    validationSchemas.updateProfile(request),
    "body"
  )(request, reply);
};

export const validateChangePassword = (request, reply) => {
  return createValidationMiddleware(
    validationSchemas.changePassword(request),
    "body"
  )(request, reply);
};

export const validateUpdatePreferences = (request, reply) => {
  return createValidationMiddleware(
    validationSchemas.updatePreferences(request),
    "body"
  )(request, reply);
};

export const validateEmailAccount = (request, reply) => {
  return createValidationMiddleware(
    validationSchemas.emailAccount(request),
    "body"
  )(request, reply);
};

export const validateUserId = (request, reply) => {
  return createValidationMiddleware(
    validationSchemas.userId(request),
    "params"
  )(request, reply);
};
