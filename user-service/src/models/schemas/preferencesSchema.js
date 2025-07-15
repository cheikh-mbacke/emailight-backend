// ============================================================================
// src/models/schemas/preferencesSchema.js - User preferences schema
// ============================================================================

import mongoose from "mongoose";
import { getEnumValues, SUPPORTED_LANGUAGES } from "../../constants/enums.js";
import I18nService from "../../services/i18nService.js";

/**
 * User preferences schema
 * Handles UI, email defaults, notifications, and auto-save settings
 */
const preferencesSchema = new mongoose.Schema(
  {
    // Interface preferences
    theme: {
      type: String,
      enum: getEnumValues.themes(),
      default: "auto",
    },
    language: {
      type: String,
      enum: getEnumValues.languages(),
      default: SUPPORTED_LANGUAGES.FR,
    },

    // Default email preferences
    defaultTone: {
      type: String,
      validate: {
        validator: function (tone) {
          // Get user's language preference
          const userLanguage = this.language || SUPPORTED_LANGUAGES.FR;
          const availableTones = getEnumValues.emailTones(userLanguage);
          return availableTones.includes(tone);
        },
        message: function (props) {
          const userLanguage = this.language || SUPPORTED_LANGUAGES.FR;
          return I18nService.getMessage(
            "validation.tone.invalid",
            userLanguage
          );
        },
      },
      default: function () {
        return getEnumValues.defaultTone(
          this.language || SUPPORTED_LANGUAGES.FR
        );
      },
    },
    defaultLength: {
      type: String,
      validate: {
        validator: function (length) {
          // Get user's language preference
          const userLanguage = this.language || SUPPORTED_LANGUAGES.FR;
          const availableLengths = getEnumValues.emailLengths(userLanguage);
          return availableLengths.includes(length);
        },
        message: function (props) {
          const userLanguage = this.language || SUPPORTED_LANGUAGES.FR;
          return I18nService.getMessage(
            "validation.length.invalid",
            userLanguage
          );
        },
      },
      default: function () {
        return getEnumValues.defaultLength(
          this.language || SUPPORTED_LANGUAGES.FR
        );
      },
    },
    defaultEmoji: {
      type: Boolean,
      default: false,
    },

    // Notifications
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    marketingEmails: {
      type: Boolean,
      default: false,
    },

    // Auto-save drafts
    autoSaveDrafts: {
      type: Boolean,
      default: true,
    },

    // Advanced preferences
    timezone: {
      type: String,
      default: "Europe/Paris",
      validate: {
        validator: function (tz) {
          // List of commonly supported timezones (subset of IANA)
          const supportedTimezones = [
            "Europe/Paris",
            "Europe/London",
            "Europe/Berlin",
            "Europe/Madrid",
            "Europe/Rome",
            "America/New_York",
            "America/Chicago",
            "America/Denver",
            "America/Los_Angeles",
            "America/Toronto",
            "America/Vancouver",
            "America/Mexico_City",
            "America/Sao_Paulo",
            "Asia/Tokyo",
            "Asia/Shanghai",
            "Asia/Kolkata",
            "Asia/Dubai",
            "Asia/Singapore",
            "Australia/Sydney",
            "Australia/Melbourne",
            "Pacific/Auckland",
            "UTC",
          ];

          if (!tz) return true; // Allow empty

          // Check if it's in our supported list
          if (supportedTimezones.includes(tz)) return true;

          // Fallback: try Intl validation but only for safe patterns
          if (/^[A-Za-z_]+\/[A-Za-z_]+$/.test(tz)) {
            try {
              Intl.DateTimeFormat(undefined, { timeZone: tz });
              return true;
            } catch (e) {
              return false;
            }
          }

          return false;
        },
        message:
          "Timezone not supported. Please use a valid IANA timezone identifier.",
      },
    },

    // Interface preferences
    compactMode: {
      type: Boolean,
      default: false,
    },
    showTutorials: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: false,
    timestamps: false,
  }
);

/**
 * Pre-save middleware to update dependent fields
 */
preferencesSchema.pre("validate", function (next) {
  // Update defaultTone and defaultLength when language changes
  if (this.isModified("language")) {
    const newLanguage = this.language;

    // Update defaultTone if it's the default value or invalid for new language
    const availableTones = getEnumValues.emailTones(newLanguage);
    if (!availableTones.includes(this.defaultTone)) {
      this.defaultTone = getEnumValues.defaultTone(newLanguage);
    }

    // Update defaultLength if it's the default value or invalid for new language
    const availableLengths = getEnumValues.emailLengths(newLanguage);
    if (!availableLengths.includes(this.defaultLength)) {
      this.defaultLength = getEnumValues.defaultLength(newLanguage);
    }
  }

  next();
});

/**
 * Methods for preferences manipulation
 */
preferencesSchema.methods.updateLanguage = function (newLanguage) {
  if (getEnumValues.languages().includes(newLanguage)) {
    this.language = newLanguage;
    // Trigger pre-validate middleware to update dependent fields
    this.parent().markModified("preferences");
  }
};

preferencesSchema.methods.getAvailableTones = function () {
  return getEnumValues.emailTones(this.language);
};

preferencesSchema.methods.getAvailableLengths = function () {
  return getEnumValues.emailLengths(this.language);
};

preferencesSchema.methods.isValidTone = function (tone) {
  return this.getAvailableTones().includes(tone);
};

preferencesSchema.methods.isValidLength = function (length) {
  return this.getAvailableLengths().includes(length);
};

/**
 * Virtual for complete preferences info
 */
preferencesSchema.virtual("info").get(function () {
  return {
    ui: {
      theme: this.theme,
      language: this.language,
      timezone: this.timezone,
      compactMode: this.compactMode,
      showTutorials: this.showTutorials,
    },
    emailDefaults: {
      tone: this.defaultTone,
      length: this.defaultLength,
      emoji: this.defaultEmoji,
      availableTones: this.getAvailableTones(),
      availableLengths: this.getAvailableLengths(),
    },
    notifications: {
      email: this.emailNotifications,
      marketing: this.marketingEmails,
    },
    features: {
      autoSave: this.autoSaveDrafts,
    },
  };
});

export default preferencesSchema;
