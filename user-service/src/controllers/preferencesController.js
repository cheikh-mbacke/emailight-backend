const PreferencesService = require("../services/preferencesService");

/**
 * ⚙️ Controller for managing user preferences
 */
class PreferencesController {
  /**
   * Retrieve user preferences
   */
  static async getPreferences(request, reply) {
    try {
      const userId = request.user._id;

      const result = await PreferencesService.getUserPreferences(userId);

      return reply.success(result, "Préférences récupérées avec succès");
    } catch (error) {
      if (error.statusCode) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "GET_PREFERENCES_ERROR",
        });
      }

      return reply
        .code(500)
        .error("Erreur lors de la récupération des préférences");
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
      if (error.statusCode) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "UPDATE_PREFERENCES_ERROR",
          details: error.details || null,
        });
      }

      return reply
        .code(500)
        .error("Erreur lors de la mise à jour des préférences");
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
      if (error.statusCode) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "RESET_PREFERENCES_ERROR",
        });
      }

      return reply
        .code(500)
        .error("Erreur lors de la réinitialisation des préférences");
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
      if (error.statusCode) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "UPDATE_THEME_ERROR",
          details: error.details || null,
        });
      }

      return reply.code(500).error("Erreur lors de la mise à jour du thème");
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
      if (error.statusCode) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "UPDATE_LANGUAGE_ERROR",
          details: error.details || null,
        });
      }

      return reply
        .code(500)
        .error("Erreur lors de la mise à jour de la langue");
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
      if (error.statusCode) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "UPDATE_EMAIL_DEFAULTS_ERROR",
          details: error.details || null,
        });
      }

      return reply
        .code(500)
        .error("Erreur lors de la mise à jour des préférences email");
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
      if (error.statusCode) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "UPDATE_NOTIFICATIONS_ERROR",
          details: error.details || null,
        });
      }

      return reply
        .code(500)
        .error("Erreur lors de la mise à jour des notifications");
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
      if (error.statusCode) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "EXPORT_PREFERENCES_ERROR",
        });
      }

      return reply.code(500).error("Erreur lors de l'export des préférences");
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
      if (error.statusCode) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "IMPORT_PREFERENCES_ERROR",
          details: error.details || null,
        });
      }

      return reply.code(500).error("Erreur lors de l'import des préférences");
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

      return reply.success(
        validationResult,
        validationResult.isValid
          ? "Préférences valides"
          : "Préférences invalides"
      );
    } catch (error) {
      return reply
        .code(500)
        .error("Erreur lors de la validation des préférences");
    }
  }
}

module.exports = PreferencesController;
