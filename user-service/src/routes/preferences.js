const PreferencesController = require("../controllers/preferencesController");
const { authenticateToken } = require("../middleware/auth");
const { validateUpdatePreferences } = require("../middleware/validation");

/**
 * ⚙️ Fastify route plugin for managing user preferences
 */
async function preferencesRoutes(fastify, options) {
  // ============================================================================
  // 📖 GET USER PREFERENCES
  // ============================================================================
  fastify.get(
    "/",
    {
      preHandler: authenticateToken,
      schema: {
        tags: ["Preferences"],
        summary: "Récupérer les préférences utilisateur",
        security: [{ bearerAuth: [] }],
      },
    },
    PreferencesController.getPreferences
  );

  // ============================================================================
  // ✏️ UPDATE USER PREFERENCES (partial update)
  // ============================================================================
  fastify.patch(
    "/",
    {
      preHandler: [authenticateToken, validateUpdatePreferences],
      schema: {
        tags: ["Preferences"],
        summary: "Mettre à jour les préférences utilisateur",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          properties: {
            theme: {
              type: "string",
              enum: ["light", "dark", "auto"],
              description: "Thème de l'interface utilisateur",
            },
            language: {
              type: "string",
              enum: [
                "FR",
                "EN",
                "ES",
                "DE",
                "IT",
                "PT",
                "NL",
                "RU",
                "ZH",
                "JA",
              ],
              description: "Langue de l'interface et des emails",
            },
            defaultTone: {
              type: "string",
              enum: [
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
                "Joyeux",
              ],
              description: "Ton par défaut pour la reformulation d'emails",
            },
            defaultLength: {
              type: "string",
              enum: ["Court", "Moyen", "Long"],
              description: "Longueur par défaut des emails reformulés",
            },
            defaultEmoji: {
              type: "boolean",
              description: "Utiliser des emojis par défaut",
            },
            emailNotifications: {
              type: "boolean",
              description: "Recevoir des notifications par email",
            },
            marketingEmails: {
              type: "boolean",
              description: "Recevoir des emails marketing",
            },
            autoSaveDrafts: {
              type: "boolean",
              description: "Sauvegarder automatiquement les brouillons",
            },
          },
          additionalProperties: false,
        },
      },
    },
    PreferencesController.updatePreferences
  );

  // ============================================================================
  // 🔄 RESET PREFERENCES TO DEFAULT
  // ============================================================================
  fastify.post(
    "/reset",
    {
      preHandler: authenticateToken,
      schema: {
        tags: ["Preferences"],
        summary: "Réinitialiser les préférences aux valeurs par défaut",
        security: [{ bearerAuth: [] }],
      },
    },
    PreferencesController.resetPreferences
  );

  // ============================================================================
  // 🎨 UPDATE THEME ONLY
  // ============================================================================
  fastify.patch(
    "/theme",
    {
      preHandler: authenticateToken,
      schema: {
        tags: ["Preferences"],
        summary: "Mettre à jour uniquement le thème",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["theme"],
          properties: {
            theme: { type: "string", enum: ["light", "dark", "auto"] },
          },
          additionalProperties: false,
        },
      },
    },
    PreferencesController.updateTheme
  );

  // ============================================================================
  // 🌐 UPDATE LANGUAGE ONLY
  // ============================================================================
  fastify.patch(
    "/language",
    {
      preHandler: authenticateToken,
      schema: {
        tags: ["Preferences"],
        summary: "Mettre à jour uniquement la langue",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["language"],
          properties: {
            language: {
              type: "string",
              enum: [
                "FR",
                "EN",
                "ES",
                "DE",
                "IT",
                "PT",
                "NL",
                "RU",
                "ZH",
                "JA",
              ],
            },
          },
          additionalProperties: false,
        },
      },
    },
    PreferencesController.updateLanguage
  );

  // ============================================================================
  // 📧 UPDATE EMAIL DEFAULT PREFERENCES
  // ============================================================================
  fastify.patch(
    "/email-defaults",
    {
      preHandler: authenticateToken,
      schema: {
        tags: ["Preferences"],
        summary: "Mettre à jour les préférences par défaut pour les emails",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          properties: {
            defaultTone: {
              type: "string",
              enum: [
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
                "Joyeux",
              ],
            },
            defaultLength: { type: "string", enum: ["Court", "Moyen", "Long"] },
            defaultEmoji: { type: "boolean" },
          },
          additionalProperties: false,
          minProperties: 1,
        },
      },
    },
    PreferencesController.updateEmailDefaults
  );

  // ============================================================================
  // 🔔 UPDATE NOTIFICATION PREFERENCES
  // ============================================================================
  fastify.patch(
    "/notifications",
    {
      preHandler: authenticateToken,
      schema: {
        tags: ["Preferences"],
        summary: "Mettre à jour les préférences de notifications",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          properties: {
            emailNotifications: { type: "boolean" },
            marketingEmails: { type: "boolean" },
          },
          additionalProperties: false,
          minProperties: 1,
        },
      },
    },
    PreferencesController.updateNotifications
  );

  // ============================================================================
  // 📊 EXPORT USER PREFERENCES (GDPR)
  // ============================================================================
  fastify.get(
    "/export",
    {
      preHandler: authenticateToken,
      schema: {
        tags: ["Preferences"],
        summary: "Exporter les préférences utilisateur (RGPD)",
        security: [{ bearerAuth: [] }],
      },
    },
    PreferencesController.exportPreferences
  );

  // ============================================================================
  // 📥 IMPORT USER PREFERENCES
  // ============================================================================
  fastify.post(
    "/import",
    {
      preHandler: authenticateToken,
      schema: {
        tags: ["Preferences"],
        summary: "Importer des préférences utilisateur",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["preferences"],
          properties: {
            preferences: {
              type: "object",
              properties: {
                theme: { type: "string", enum: ["light", "dark", "auto"] },
                language: {
                  type: "string",
                  enum: [
                    "FR",
                    "EN",
                    "ES",
                    "DE",
                    "IT",
                    "PT",
                    "NL",
                    "RU",
                    "ZH",
                    "JA",
                  ],
                },
                defaultTone: { type: "string" },
                defaultLength: {
                  type: "string",
                  enum: ["Court", "Moyen", "Long"],
                },
                defaultEmoji: { type: "boolean" },
                emailNotifications: { type: "boolean" },
                marketingEmails: { type: "boolean" },
                autoSaveDrafts: { type: "boolean" },
              },
              additionalProperties: false,
            },
            overwrite: { type: "boolean", default: false },
          },
        },
      },
    },
    PreferencesController.importPreferences
  );

  // ============================================================================
  // 📋 VALIDATE A PREFERENCE OBJECT WITHOUT SAVING IT
  // ============================================================================
  fastify.post(
    "/validate",
    {
      preHandler: authenticateToken,
      schema: {
        tags: ["Preferences"],
        summary: "Valider un objet de préférences sans l'appliquer",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["preferences"],
          properties: {
            preferences: {
              type: "object",
              properties: {
                theme: { type: "string" },
                language: { type: "string" },
                defaultTone: { type: "string" },
                defaultLength: { type: "string" },
                defaultEmoji: { type: "boolean" },
                emailNotifications: { type: "boolean" },
                marketingEmails: { type: "boolean" },
                autoSaveDrafts: { type: "boolean" },
              },
            },
          },
        },
      },
    },
    PreferencesController.validatePreferences
  );
}

module.exports = preferencesRoutes;
