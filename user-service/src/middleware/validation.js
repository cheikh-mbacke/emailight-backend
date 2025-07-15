import Joi from "joi";
import { VALIDATION_RULES } from "../constants/validationRules.js";
import { getValidationMessage } from "../constants/validationMessages.js";

// ✅ Logger par défaut avec injection
let logger = {
  error: (msg, error, context) => {
    // Fallback to console if no logger injected
    if (typeof console !== 'undefined') {
      console.error(`❌ [VALIDATION] ${msg}`, error || "", context || "");
    }
  },
  debug: (msg, data, context) => {
    // Fallback to console if no logger injected
    if (typeof console !== 'undefined') {
      console.log(`🔍 [VALIDATION] ${msg}`, data || "", context || "");
    }
  },
  warn: (msg, data, context) => {
    // Fallback to console if no logger injected
    if (typeof console !== 'undefined') {
      console.warn(`⚠️ [VALIDATION] ${msg}`, data || "", context || "");
    }
  },
  info: (msg, data, context) => {
    // Fallback to console if no logger injected
    if (typeof console !== 'undefined') {
      console.log(`📡 [VALIDATION] ${msg}`, data || "", context || "");
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
 * 📝 Joi validation schemas using centralized constants
 */
export const schemas = {
  // 🔐 User registration
  register: Joi.object({
    name: Joi.string()
      .trim()
      .min(VALIDATION_RULES.NAME.MIN_LENGTH)
      .max(VALIDATION_RULES.NAME.MAX_LENGTH)
      .pattern(VALIDATION_RULES.NAME.PATTERN)
      .required()
      .messages({
        "string.empty": getValidationMessage("name", "required"),
        "string.min": getValidationMessage("name", "minLength", "FR", {
          min: VALIDATION_RULES.NAME.MIN_LENGTH,
        }),
        "string.max": getValidationMessage("name", "maxLength", "FR", {
          max: VALIDATION_RULES.NAME.MAX_LENGTH,
        }),
        "string.pattern.base": getValidationMessage("name", "pattern"),
        "any.required": getValidationMessage("name", "required"),
      }),
    email: Joi.string()
      .email()
      .lowercase()
      .trim()
      .max(VALIDATION_RULES.EMAIL.MAX_LENGTH)
      .pattern(VALIDATION_RULES.EMAIL.PATTERN)
      .required()
      .messages({
        "string.email": getValidationMessage("email", "invalid"),
        "string.empty": getValidationMessage("email", "required"),
        "string.max": getValidationMessage("email", "maxLength", "FR", {
          max: VALIDATION_RULES.EMAIL.MAX_LENGTH,
        }),
        "string.pattern.base": getValidationMessage("email", "invalid"),
        "any.required": getValidationMessage("email", "required"),
      }),
    password: Joi.string()
      .min(VALIDATION_RULES.PASSWORD.MIN_LENGTH)
      .max(VALIDATION_RULES.PASSWORD.MAX_LENGTH)
      .pattern(VALIDATION_RULES.PASSWORD.PATTERN)
      .required()
      .messages({
        "string.min": getValidationMessage("password", "minLength", "FR", {
          min: VALIDATION_RULES.PASSWORD.MIN_LENGTH,
        }),
        "string.max": getValidationMessage("password", "maxLength", "FR", {
          max: VALIDATION_RULES.PASSWORD.MAX_LENGTH,
        }),
        "string.pattern.base": getValidationMessage("password", "pattern"),
        "string.empty": getValidationMessage("password", "required"),
        "any.required": getValidationMessage("password", "required"),
      }),
  }),

  // 🔑 User login
  login: Joi.object({
    email: Joi.string()
      .email()
      .lowercase()
      .trim()
      .required()
      .messages({
        "string.email": getValidationMessage("email", "invalid"),
        "string.empty": getValidationMessage("email", "required"),
        "any.required": getValidationMessage("email", "required"),
      }),
    password: Joi.string()
      .required()
      .messages({
        "string.empty": getValidationMessage("password", "required"),
        "any.required": getValidationMessage("password", "required"),
      }),
  }),

  // 🔄 Refresh token
  refreshToken: Joi.object({
    refreshToken: Joi.string()
      .trim()
      .min(VALIDATION_RULES.REFRESH_TOKEN.MIN_LENGTH)
      .max(VALIDATION_RULES.REFRESH_TOKEN.MAX_LENGTH)
      .required()
      .messages({
        "string.empty": getValidationMessage("refreshToken", "required"),
        "string.min": getValidationMessage("refreshToken", "invalid"),
        "string.max": getValidationMessage("refreshToken", "invalid"),
        "any.required": getValidationMessage("refreshToken", "required"),
      }),
  }),

  // 🔍 Google OAuth
  googleAuth: Joi.object({
    googleToken: Joi.string()
      .trim()
      .min(VALIDATION_RULES.GOOGLE_TOKEN.MIN_LENGTH)
      .max(VALIDATION_RULES.GOOGLE_TOKEN.MAX_LENGTH)
      .required()
      .messages({
        "string.empty": getValidationMessage("googleToken", "required"),
        "string.min": getValidationMessage("googleToken", "invalid"),
        "string.max": getValidationMessage("googleToken", "invalid"),
        "any.required": getValidationMessage("googleToken", "required"),
      }),
  }),

  // 👤 Profile update
  updateProfile: Joi.object({
    name: Joi.string()
      .trim()
      .min(VALIDATION_RULES.NAME.MIN_LENGTH)
      .max(VALIDATION_RULES.NAME.MAX_LENGTH)
      .pattern(VALIDATION_RULES.NAME.PATTERN)
      .optional()
      .messages({
        "string.min": getValidationMessage("name", "minLength", "FR", {
          min: VALIDATION_RULES.NAME.MIN_LENGTH,
        }),
        "string.max": getValidationMessage("name", "maxLength", "FR", {
          max: VALIDATION_RULES.NAME.MAX_LENGTH,
        }),
        "string.pattern.base": getValidationMessage("name", "pattern"),
      }),
    email: Joi.string()
      .email()
      .lowercase()
      .trim()
      .max(VALIDATION_RULES.EMAIL.MAX_LENGTH)
      .pattern(VALIDATION_RULES.EMAIL.PATTERN)
      .optional()
      .messages({
        "string.email": getValidationMessage("email", "invalid"),
        "string.max": getValidationMessage("email", "maxLength", "FR", {
          max: VALIDATION_RULES.EMAIL.MAX_LENGTH,
        }),
        "string.pattern.base": getValidationMessage("email", "invalid"),
      }),
    currentPassword: Joi.string()
      .when("newPassword", {
        is: Joi.exist(),
        then: Joi.required(),
        otherwise: Joi.optional(),
      })
      .messages({
        "any.required": getValidationMessage("currentPassword", "required"),
      }),
    newPassword: Joi.string()
      .min(VALIDATION_RULES.PASSWORD.MIN_LENGTH)
      .max(VALIDATION_RULES.PASSWORD.MAX_LENGTH)
      .pattern(VALIDATION_RULES.PASSWORD.PATTERN)
      .optional()
      .messages({
        "string.min": getValidationMessage("newPassword", "minLength", "FR", {
          min: VALIDATION_RULES.PASSWORD.MIN_LENGTH,
        }),
        "string.max": getValidationMessage("newPassword", "maxLength", "FR", {
          max: VALIDATION_RULES.PASSWORD.MAX_LENGTH,
        }),
        "string.pattern.base": getValidationMessage("newPassword", "pattern"),
      }),
  })
    .min(1)
    .messages({
      "object.min": "Au moins un champ doit être fourni pour la mise à jour",
    }),

  // 🔄 Forgot password
  forgotPassword: Joi.object({
    email: Joi.string()
      .email()
      .lowercase()
      .trim()
      .required()
      .messages({
        "string.email": getValidationMessage("email", "invalid"),
        "string.empty": getValidationMessage("email", "required"),
        "any.required": getValidationMessage("email", "required"),
      }),
  }),

  // 🔒 Reset password
  resetPassword: Joi.object({
    token: Joi.string()
      .trim()
      .min(VALIDATION_RULES.PASSWORD_RESET_TOKEN.MIN_LENGTH)
      .max(VALIDATION_RULES.PASSWORD_RESET_TOKEN.MAX_LENGTH)
      .required()
      .messages({
        "string.empty": getValidationMessage("token", "required"),
        "string.min": getValidationMessage("token", "invalid"),
        "string.max": getValidationMessage("token", "invalid"),
        "any.required": getValidationMessage("token", "required"),
      }),
    password: Joi.string()
      .min(VALIDATION_RULES.PASSWORD.MIN_LENGTH)
      .max(VALIDATION_RULES.PASSWORD.MAX_LENGTH)
      .pattern(VALIDATION_RULES.PASSWORD.PATTERN)
      .required()
      .messages({
        "string.min": getValidationMessage("newPassword", "minLength", "FR", {
          min: VALIDATION_RULES.PASSWORD.MIN_LENGTH,
        }),
        "string.max": getValidationMessage("newPassword", "maxLength", "FR", {
          max: VALIDATION_RULES.PASSWORD.MAX_LENGTH,
        }),
        "string.pattern.base": getValidationMessage("newPassword", "pattern"),
        "string.empty": getValidationMessage("newPassword", "required"),
        "any.required": getValidationMessage("newPassword", "required"),
      }),
  }),

  // ⚙️ User preferences
  updatePreferences: Joi.object({
    theme: Joi.string()
      .valid(...VALIDATION_RULES.PREFERENCES.THEME.ALLOWED_VALUES)
      .optional()
      .messages({
        "any.only": getValidationMessage("theme", "invalid"),
      }),
    language: Joi.string()
      .valid(...VALIDATION_RULES.PREFERENCES.LANGUAGE.ALLOWED_VALUES)
      .optional()
      .messages({
        "any.only": getValidationMessage("language", "invalid"),
      }),
    defaultTone: Joi.string()
      .valid(...VALIDATION_RULES.PREFERENCES.DEFAULT_TONE.ALLOWED_VALUES)
      .optional()
      .messages({
        "any.only": getValidationMessage("defaultTone", "invalid"),
      }),
    defaultLength: Joi.string()
      .valid(...VALIDATION_RULES.PREFERENCES.DEFAULT_LENGTH.ALLOWED_VALUES)
      .optional()
      .messages({
        "any.only": getValidationMessage("defaultLength", "invalid"),
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

  // 📧 Add email account
  addEmailAccount: Joi.object({
    email: Joi.string()
      .email()
      .lowercase()
      .trim()
      .required()
      .messages({
        "string.email": getValidationMessage("email", "invalid"),
        "string.empty": getValidationMessage("email", "required"),
        "any.required": getValidationMessage("email", "required"),
      }),
    provider: Joi.string()
      .valid(...VALIDATION_RULES.EMAIL_ACCOUNT.PROVIDER.ALLOWED_VALUES)
      .default("gmail")
      .messages({
        "any.only": getValidationMessage("provider", "invalid"),
      }),
    displayName: Joi.string()
      .trim()
      .max(VALIDATION_RULES.EMAIL_ACCOUNT.DISPLAY_NAME.MAX_LENGTH)
      .optional()
      .messages({
        "string.max": getValidationMessage("displayName", "maxLength", "FR", {
          max: VALIDATION_RULES.EMAIL_ACCOUNT.DISPLAY_NAME.MAX_LENGTH,
        }),
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
      .pattern(VALIDATION_RULES.OBJECT_ID.PATTERN)
      .required()
      .messages({
        "string.pattern.base": getValidationMessage("userId", "invalid"),
        "any.required": getValidationMessage("userId", "required"),
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
