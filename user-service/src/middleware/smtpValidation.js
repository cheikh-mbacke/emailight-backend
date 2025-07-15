// ============================================================================
// 📁 src/middleware/smtpValidation.js - Validation SMTP/IMAP COMPLÈTE
// ============================================================================

import Joi from "joi";

// ✅ Logger par défaut avec injection
let logger = {
  error: (msg, error, context) =>
    console.error(`❌ [SMTP_VALIDATION] ${msg}`, error || "", context || ""),
  debug: (msg, data, context) =>
    console.log(`🔍 [SMTP_VALIDATION] ${msg}`, data || "", context || ""),
  warn: (msg, data, context) =>
    console.warn(`⚠️ [SMTP_VALIDATION] ${msg}`, data || "", context || ""),
  info: (msg, data, context) =>
    console.log(`📡 [SMTP_VALIDATION] ${msg}`, data || "", context || ""),
};

/**
 * ✅ Injection du logger
 */
export const setLogger = (injectedLogger) => {
  logger = injectedLogger;
};

/**
 * 📧 Schémas de validation SMTP/IMAP
 */
export const smtpSchemas = {
  // Configuration SMTP complète
  smtpConfig: Joi.object({
    email: Joi.string().email().lowercase().trim().required().messages({
      "string.email": "Format d'email invalide",
      "string.empty": "L'email est requis",
      "any.required": "L'email est obligatoire",
    }),

    username: Joi.string().trim().min(1).max(255).required().messages({
      "string.empty": "Le nom d'utilisateur est requis",
      "string.min": "Le nom d'utilisateur ne peut pas être vide",
      "string.max": "Le nom d'utilisateur ne peut pas dépasser 255 caractères",
      "any.required": "Le nom d'utilisateur est obligatoire",
    }),

    password: Joi.string().min(1).max(1000).required().messages({
      "string.empty": "Le mot de passe est requis",
      "string.min": "Le mot de passe ne peut pas être vide",
      "string.max": "Le mot de passe ne peut pas dépasser 1000 caractères",
      "any.required": "Le mot de passe est obligatoire",
    }),

    displayName: Joi.string().trim().max(100).optional().messages({
      "string.max": "Le nom d'affichage ne peut pas dépasser 100 caractères",
    }),

    smtp: Joi.object({
      host: Joi.string().hostname().required().messages({
        "string.hostname": "Le serveur SMTP doit être un nom d'hôte valide",
        "string.empty": "Le serveur SMTP est requis",
        "any.required": "Le serveur SMTP est obligatoire",
      }),

      port: Joi.number().integer().min(1).max(65535).required().messages({
        "number.base": "Le port SMTP doit être un nombre",
        "number.integer": "Le port SMTP doit être un entier",
        "number.min": "Le port SMTP doit être au moins 1",
        "number.max": "Le port SMTP ne peut pas dépasser 65535",
        "any.required": "Le port SMTP est obligatoire",
      }),

      secure: Joi.boolean().optional().default(false).messages({
        "boolean.base": "Le paramètre 'secure' doit être true ou false",
      }),

      requireTLS: Joi.boolean().optional().default(true).messages({
        "boolean.base": "Le paramètre 'requireTLS' doit être true ou false",
      }),
    }).required(),

    imap: Joi.object({
      host: Joi.string().hostname().optional().messages({
        "string.hostname": "Le serveur IMAP doit être un nom d'hôte valide",
      }),

      port: Joi.number().integer().min(1).max(65535).optional().messages({
        "number.base": "Le port IMAP doit être un nombre",
        "number.integer": "Le port IMAP doit être un entier",
        "number.min": "Le port IMAP doit être au moins 1",
        "number.max": "Le port IMAP ne peut pas dépasser 65535",
      }),

      secure: Joi.boolean().optional().default(true).messages({
        "boolean.base": "Le paramètre 'secure' IMAP doit être true ou false",
      }),
    }).optional(),
  }),

  // Mise à jour SMTP (tous les champs optionnels)
  smtpUpdate: Joi.object({
    username: Joi.string().trim().min(1).max(255).optional().messages({
      "string.min": "Le nom d'utilisateur ne peut pas être vide",
      "string.max": "Le nom d'utilisateur ne peut pas dépasser 255 caractères",
    }),

    password: Joi.string().min(1).max(1000).optional().messages({
      "string.min": "Le mot de passe ne peut pas être vide",
      "string.max": "Le mot de passe ne peut pas dépasser 1000 caractères",
    }),

    displayName: Joi.string().trim().max(100).optional().messages({
      "string.max": "Le nom d'affichage ne peut pas dépasser 100 caractères",
    }),

    smtp: Joi.object({
      host: Joi.string().hostname().optional().messages({
        "string.hostname": "Le serveur SMTP doit être un nom d'hôte valide",
      }),

      port: Joi.number().integer().min(1).max(65535).optional().messages({
        "number.base": "Le port SMTP doit être un nombre",
        "number.integer": "Le port SMTP doit être un entier",
        "number.min": "Le port SMTP doit être au moins 1",
        "number.max": "Le port SMTP ne peut pas dépasser 65535",
      }),

      secure: Joi.boolean().optional(),
      requireTLS: Joi.boolean().optional(),
    }).optional(),

    imap: Joi.object({
      host: Joi.string().hostname().optional(),
      port: Joi.number().integer().min(1).max(65535).optional(),
      secure: Joi.boolean().optional(),
    }).optional(),
  })
    .min(1)
    .messages({
      "object.min": "Au moins un champ doit être fourni pour la mise à jour",
    }),

  // Détection automatique par email
  emailDetection: Joi.object({
    email: Joi.string().email().lowercase().trim().required().messages({
      "string.email": "Format d'email invalide",
      "string.empty": "L'email est requis pour la détection",
      "any.required": "L'email est obligatoire",
    }),
  }),

  // Test de connexion SMTP
  smtpTest: Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
    username: Joi.string().trim().min(1).max(255).required(),
    password: Joi.string().min(1).max(1000).required(),
    smtp: Joi.object({
      host: Joi.string().hostname().required(),
      port: Joi.number().integer().min(1).max(65535).required(),
      secure: Joi.boolean().optional().default(false),
      requireTLS: Joi.boolean().optional().default(true),
    }).required(),
    imap: Joi.object({
      host: Joi.string().hostname().optional(),
      port: Joi.number().integer().min(1).max(65535).optional(),
      secure: Joi.boolean().optional().default(true),
    }).optional(),
  }),
};

/**
 * 🏭 Factory pour créer des middlewares de validation SMTP
 */
const createSmtpValidationMiddleware = (schema, target = "body") => {
  return async (request, reply) => {
    try {
      let dataToValidate;

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

      logger.debug(
        "Validation SMTP en cours",
        {
          target,
          endpoint: `${request.method} ${request.url}`,
          dataKeys: Object.keys(dataToValidate || {}),
        },
        {
          action: "smtp_validation_start",
          endpoint: `${request.method} ${request.url}`,
          userId: request.user?._id?.toString(),
        }
      );

      // Validation Joi
      const { error, value } = schema.validate(dataToValidate, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });

      if (error) {
        const errors = error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
          value: detail.context?.value,
        }));

        logger.warn(
          "Échec de validation SMTP",
          {
            endpoint: `${request.method} ${request.url}`,
            errorsCount: errors.length,
            errors: errors.map((e) => e.field),
          },
          {
            action: "smtp_validation_failed",
            endpoint: `${request.method} ${request.url}`,
            userId: request.user?._id?.toString(),
          }
        );

        return reply.code(400).send({
          error: "Configuration SMTP invalide",
          message:
            "Les paramètres SMTP fournis ne respectent pas le format attendu",
          details: errors,
          code: "INVALID_SMTP_CONFIG",
        });
      }

      // Validation spécifique SMTP
      const smtpValidationResult = validateSmtpSpecificRules(value);
      if (!smtpValidationResult.isValid) {
        logger.warn(
          "Validation SMTP spécifique échouée",
          {
            endpoint: `${request.method} ${request.url}`,
            warnings: smtpValidationResult.warnings,
            errors: smtpValidationResult.errors,
          },
          {
            action: "smtp_specific_validation_failed",
            endpoint: `${request.method} ${request.url}`,
            userId: request.user?._id?.toString(),
          }
        );

        return reply.code(400).send({
          error: "Configuration SMTP non recommandée",
          message: "Certains paramètres SMTP peuvent causer des problèmes",
          details: smtpValidationResult.errors.concat(
            smtpValidationResult.warnings
          ),
          code: "SMTP_CONFIG_WARNING",
        });
      }

      logger.debug(
        "Validation SMTP réussie",
        {
          endpoint: `${request.method} ${request.url}`,
          validatedFields: Object.keys(value || {}),
          warnings: smtpValidationResult.warnings.length,
        },
        {
          action: "smtp_validation_success",
          endpoint: `${request.method} ${request.url}`,
          userId: request.user?._id?.toString(),
        }
      );

      // Remplacer les données par les valeurs validées
      if (target === "body") {
        request.body = value;
        request.smtpWarnings = smtpValidationResult.warnings;
      } else if (target === "query") {
        request.query = value;
      } else if (target === "params") {
        request.params = value;
      }
    } catch (validationError) {
      logger.error("Erreur système validation SMTP", validationError, {
        action: "smtp_validation_system_error",
        endpoint: `${request.method} ${request.url}`,
        target,
        errorType: validationError.name || "unknown",
        userId: request.user?._id?.toString(),
      });

      throw validationError;
    }
  };
};

/**
 * 🔍 Validation spécifique aux règles SMTP
 */
const validateSmtpSpecificRules = (smtpConfig) => {
  const warnings = [];
  const errors = [];

  // Vérifications spécifiques SMTP
  if (smtpConfig.smtp) {
    // Port 25 souvent bloqué
    if (smtpConfig.smtp.port === 25) {
      warnings.push({
        field: "smtp.port",
        message:
          "Le port 25 est souvent bloqué par les FAI, préférez le port 587",
        recommendation: "Utilisez le port 587 avec STARTTLS",
        severity: "warning",
      });
    }

    // Port 465 avec SSL
    if (smtpConfig.smtp.port === 465 && !smtpConfig.smtp.secure) {
      warnings.push({
        field: "smtp.secure",
        message: "Le port 465 nécessite généralement SSL (secure: true)",
        recommendation: "Activez secure: true pour le port 465",
        severity: "warning",
      });
    }

    // Port 587 avec TLS
    if (smtpConfig.smtp.port === 587 && smtpConfig.smtp.secure === true) {
      warnings.push({
        field: "smtp.secure",
        message: "Le port 587 utilise généralement STARTTLS (secure: false)",
        recommendation:
          "Utilisez secure: false et requireTLS: true pour le port 587",
        severity: "warning",
      });
    }

    // Vérification hostname
    if (smtpConfig.smtp.host && smtpConfig.smtp.host.includes("localhost")) {
      warnings.push({
        field: "smtp.host",
        message:
          "L'utilisation de localhost peut ne pas fonctionner en production",
        recommendation: "Utilisez l'adresse IP ou le nom d'hôte complet",
        severity: "warning",
      });
    }

    // Ports non sécurisés
    if (smtpConfig.smtp.port === 25 && !smtpConfig.smtp.requireTLS) {
      errors.push({
        field: "smtp",
        message:
          "Le port 25 sans TLS est fortement déconseillé pour la sécurité",
        recommendation: "Activez requireTLS ou utilisez un port sécurisé",
        severity: "error",
      });
    }
  }

  // Vérifications IMAP
  if (smtpConfig.imap && smtpConfig.imap.host) {
    if (smtpConfig.imap.port === 143 && smtpConfig.imap.secure === true) {
      warnings.push({
        field: "imap.secure",
        message: "Le port 143 utilise généralement STARTTLS (secure: false)",
        recommendation: "Utilisez le port 993 pour SSL ou le port 143 sans SSL",
        severity: "warning",
      });
    }

    if (smtpConfig.imap.port === 993 && smtpConfig.imap.secure === false) {
      warnings.push({
        field: "imap.secure",
        message: "Le port 993 nécessite généralement SSL (secure: true)",
        recommendation: "Activez secure: true pour le port 993",
        severity: "warning",
      });
    }
  }

  // Vérifications email/username
  if (smtpConfig.email && smtpConfig.username) {
    const emailDomain = smtpConfig.email.split("@")[1]?.toLowerCase();

    // Gmail avec mot de passe d'application
    if (
      emailDomain?.includes("gmail.com") &&
      !smtpConfig.username.includes("@")
    ) {
      warnings.push({
        field: "username",
        message:
          "Gmail nécessite généralement l'adresse email complète comme nom d'utilisateur",
        recommendation:
          "Utilisez votre adresse Gmail complète comme nom d'utilisateur",
        severity: "warning",
      });
    }

    // Yahoo avec mot de passe d'application
    if (emailDomain?.includes("yahoo.") && smtpConfig.password?.length < 16) {
      warnings.push({
        field: "password",
        message:
          "Yahoo Mail nécessite généralement un mot de passe d'application",
        recommendation:
          "Générez un mot de passe d'application dans les paramètres Yahoo",
        severity: "warning",
      });
    }

    // Outlook avec authentification moderne
    if (
      (emailDomain?.includes("outlook.") ||
        emailDomain?.includes("hotmail.")) &&
      smtpConfig.password?.length < 10
    ) {
      warnings.push({
        field: "password",
        message:
          "Outlook recommande l'utilisation de mots de passe d'application",
        recommendation:
          "Générez un mot de passe d'application pour plus de sécurité",
        severity: "info",
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * 📋 Middlewares pré-configurés
 */
export const validateSmtpConfig = createSmtpValidationMiddleware(
  smtpSchemas.smtpConfig
);
export const validateSmtpUpdate = createSmtpValidationMiddleware(
  smtpSchemas.smtpUpdate
);
export const validateEmailDetection = createSmtpValidationMiddleware(
  smtpSchemas.emailDetection
);
export const validateSmtpTest = createSmtpValidationMiddleware(
  smtpSchemas.smtpTest
);

/**
 * 🛡️ Middleware générique pour validation SMTP personnalisée
 */
export const validateSmtp = (schema, target = "body") => {
  return createSmtpValidationMiddleware(schema, target);
};

/**
 * 🔒 Middleware de sécurité pour credentials SMTP
 */
export const validateSmtpSecurity = async (request, reply) => {
  try {
    const smtpConfig = request.body;
    const securityIssues = [];
    const recommendations = [];

    // Vérifier les mots de passe faibles
    if (smtpConfig.password) {
      if (smtpConfig.password.length < 8) {
        securityIssues.push({
          field: "password",
          message: "Mot de passe trop court (minimum 8 caractères recommandé)",
          severity: "error",
        });
      }

      if (smtpConfig.password === smtpConfig.username) {
        securityIssues.push({
          field: "password",
          message:
            "Le mot de passe ne doit pas être identique au nom d'utilisateur",
          severity: "error",
        });
      }

      if (/^(password|123456|qwerty|admin)$/i.test(smtpConfig.password)) {
        securityIssues.push({
          field: "password",
          message: "Mot de passe trop commun et facilement devinable",
          severity: "error",
        });
      }

      // Vérifier la complexité
      if (
        !/[A-Z]/.test(smtpConfig.password) ||
        !/[0-9]/.test(smtpConfig.password)
      ) {
        recommendations.push({
          field: "password",
          message:
            "Utilisez un mot de passe avec majuscules et chiffres pour plus de sécurité",
          severity: "info",
        });
      }
    }

    // Recommandations par provider
    const emailDomain = smtpConfig.email?.split("@")[1]?.toLowerCase();

    if (emailDomain?.includes("gmail.com")) {
      recommendations.push({
        field: "general",
        message:
          "Gmail: Activez l'authentification à deux facteurs et utilisez un mot de passe d'application",
        severity: "info",
      });
    }

    if (
      emailDomain?.includes("outlook.") ||
      emailDomain?.includes("hotmail.")
    ) {
      recommendations.push({
        field: "general",
        message:
          "Outlook: Activez l'authentification à deux facteurs dans les paramètres de sécurité",
        severity: "info",
      });
    }

    // Vérifier la configuration TLS/SSL
    if (
      smtpConfig.smtp &&
      !smtpConfig.smtp.secure &&
      !smtpConfig.smtp.requireTLS
    ) {
      securityIssues.push({
        field: "smtp",
        message: "Connexion non sécurisée - activez SSL ou TLS",
        severity: "error",
      });
    }

    // Vérifier les ports sécurisés
    if (smtpConfig.smtp?.port === 25) {
      securityIssues.push({
        field: "smtp.port",
        message: "Le port 25 est déconseillé pour la sécurité",
        severity: "warning",
      });
    }

    if (securityIssues.length > 0) {
      logger.warn(
        "Problèmes de sécurité SMTP détectés",
        {
          endpoint: `${request.method} ${request.url}`,
          issuesCount: securityIssues.length,
          email: smtpConfig.email,
          issues: securityIssues.map((i) => i.field),
        },
        {
          action: "smtp_security_issues_detected",
          endpoint: `${request.method} ${request.url}`,
          userId: request.user?._id?.toString(),
        }
      );

      return reply.code(400).send({
        error: "Problèmes de sécurité détectés",
        message: "La configuration SMTP présente des risques de sécurité",
        securityIssues,
        recommendations,
        code: "SMTP_SECURITY_ISSUES",
      });
    }

    // Ajouter les recommandations à la requête pour info
    request.smtpSecurityRecommendations = recommendations;

    logger.debug(
      "Validation sécurité SMTP réussie",
      {
        endpoint: `${request.method} ${request.url}`,
        recommendationsCount: recommendations.length,
      },
      {
        action: "smtp_security_validation_success",
        endpoint: `${request.method} ${request.url}`,
        userId: request.user?._id?.toString(),
      }
    );
  } catch (error) {
    logger.error("Erreur validation sécurité SMTP", error, {
      action: "smtp_security_validation_error",
      endpoint: `${request.method} ${request.url}`,
      userId: request.user?._id?.toString(),
    });

    throw error;
  }
};

/**
 * 🧪 Middleware de validation pour les tests SMTP
 */
export const validateSmtpTestRequest = async (request, reply) => {
  try {
    const { timeout = 10000, skipImap = false } = request.query;

    // Valider les paramètres de test
    if (timeout && (timeout < 1000 || timeout > 30000)) {
      return reply.code(400).send({
        error: "Timeout invalide",
        message: "Le timeout doit être entre 1000ms et 30000ms",
        code: "INVALID_TIMEOUT",
      });
    }

    // Ajouter les paramètres de test à la requête
    request.testOptions = {
      timeout: parseInt(timeout),
      skipImap: skipImap === "true" || skipImap === true,
    };

    logger.debug(
      "Paramètres de test SMTP validés",
      {
        endpoint: `${request.method} ${request.url}`,
        timeout,
        skipImap,
      },
      {
        action: "smtp_test_params_validated",
        endpoint: `${request.method} ${request.url}`,
        userId: request.user?._id?.toString(),
      }
    );
  } catch (error) {
    logger.error("Erreur validation paramètres test SMTP", error, {
      action: "smtp_test_validation_error",
      endpoint: `${request.method} ${request.url}`,
      userId: request.user?._id?.toString(),
    });

    throw error;
  }
};

/**
 * 🔧 Middleware de validation pour la mise à jour des paramètres SMTP
 */
export const validateSmtpAccountUpdate = async (request, reply) => {
  try {
    const { accountId } = request.params;
    const updates = request.body;

    // Valider l'ID du compte
    if (!accountId || !/^[0-9a-fA-F]{24}$/.test(accountId)) {
      return reply.code(400).send({
        error: "ID de compte invalide",
        message: "L'ID du compte doit être un ObjectId MongoDB valide",
        code: "INVALID_ACCOUNT_ID",
      });
    }

    // Valider qu'au moins un champ est fourni
    if (!updates || Object.keys(updates).length === 0) {
      return reply.code(400).send({
        error: "Aucune mise à jour fournie",
        message: "Au moins un champ doit être modifié",
        code: "NO_UPDATES_PROVIDED",
      });
    }

    // Valider que les champs fournis sont autorisés
    const allowedFields = [
      "username",
      "password",
      "displayName",
      "smtp",
      "imap",
    ];
    const providedFields = Object.keys(updates);
    const invalidFields = providedFields.filter(
      (field) => !allowedFields.includes(field)
    );

    if (invalidFields.length > 0) {
      return reply.code(400).send({
        error: "Champs non autorisés",
        message: `Les champs suivants ne peuvent pas être modifiés: ${invalidFields.join(", ")}`,
        allowedFields,
        code: "INVALID_UPDATE_FIELDS",
      });
    }

    logger.debug(
      "Validation mise à jour SMTP réussie",
      {
        endpoint: `${request.method} ${request.url}`,
        accountId,
        updateFields: providedFields,
      },
      {
        action: "smtp_update_validation_success",
        endpoint: `${request.method} ${request.url}`,
        userId: request.user?._id?.toString(),
        accountId,
      }
    );
  } catch (error) {
    logger.error("Erreur validation mise à jour SMTP", error, {
      action: "smtp_update_validation_error",
      endpoint: `${request.method} ${request.url}`,
      userId: request.user?._id?.toString(),
    });

    throw error;
  }
};

/**
 * 📊 Obtenir un résumé des règles de validation SMTP
 */
export const getSmtpValidationRules = () => {
  return {
    email: {
      required: true,
      format: "email",
      description: "Adresse email valide",
    },
    username: {
      required: true,
      minLength: 1,
      maxLength: 255,
      description: "Nom d'utilisateur pour l'authentification",
    },
    password: {
      required: true,
      minLength: 1,
      maxLength: 1000,
      description: "Mot de passe (minimum 8 caractères recommandé)",
      security: {
        minRecommended: 8,
        shouldContain: ["uppercase", "number"],
        avoid: ["common passwords", "same as username"],
      },
    },
    smtp: {
      required: true,
      host: {
        required: true,
        format: "hostname",
        description: "Serveur SMTP valide",
      },
      port: {
        required: true,
        range: [1, 65535],
        recommended: [587, 465, 993],
        avoid: [25],
        description: "Port SMTP",
      },
      secure: {
        type: "boolean",
        default: false,
        description: "Connexion SSL/TLS directe",
      },
      requireTLS: {
        type: "boolean",
        default: true,
        description: "Exiger STARTTLS",
      },
    },
    imap: {
      required: false,
      host: {
        format: "hostname",
        description: "Serveur IMAP (optionnel)",
      },
      port: {
        range: [1, 65535],
        recommended: [993, 143],
        description: "Port IMAP",
      },
      secure: {
        type: "boolean",
        default: true,
        description: "Connexion SSL/TLS IMAP",
      },
    },
    providerRecommendations: {
      gmail: {
        username: "Utilisez l'adresse email complète",
        password: "Utilisez un mot de passe d'application",
        smtp: {
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          requireTLS: true,
        },
        imap: { host: "imap.gmail.com", port: 993, secure: true },
      },
      outlook: {
        username: "Utilisez l'adresse email complète",
        password: "Mot de passe habituel ou mot de passe d'application",
        smtp: {
          host: "smtp-mail.outlook.com",
          port: 587,
          secure: false,
          requireTLS: true,
        },
        imap: { host: "outlook.office365.com", port: 993, secure: true },
      },
      yahoo: {
        username: "Utilisez l'adresse email complète",
        password: "Mot de passe d'application obligatoire (16 caractères)",
        smtp: {
          host: "smtp.mail.yahoo.com",
          port: 587,
          secure: false,
          requireTLS: true,
        },
        imap: { host: "imap.mail.yahoo.com", port: 993, secure: true },
      },
    },
  };
};

/**
 * 🔍 Validation côté client (helper pour le frontend)
 */
export const validateSmtpConfigClient = (config) => {
  const errors = [];
  const warnings = [];

  // Validation basique côté client
  if (!config.email || !config.email.includes("@")) {
    errors.push("Email invalide");
  }

  if (!config.username || config.username.trim().length === 0) {
    errors.push("Nom d'utilisateur requis");
  }

  if (!config.password || config.password.length === 0) {
    errors.push("Mot de passe requis");
  }

  if (!config.smtp || !config.smtp.host) {
    errors.push("Serveur SMTP requis");
  }

  if (
    !config.smtp ||
    !config.smtp.port ||
    config.smtp.port < 1 ||
    config.smtp.port > 65535
  ) {
    errors.push("Port SMTP valide requis (1-65535)");
  }

  // Avertissements
  if (config.password && config.password.length < 8) {
    warnings.push("Mot de passe court (8+ caractères recommandé)");
  }

  if (config.smtp?.port === 25) {
    warnings.push("Port 25 souvent bloqué, préférez 587");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};
