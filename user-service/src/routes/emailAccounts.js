// ============================================================================
// 📁 src/routes/emailAccounts.js - Routes complètes Email OAuth + SMTP
// ============================================================================

import EmailAccountsController from "../controllers/emailAccountsController.js";
import SmtpController from "../controllers/smtpController.js";
import { authenticateToken } from "../middleware/auth.js";
import {
  validateSmtpConfig,
  validateSmtpSecurity,
  validateSmtpUpdate,
} from "../middleware/smtpValidation.js";
import { validateAvatarUpload } from "../middleware/uploadValidation.js";

/**
 * 📧 Email Accounts routes plugin
 */
async function emailAccountsRoutes(fastify, options) {
  // ============================================================================
  // 📧 GET ALL EMAIL ACCOUNTS
  // ============================================================================
  fastify.get(
    "/",
    {
      preHandler: authenticateToken,
      schema: {
        tags: ["Email Accounts"],
        summary: "Liste des comptes email connectés",
        description:
          "Retourne tous les comptes email connectés à l'utilisateur",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            active: {
              type: "boolean",
              description: "Filtrer par statut actif/inactif",
            },
            provider: {
              type: "string",
              enum: ["gmail", "emailight", "yahoo", "smtp"],
              description: "Filtrer par provider",
            },
            // Paramètres de pagination
            page: {
              type: "integer",
              minimum: 1,
              default: 1,
              description: "Numéro de page (défaut: 1)",
            },
            limit: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 20,
              description: "Nombre d'éléments par page (défaut: 20, max: 100)",
            },
            sortBy: {
              type: "string",
              enum: ["createdAt", "lastUsed", "email", "provider"],
              default: "lastUsed",
              description: "Champ de tri",
            },
            sortOrder: {
              type: "string",
              enum: ["asc", "desc"],
              default: "desc",
              description: "Ordre de tri",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  accounts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        email: { type: "string" },
                        provider: { type: "string" },
                        displayName: { type: "string" },
                        isActive: { type: "boolean" },
                        healthStatus: { type: "string" },
                        lastUsed: { type: "string", format: "date-time" },
                        connectionType: { type: "string" },
                      },
                    },
                  },
                  total: { type: "number" },
                  summary: { type: "object" },
                },
              },
              message: { type: "string" },
            },
          },
        },
      },
    },
    EmailAccountsController.getEmailAccounts
  );

  // ============================================================================
  // 🗑️ DELETE EMAIL ACCOUNT
  // ============================================================================
  fastify.delete(
    "/:accountId",
    {
      preHandler: authenticateToken,
      schema: {
        tags: ["Email Accounts"],
        summary: "Supprimer un compte email",
        description: "Déconnecte et supprime définitivement un compte email",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["accountId"],
          properties: {
            accountId: {
              type: "string",
              pattern: "^[0-9a-fA-F]{24}$",
              description: "ID MongoDB du compte à supprimer",
            },
          },
        },
      },
    },
    EmailAccountsController.disconnectEmailAccount
  );

  // ============================================================================
  // 🔄 REFRESH EMAIL ACCOUNT TOKENS
  // ============================================================================
  fastify.post(
    "/:accountId/refresh",
    {
      preHandler: authenticateToken,
      schema: {
        tags: ["Email Accounts"],
        summary: "Rafraîchir les tokens OAuth",
        description: "Rafraîchit les tokens OAuth expirés d'un compte",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["accountId"],
          properties: {
            accountId: {
              type: "string",
              pattern: "^[0-9a-fA-F]{24}$",
            },
          },
        },
      },
    },
    EmailAccountsController.refreshEmailAccountTokens
  );



  // ============================================================================
  // 📧 OAUTH GMAIL - GÉNÉRATION URL D'AUTORISATION
  // ============================================================================
  fastify.get(
    "/oauth/gmail/auth-url",
    {
      preHandler: authenticateToken,
      schema: {
        tags: ["Email Accounts"],
        summary: "Générer l'URL d'autorisation Gmail OAuth",
        description: "Retourne l'URL pour connecter un compte Gmail via OAuth2",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  authUrl: { type: "string" },
                  state: { type: "string" },
                  scopes: { type: "array", items: { type: "string" } },
                },
              },
              message: { type: "string" },
            },
          },
        },
      },
    },
    EmailAccountsController.generateGmailAuthUrl
  );

  // ============================================================================
  // 📧 OAUTH GMAIL - CONNEXION AVEC CODE
  // ============================================================================
  fastify.post(
    "/oauth/gmail/connect",
    {
      preHandler: authenticateToken,
      schema: {
        tags: ["Email Accounts"],
        summary: "Connecter un compte Gmail via OAuth",
        description:
          "Connecte un compte Gmail en utilisant le code d'autorisation OAuth2",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["code"],
          properties: {
            code: {
              type: "string",
              description: "Code d'autorisation OAuth2 retourné par Google",
            },
            state: {
              type: "string",
              description: "Paramètre state pour validation (optionnel)",
            },
          },
          additionalProperties: false,
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  account: { type: "object" },
                  connected: { type: "boolean" },
                  connectedAt: { type: "string", format: "date-time" },
                },
              },
              message: { type: "string" },
            },
          },
        },
      },
    },
    EmailAccountsController.connectGmailAccount
  );



  // ============================================================================
  // 📧 SMTP ACCOUNT CREATION - POST /smtp
  // ============================================================================
  fastify.post(
    "/smtp",
    {
      preHandler: [authenticateToken, validateSmtpConfig, validateSmtpSecurity],
      schema: {
        tags: ["Email Accounts"],
        summary: "Configurer un compte SMTP/IMAP",
        description:
          "Configure et sauvegarde un compte email via SMTP/IMAP avec chiffrement des credentials",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["email", "username", "password", "smtp"],
          properties: {
            email: {
              type: "string",
              format: "email",
              description: "Adresse email du compte",
            },
            username: {
              type: "string",
              description: "Nom d'utilisateur pour l'authentification",
            },
            password: {
              type: "string",
              description: "Mot de passe pour l'authentification",
            },
            displayName: {
              type: "string",
              description: "Nom d'affichage personnalisé",
            },
            smtp: {
              type: "object",
              required: ["host", "port"],
              properties: {
                host: { type: "string", description: "Serveur SMTP" },
                port: { type: "integer", minimum: 1, maximum: 65535 },
                secure: { type: "boolean", description: "Utiliser SSL/TLS" },
                requireTLS: { type: "boolean", description: "Exiger TLS" },
              },
            },
            imap: {
              type: "object",
              properties: {
                host: {
                  type: "string",
                  description: "Serveur IMAP (optionnel)",
                },
                port: { type: "integer", minimum: 1, maximum: 65535 },
                secure: { type: "boolean", description: "Utiliser SSL/TLS" },
              },
            },
          },
          additionalProperties: false,
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  account: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      email: { type: "string" },
                      provider: { type: "string" },
                      connectionType: { type: "string" },
                      displayName: { type: "string" },
                      isActive: { type: "boolean" },
                    },
                  },
                  connected: { type: "boolean" },
                  connectedAt: { type: "string", format: "date-time" },
                  testResults: { type: "object" },
                },
              },
              message: { type: "string" },
            },
          },
        },
      },
    },
    SmtpController.configureSmtpAccount
  );

  // ============================================================================
  // 🧪 SMTP CONNECTION TEST - Tester avant sauvegarde
  // ============================================================================
  fastify.post(
    "/smtp/test",
    {
      preHandler: [authenticateToken, validateSmtpConfig],
      schema: {
        tags: ["Email Accounts"],
        summary: "Tester une configuration SMTP sans la sauvegarder",
        description: "Teste les connexions SMTP et IMAP sans créer le compte",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["email", "username", "password", "smtp"],
          properties: {
            email: {
              type: "string",
              format: "email",
              description: "Adresse email du compte",
            },
            username: {
              type: "string",
              description: "Nom d'utilisateur pour l'authentification",
            },
            password: {
              type: "string",
              description: "Mot de passe pour l'authentification",
            },
            smtp: {
              type: "object",
              required: ["host", "port"],
              properties: {
                host: { type: "string", description: "Serveur SMTP" },
                port: { type: "integer", minimum: 1, maximum: 65535 },
                secure: { type: "boolean", description: "Utiliser SSL/TLS" },
                requireTLS: { type: "boolean", description: "Exiger TLS" },
              },
            },
            imap: {
              type: "object",
              properties: {
                host: { type: "string", description: "Serveur IMAP" },
                port: { type: "integer", minimum: 1, maximum: 65535 },
                secure: { type: "boolean", description: "Utiliser SSL/TLS" },
              },
            },
          },
          additionalProperties: false,
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  smtp: { type: "object" },
                  imap: { type: "object" },
                  overallSuccess: { type: "boolean" },
                  recommendations: { type: "array", items: { type: "string" } },
                },
              },
              message: { type: "string" },
            },
          },
        },
      },
    },
    SmtpController.testSmtpConnection
  );

  // ============================================================================
  // 🔧 SMTP PROVIDERS - Configurations pré-définies
  // ============================================================================
  fastify.get(
    "/smtp/providers",
    {
      preHandler: authenticateToken,
      schema: {
        tags: ["Email Accounts"],
        summary: "Obtenir les configurations SMTP/IMAP des providers",
        description:
          "Retourne les configurations pré-définies pour Gmail, Yahoo et autres",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  providers: {
                    type: "object",
                    additionalProperties: {
                      type: "object",
                      properties: {
                        smtp: { type: "object" },
                        imap: { type: "object" },
                        displayName: { type: "string" },
                        authType: { type: "string" },
                      },
                    },
                  },
                },
              },
              message: { type: "string" },
            },
          },
        },
      },
    },
    SmtpController.getProviderConfigurations
  );

  // ============================================================================
  // 🔧 UPDATE SMTP ACCOUNT SETTINGS
  // ============================================================================
  fastify.patch(
    "/:accountId/smtp",
    {
      preHandler: [authenticateToken, validateSmtpUpdate],
      schema: {
        tags: ["Email Accounts"],
        summary: "Mettre à jour un compte SMTP",
        description: "Met à jour les paramètres d'un compte SMTP existant",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["accountId"],
          properties: {
            accountId: {
              type: "string",
              pattern: "^[0-9a-fA-F]{24}$",
            },
          },
        },
        body: {
          type: "object",
          properties: {
            username: { type: "string" },
            password: { type: "string" },
            displayName: { type: "string" },
            smtp: {
              type: "object",
              properties: {
                host: { type: "string" },
                port: { type: "integer", minimum: 1, maximum: 65535 },
                secure: { type: "boolean" },
                requireTLS: { type: "boolean" },
              },
            },
            imap: {
              type: "object",
              properties: {
                host: { type: "string" },
                port: { type: "integer", minimum: 1, maximum: 65535 },
                secure: { type: "boolean" },
              },
            },
          },
          additionalProperties: false,
          minProperties: 1,
        },
      },
    },
    SmtpController.updateSmtpAccount
  );

  // ============================================================================
  // 🧪 TEST EXISTING SMTP ACCOUNT
  // ============================================================================
  fastify.post(
    "/:accountId/smtp/test",
    {
      preHandler: authenticateToken,
      schema: {
        tags: ["Email Accounts"],
        summary: "Tester un compte SMTP existant",
        description: "Teste la connexion d'un compte SMTP déjà configuré",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["accountId"],
          properties: {
            accountId: {
              type: "string",
              pattern: "^[0-9a-fA-F]{24}$",
            },
          },
        },
      },
    },
    SmtpController.testExistingSmtpAccount
  );

  // ============================================================================
  // 📊 GET DETAILED ACCOUNT INFO
  // ============================================================================
  fastify.get(
    "/:accountId/details",
    {
      preHandler: authenticateToken,
      schema: {
        tags: ["Email Accounts"],
        summary: "Informations détaillées d'un compte",
        description:
          "Retourne les informations détaillées et le status d'un compte",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["accountId"],
          properties: {
            accountId: {
              type: "string",
              pattern: "^[0-9a-fA-F]{24}$",
            },
          },
        },
      },
    },
    EmailAccountsController.getDetailedEmailAccountInfo
  );

  // ============================================================================
  // ⚙️ UPDATE ACCOUNT SETTINGS
  // ============================================================================
  fastify.patch(
    "/:accountId/settings",
    {
      preHandler: authenticateToken,
      schema: {
        tags: ["Email Accounts"],
        summary: "Mettre à jour les paramètres d'un compte",
        description: "Met à jour les paramètres généraux d'un compte email",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["accountId"],
          properties: {
            accountId: {
              type: "string",
              pattern: "^[0-9a-fA-F]{24}$",
            },
          },
        },
        body: {
          type: "object",
          properties: {
            displayName: { type: "string", maxLength: 100 },
            isActive: { type: "boolean" },
            settings: {
              type: "object",
              properties: {
                defaultSignature: { type: "string" },
                autoReply: { type: "boolean" },
                allowedAliases: { type: "array", items: { type: "string" } },
              },
            },
          },
          additionalProperties: false,
          minProperties: 1,
        },
      },
    },
    EmailAccountsController.updateEmailAccountSettings
  );

  // ============================================================================
  // 📊 TOKEN REFRESH STATISTICS
  // ============================================================================
  fastify.get(
    "/refresh-stats",
    {
      preHandler: authenticateToken,
      schema: {
        tags: ["Email Accounts"],
        summary: "Statistiques de refresh des tokens",
        description:
          "Retourne les statistiques sur le refresh automatique des tokens",
        security: [{ bearerAuth: [] }],
      },
    },
    EmailAccountsController.getTokenRefreshStats
  );

  // ============================================================================
  // 🧹 CLEANUP FAILED ACCOUNTS
  // ============================================================================
  fastify.post(
    "/cleanup-failed",
    {
      preHandler: authenticateToken,
      schema: {
        tags: ["Email Accounts"],
        summary: "Nettoyer les comptes en erreur",
        description:
          "Désactive automatiquement les comptes avec trop d'erreurs",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            maxErrors: {
              type: "integer",
              minimum: 5,
              maximum: 50,
              default: 10,
              description: "Nombre max d'erreurs avant désactivation",
            },
          },
        },
      },
    },
    EmailAccountsController.manualCleanupFailedAccounts
  );

  // ============================================================================
  // 🔄 FORCE REFRESH ALL USER TOKENS
  // ============================================================================
  fastify.post(
    "/force-refresh-all",
    {
      preHandler: authenticateToken,
      schema: {
        tags: ["Email Accounts"],
        summary: "Forcer le refresh de tous les tokens",
        description:
          "Force le rafraîchissement de tous les tokens OAuth de l'utilisateur",
        security: [{ bearerAuth: [] }],
      },
    },
    EmailAccountsController.forceRefreshAllUserTokens
  );
}

export default emailAccountsRoutes;
