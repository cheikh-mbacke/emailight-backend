// ============================================================================
// 📁 src/services/preferencesService.js - User preferences management service
// ============================================================================

const User = require("../models/User");
const { logger } = require("../utils/logger");

/**
 * ⚙️ User Preferences Service
 */
class PreferencesService {
  /**
   * Return the default preference values
   */
  static getDefaultPreferences() {
    return {
      theme: "auto",
      language: "FR",
      defaultTone: "Professionnel",
      defaultLength: "Moyen",
      defaultEmoji: false,
      emailNotifications: true,
      marketingEmails: false,
      autoSaveDrafts: true,
    };
  }

  /**
   * Retrieve preferences for a specific user
   */
  static async getUserPreferences(userId) {
    try {
      const user = await User.findById(userId).select("preferences");

      if (!user) {
        const error = new Error("Utilisateur introuvable");
        error.statusCode = 404;
        error.code = "USER_NOT_FOUND";
        throw error;
      }

      return {
        preferences: user.preferences,
        defaultValues: this.getDefaultPreferences(),
      };
    } catch (error) {
      if (error.statusCode) throw error;

      logger.error("Erreur lors de la récupération des préférences", error, {
        action: "get_preferences_failed",
        userId: userId?.toString(),
      });

      const serviceError = new Error(
        "Erreur lors de la récupération des préférences"
      );
      serviceError.statusCode = 500;
      throw serviceError;
    }
  }

  /**
   * Update user preferences with validation
   */
  static async updateUserPreferences(userId, updates) {
    try {
      // Validate preference input
      const validationResult = this.validatePreferences(updates);
      if (!validationResult.isValid) {
        const error = new Error("Données de préférences invalides");
        error.statusCode = 400;
        error.code = "INVALID_PREFERENCES";
        error.details = validationResult.errors;
        throw error;
      }

      // Format update query using dot notation
      const updateQuery = {};
      Object.keys(updates).forEach((key) => {
        updateQuery[`preferences.${key}`] = updates[key];
      });

      // Apply update
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateQuery },
        {
          new: true,
          runValidators: true,
          select: "preferences email name",
        }
      );

      if (!user) {
        const error = new Error("Utilisateur introuvable");
        error.statusCode = 404;
        throw error;
      }

      logger.user(
        "Préférences mises à jour",
        {
          updatedFields: Object.keys(updates),
          preferences: updates,
        },
        {
          userId: userId.toString(),
          email: user.email,
          action: "preferences_updated",
        }
      );

      return {
        preferences: user.preferences,
        updatedFields: Object.keys(updates),
        updatedAt: new Date(),
      };
    } catch (error) {
      if (error.statusCode) throw error;

      logger.error("Erreur lors de la mise à jour des préférences", error, {
        action: "update_preferences_failed",
        userId: userId?.toString(),
      });

      const serviceError = new Error(
        "Erreur lors de la mise à jour des préférences"
      );
      serviceError.statusCode = 500;
      throw serviceError;
    }
  }

  /**
   * Reset user preferences to default values
   */
  static async resetUserPreferences(userId) {
    try {
      const defaultPreferences = this.getDefaultPreferences();

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { preferences: defaultPreferences } },
        {
          new: true,
          runValidators: true,
          select: "preferences email",
        }
      );

      if (!user) {
        const error = new Error("Utilisateur introuvable");
        error.statusCode = 404;
        throw error;
      }

      logger.user(
        "Préférences réinitialisées",
        {
          resetTo: defaultPreferences,
        },
        {
          userId: userId.toString(),
          email: user.email,
          action: "preferences_reset",
        }
      );

      return {
        preferences: user.preferences,
        resetAt: new Date(),
      };
    } catch (error) {
      if (error.statusCode) throw error;

      logger.error(
        "Erreur lors de la réinitialisation des préférences",
        error,
        {
          action: "reset_preferences_failed",
          userId: userId?.toString(),
        }
      );

      const serviceError = new Error(
        "Erreur lors de la réinitialisation des préférences"
      );
      serviceError.statusCode = 500;
      throw serviceError;
    }
  }

  /**
   * Export preferences for GDPR or user download
   */
  static async exportUserPreferences(userId) {
    try {
      const user = await User.findById(userId).select(
        "preferences email name createdAt"
      );

      if (!user) {
        const error = new Error("Utilisateur introuvable");
        error.statusCode = 404;
        throw error;
      }

      const exportData = {
        user: {
          email: user.email,
          name: user.name,
          accountCreated: user.createdAt,
        },
        preferences: user.preferences,
        exportedAt: new Date().toISOString(),
        exportVersion: "1.0",
      };

      logger.user(
        "Préférences exportées",
        {
          exportSize: JSON.stringify(exportData).length,
        },
        {
          userId: userId.toString(),
          email: user.email,
          action: "preferences_exported",
        }
      );

      return exportData;
    } catch (error) {
      if (error.statusCode) throw error;

      logger.error("Erreur lors de l'export des préférences", error, {
        action: "export_preferences_failed",
        userId: userId?.toString(),
      });

      const serviceError = new Error("Erreur lors de l'export des préférences");
      serviceError.statusCode = 500;
      throw serviceError;
    }
  }

  /**
   * Import user preferences with optional overwrite
   */
  static async importUserPreferences(userId, importData) {
    try {
      const { preferences, overwrite = false } = importData;

      const validationResult = this.validatePreferences(preferences);
      if (!validationResult.isValid) {
        const error = new Error("Préférences importées invalides");
        error.statusCode = 400;
        error.code = "INVALID_IMPORT_DATA";
        error.details = validationResult.errors;
        throw error;
      }

      // Merge with current preferences if not overwriting
      let finalPreferences = preferences;

      if (!overwrite) {
        const currentUser = await User.findById(userId).select("preferences");
        finalPreferences = {
          ...currentUser.preferences.toObject(),
          ...preferences,
        };
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { preferences: finalPreferences } },
        {
          new: true,
          runValidators: true,
          select: "preferences email",
        }
      );

      if (!user) {
        const error = new Error("Utilisateur introuvable");
        error.statusCode = 404;
        throw error;
      }

      logger.user(
        "Préférences importées",
        {
          importedFields: Object.keys(preferences),
          overwrite,
        },
        {
          userId: userId.toString(),
          email: user.email,
          action: "preferences_imported",
        }
      );

      return {
        preferences: user.preferences,
        importedFields: Object.keys(preferences),
        overwrite,
        importedAt: new Date(),
      };
    } catch (error) {
      if (error.statusCode) throw error;

      logger.error("Erreur lors de l'import des préférences", error, {
        action: "import_preferences_failed",
        userId: userId?.toString(),
      });

      const serviceError = new Error("Erreur lors de l'import des préférences");
      serviceError.statusCode = 500;
      throw serviceError;
    }
  }

  /**
   * Validate user preferences values
   */
  static validatePreferences(preferences) {
    const errors = [];
    const warnings = [];

    const validThemes = ["light", "dark", "auto"];
    const validLanguages = [
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
    ];
    const validTones = [
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
    ];
    const validLengths = ["Court", "Moyen", "Long"];

    // Validate individual fields
    if (preferences.theme && !validThemes.includes(preferences.theme)) {
      errors.push(
        "Thème invalide. Valeurs acceptées: " + validThemes.join(", ")
      );
    }

    if (
      preferences.language &&
      !validLanguages.includes(preferences.language)
    ) {
      errors.push(
        "Langue invalide. Valeurs acceptées: " + validLanguages.join(", ")
      );
    }

    if (
      preferences.defaultTone &&
      !validTones.includes(preferences.defaultTone)
    ) {
      errors.push("Ton par défaut invalide");
    }

    if (
      preferences.defaultLength &&
      !validLengths.includes(preferences.defaultLength)
    ) {
      errors.push(
        "Longueur par défaut invalide. Valeurs acceptées: " +
          validLengths.join(", ")
      );
    }

    // Boolean type checks
    [
      "defaultEmoji",
      "emailNotifications",
      "marketingEmails",
      "autoSaveDrafts",
    ].forEach((field) => {
      if (
        preferences[field] !== undefined &&
        typeof preferences[field] !== "boolean"
      ) {
        errors.push(`${field} doit être un booléen`);
      }
    });

    // Warnings (not errors)
    if (preferences.marketingEmails === true) {
      warnings.push("Vous avez activé la réception d'emails marketing");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validatedPreferences: errors.length === 0 ? preferences : null,
    };
  }

  /**
   * Update a specific user preference (single field)
   */
  static async updateSpecificPreference(userId, field, value) {
    try {
      const tempPrefs = { [field]: value };
      const validationResult = this.validatePreferences(tempPrefs);

      if (!validationResult.isValid) {
        const error = new Error(`Valeur invalide pour ${field}`);
        error.statusCode = 400;
        error.code = "INVALID_PREFERENCE_VALUE";
        error.details = validationResult.errors;
        throw error;
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { [`preferences.${field}`]: value } },
        {
          new: true,
          runValidators: true,
          select: `preferences.${field} email`,
        }
      );

      if (!user) {
        const error = new Error("Utilisateur introuvable");
        error.statusCode = 404;
        throw error;
      }

      logger.user(
        `Préférence ${field} mise à jour`,
        {
          field,
          oldValue: user.preferences[field],
          newValue: value,
        },
        {
          userId: userId.toString(),
          email: user.email,
          action: "specific_preference_updated",
        }
      );

      return {
        [field]: user.preferences[field],
        updatedAt: new Date(),
      };
    } catch (error) {
      if (error.statusCode) throw error;

      logger.error(`Erreur lors de la mise à jour de ${field}`, error, {
        action: "update_specific_preference_failed",
        userId: userId?.toString(),
        field,
      });

      const serviceError = new Error(
        `Erreur lors de la mise à jour de ${field}`
      );
      serviceError.statusCode = 500;
      throw serviceError;
    }
  }
}

module.exports = PreferencesService;
