// ============================================================================
// 📁 src/services/preferencesService.js - User preferences management service
// ============================================================================

import User from "../models/User.js";
import {
  NotFoundError,
  ValidationError,
  SystemError,
} from "../utils/customError.js";
import { USER_ERRORS, PREFERENCES_ERRORS } from "../utils/errorCodes.js";
import { getEnumValues } from "../constants/enums.js";

/**
 * ⚙️ User Preferences Service
 */
class PreferencesService {
  // ✅ Injection du logger
  static setLogger(injectedLogger) {
    this.logger = injectedLogger;
  }

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
        throw new NotFoundError(
          "Utilisateur introuvable",
          USER_ERRORS.USER_NOT_FOUND
        );
      }

      return {
        preferences: user.preferences,
        defaultValues: this.getDefaultPreferences(),
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger.error(
        "Erreur lors de la récupération des préférences",
        error,
        {
          action: "get_preferences_failed",
          userId: userId?.toString(),
        }
      );

      throw new SystemError(
        "Erreur lors de la récupération des préférences",
        error,
        { userId: userId?.toString() }
      );
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
        throw new ValidationError(
          "Données de préférences invalides",
          validationResult.errors,
          PREFERENCES_ERRORS.INVALID_PREFERENCES
        );
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
        throw new NotFoundError(
          "Utilisateur introuvable",
          USER_ERRORS.USER_NOT_FOUND
        );
      }

      this.logger.user(
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
      if (error.isOperational) {
        throw error;
      }

      this.logger.error(
        "Erreur lors de la mise à jour des préférences",
        error,
        {
          action: "update_preferences_failed",
          userId: userId?.toString(),
        }
      );

      throw new SystemError(
        "Erreur lors de la mise à jour des préférences",
        error,
        { userId: userId?.toString() }
      );
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
        throw new NotFoundError(
          "Utilisateur introuvable",
          USER_ERRORS.USER_NOT_FOUND
        );
      }

      this.logger.user(
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
      if (error.isOperational) {
        throw error;
      }

      this.logger.error(
        "Erreur lors de la réinitialisation des préférences",
        error,
        {
          action: "reset_preferences_failed",
          userId: userId?.toString(),
        }
      );

      throw new SystemError(
        "Erreur lors de la réinitialisation des préférences",
        error,
        { userId: userId?.toString() }
      );
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
        throw new NotFoundError(
          "Utilisateur introuvable",
          USER_ERRORS.USER_NOT_FOUND
        );
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

      this.logger.user(
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
      if (error.isOperational) {
        throw error;
      }

      this.logger.error("Erreur lors de l'export des préférences", error, {
        action: "export_preferences_failed",
        userId: userId?.toString(),
      });

      throw new SystemError("Erreur lors de l'export des préférences", error, {
        userId: userId?.toString(),
      });
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
        throw new ValidationError(
          "Préférences importées invalides",
          validationResult.errors,
          PREFERENCES_ERRORS.INVALID_IMPORT_DATA
        );
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
        throw new NotFoundError(
          "Utilisateur introuvable",
          USER_ERRORS.USER_NOT_FOUND
        );
      }

      this.logger.user(
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
      if (error.isOperational) {
        throw error;
      }

      this.logger.error("Erreur lors de l'import des préférences", error, {
        action: "import_preferences_failed",
        userId: userId?.toString(),
      });

      throw new SystemError("Erreur lors de l'import des préférences", error, {
        userId: userId?.toString(),
      });
    }
  }

  /**
   * Validate user preferences values - AVEC constantes externalisées
   */
  static validatePreferences(preferences) {
    const errors = [];
    const warnings = [];

    // ✅ CORRECTION: Utiliser les constantes depuis enums.js
    const validThemes = getEnumValues.themes();
    const validLanguages = getEnumValues.languages();

    // Pour les tons, utiliser la langue de l'utilisateur ou français par défaut
    const userLanguage = preferences.language || "FR";
    const validTones = getEnumValues.emailTones(userLanguage);
    const validLengths = getEnumValues.emailLengths(userLanguage);

    // Valider les champs individuels
    if (preferences.theme && !validThemes.includes(preferences.theme)) {
      errors.push(
        `Thème invalide. Valeurs acceptées: ${validThemes.join(", ")}`
      );
    }

    if (
      preferences.language &&
      !validLanguages.includes(preferences.language)
    ) {
      errors.push(
        `Langue invalide. Valeurs acceptées: ${validLanguages.join(", ")}`
      );
    }

    if (
      preferences.defaultTone &&
      !validTones.includes(preferences.defaultTone)
    ) {
      errors.push("Ton par défaut invalide pour la langue sélectionnée");
    }

    if (
      preferences.defaultLength &&
      !validLengths.includes(preferences.defaultLength)
    ) {
      errors.push(
        `Longueur par défaut invalide. Valeurs acceptées: ${validLengths.join(", ")}`
      );
    }

    // Vérification des types booléens
    const booleanFields = [
      "defaultEmoji",
      "emailNotifications",
      "marketingEmails",
      "autoSaveDrafts",
    ];

    booleanFields.forEach((field) => {
      if (
        preferences[field] !== undefined &&
        typeof preferences[field] !== "boolean"
      ) {
        errors.push(`${field} doit être un booléen`);
      }
    });

    // ✅ CORRECTION: Supprimer les avertissements business du service technique
    // Ces vérifications doivent être dans le controller ou un service métier dédié

    return {
      isValid: errors.length === 0,
      errors,
      warnings, // Vide maintenant
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
        throw new ValidationError(
          `Valeur invalide pour ${field}`,
          validationResult.errors,
          PREFERENCES_ERRORS.INVALID_PREFERENCE_VALUE
        );
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
        throw new NotFoundError(
          "Utilisateur introuvable",
          USER_ERRORS.USER_NOT_FOUND
        );
      }

      this.logger.user(
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
      if (error.isOperational) {
        throw error;
      }

      this.logger.error(`Erreur lors de la mise à jour de ${field}`, error, {
        action: "update_specific_preference_failed",
        userId: userId?.toString(),
        field,
      });

      throw new SystemError(
        `Erreur lors de la mise à jour de ${field}`,
        error,
        { userId: userId?.toString(), field }
      );
    }
  }
}

export default PreferencesService;
