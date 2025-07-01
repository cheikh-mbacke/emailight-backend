import PreferencesService from "../services/preferencesService.js";

/**
 * ⚙️ Controller for managing user preferences
 */
class PreferencesController {
  // ✅ Injection du logger
  static setLogger(injectedLogger) {
    this.logger = injectedLogger;
  }

  /**
   * Retrieve user preferences
   */
  static async getPreferences(request, reply) {
    try {
      const userId = request.user._id;

      const result = await PreferencesService.getUserPreferences(userId);

      // 🔍 DEBUG: Vérifier le logger avant de l'utiliser
      console.log("=== LOGGER DEBUG ===");
      console.log("this.logger exists:", !!this.logger);
      console.log("this.logger type:", typeof this.logger);
      if (this.logger) {
        console.log("this.logger keys:", Object.keys(this.logger));
      }
      console.log("=== END LOGGER DEBUG ===");

      // 🔧 FIX: Utiliser le logger seulement s'il existe
      if (this.logger && this.logger.user) {
        this.logger.user(
          "Préférences récupérées",
          {
            userId: userId.toString(),
          },
          {
            userId: userId.toString(),
            action: "preferences_retrieved",
          }
        );
      } else {
        console.log("⚠️ Logger non disponible, skipping log");
      }

      return reply.success(result, "Préférences récupérées avec succès");
    } catch (error) {
      console.log("=== ERROR CAUGHT IN CONTROLLER ===");
      console.log("Error message:", error.message);
      console.log("Error isOperational:", error.isOperational);
      console.log("Error statusCode:", error.statusCode);

      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "GET_PREFERENCES_ERROR",
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  static async updatePreferences(request, reply) {
    try {
      const userId = request.user._id;
      const updates = request.body;

      const result = await PreferencesService.updateUserPreferences(
        userId,
        updates
      );

      return reply.success(result, "Préférences mises à jour avec succès");
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "UPDATE_PREFERENCES_ERROR",
          details: error.details || null,
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * Reset preferences to default values
   */
  static async resetPreferences(request, reply) {
    try {
      const userId = request.user._id;

      const result = await PreferencesService.resetUserPreferences(userId);

      return reply.success(result, "Préférences réinitialisées avec succès");
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "RESET_PREFERENCES_ERROR",
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * Update theme preference only
   */
  static async updateTheme(request, reply) {
    try {
      const userId = request.user._id;
      const { theme } = request.body;

      const result = await PreferencesService.updateSpecificPreference(
        userId,
        "theme",
        theme
      );

      return reply.success(result, "Thème mis à jour avec succès");
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "UPDATE_THEME_ERROR",
          details: error.details || null,
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * Update language preference only
   */
  static async updateLanguage(request, reply) {
    try {
      const userId = request.user._id;
      const { language } = request.body;

      const result = await PreferencesService.updateSpecificPreference(
        userId,
        "language",
        language
      );

      return reply.success(result, "Langue mise à jour avec succès");
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "UPDATE_LANGUAGE_ERROR",
          details: error.details || null,
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * Update default email-related preferences (tone, length, emoji)
   */
  static async updateEmailDefaults(request, reply) {
    try {
      const userId = request.user._id;
      const updates = request.body;

      const result = await PreferencesService.updateUserPreferences(
        userId,
        updates
      );

      return reply.success(
        {
          emailDefaults: {
            defaultTone: result.preferences.defaultTone,
            defaultLength: result.preferences.defaultLength,
            defaultEmoji: result.preferences.defaultEmoji,
          },
          updatedFields: result.updatedFields,
        },
        "Préférences email mises à jour avec succès"
      );
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "UPDATE_EMAIL_DEFAULTS_ERROR",
          details: error.details || null,
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * Update notification preferences (email / marketing)
   */
  static async updateNotifications(request, reply) {
    try {
      const userId = request.user._id;
      const updates = request.body;

      const result = await PreferencesService.updateUserPreferences(
        userId,
        updates
      );

      return reply.success(
        {
          notifications: {
            emailNotifications: result.preferences.emailNotifications,
            marketingEmails: result.preferences.marketingEmails,
          },
          updatedFields: result.updatedFields,
        },
        "Préférences de notifications mises à jour avec succès"
      );
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "UPDATE_NOTIFICATIONS_ERROR",
          details: error.details || null,
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * Export user preferences (GDPR)
   */
  static async exportPreferences(request, reply) {
    try {
      const userId = request.user._id;

      const exportData = await PreferencesService.exportUserPreferences(userId);

      // Set headers for download
      const user = request.user;
      reply.header(
        "Content-Disposition",
        `attachment; filename="preferences-${user.email}-${new Date().toISOString().split("T")[0]}.json"`
      );
      reply.type("application/json");

      return exportData;
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "EXPORT_PREFERENCES_ERROR",
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * Import user preferences (can overwrite or merge)
   */
  static async importPreferences(request, reply) {
    try {
      const userId = request.user._id;
      const importData = request.body;

      const result = await PreferencesService.importUserPreferences(
        userId,
        importData
      );

      return reply.success(result, "Préférences importées avec succès");
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "IMPORT_PREFERENCES_ERROR",
          details: error.details || null,
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * Validate preferences without saving them
   */
  static async validatePreferences(request, reply) {
    try {
      const { preferences } = request.body;

      const validationResult =
        PreferencesService.validatePreferences(preferences);

      this.logger.user(
        "Validation des préférences effectuée",
        {
          isValid: validationResult.isValid,
          errorsCount: validationResult.errors.length,
        },
        {
          userId: request.user._id.toString(),
          action: "preferences_validated",
        }
      );

      return reply.success(
        validationResult,
        validationResult.isValid
          ? "Préférences valides"
          : "Préférences invalides"
      );
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "VALIDATE_PREFERENCES_ERROR",
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }
}

export default PreferencesController;
