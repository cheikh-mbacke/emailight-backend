// ============================================================================
// src/constants/validationMessages.js - Pre-generated validation messages
// ============================================================================

import I18nService from "../services/i18nService.js";
import { SUPPORTED_LANGUAGES } from "./enums.js";

/**
 * Pre-generated validation messages to avoid runtime computation
 */
export const VALIDATION_MESSAGES = {
  [SUPPORTED_LANGUAGES.FR]: {
    name: {
      required: I18nService.getValidationMessage(
        "name",
        "required",
        SUPPORTED_LANGUAGES.FR
      ),
      minLength: I18nService.getValidationMessage(
        "name",
        "minLength",
        SUPPORTED_LANGUAGES.FR,
        { min: 2 }
      ),
      maxLength: I18nService.getValidationMessage(
        "name",
        "maxLength",
        SUPPORTED_LANGUAGES.FR,
        { max: 100 }
      ),
      pattern: I18nService.getValidationMessage(
        "name",
        "pattern",
        SUPPORTED_LANGUAGES.FR
      ),
    },
    email: {
      required: I18nService.getValidationMessage(
        "email",
        "required",
        SUPPORTED_LANGUAGES.FR
      ),
      invalid: I18nService.getValidationMessage(
        "email",
        "invalid",
        SUPPORTED_LANGUAGES.FR
      ),
      maxLength: I18nService.getValidationMessage(
        "email",
        "maxLength",
        SUPPORTED_LANGUAGES.FR,
        { max: 255 }
      ),
    },
    password: {
      required: I18nService.getValidationMessage(
        "password",
        "required",
        SUPPORTED_LANGUAGES.FR
      ),
      minLength: I18nService.getValidationMessage(
        "password",
        "minLength",
        SUPPORTED_LANGUAGES.FR,
        { min: 6 }
      ),
      maxLength: I18nService.getValidationMessage(
        "password",
        "maxLength",
        SUPPORTED_LANGUAGES.FR,
        { max: 128 }
      ),
      pattern: I18nService.getValidationMessage(
        "password",
        "pattern",
        SUPPORTED_LANGUAGES.FR
      ),
      authProviderRequired: I18nService.getValidationMessage(
        "password",
        "authProviderRequired",
        SUPPORTED_LANGUAGES.FR
      ),
    },
    refreshToken: {
      required: I18nService.getValidationMessage(
        "refreshToken",
        "required",
        SUPPORTED_LANGUAGES.FR
      ),
      invalid: I18nService.getValidationMessage(
        "refreshToken",
        "invalid",
        SUPPORTED_LANGUAGES.FR
      ),
    },
    googleToken: {
      required: I18nService.getValidationMessage(
        "googleToken",
        "required",
        SUPPORTED_LANGUAGES.FR
      ),
      invalid: I18nService.getValidationMessage(
        "googleToken",
        "invalid",
        SUPPORTED_LANGUAGES.FR
      ),
    },
    token: {
      required: I18nService.getValidationMessage(
        "token",
        "required",
        SUPPORTED_LANGUAGES.FR
      ),
      invalid: I18nService.getValidationMessage(
        "token",
        "invalid",
        SUPPORTED_LANGUAGES.FR
      ),
      expired: I18nService.getValidationMessage(
        "token",
        "expired",
        SUPPORTED_LANGUAGES.FR
      ),
    },
    currentPassword: {
      required: I18nService.getValidationMessage(
        "currentPassword",
        "required",
        SUPPORTED_LANGUAGES.FR
      ),
      invalid: I18nService.getValidationMessage(
        "currentPassword",
        "invalid",
        SUPPORTED_LANGUAGES.FR
      ),
    },
    newPassword: {
      required: I18nService.getValidationMessage(
        "newPassword",
        "required",
        SUPPORTED_LANGUAGES.FR
      ),
      minLength: I18nService.getValidationMessage(
        "newPassword",
        "minLength",
        SUPPORTED_LANGUAGES.FR,
        { min: 6 }
      ),
      maxLength: I18nService.getValidationMessage(
        "newPassword",
        "maxLength",
        SUPPORTED_LANGUAGES.FR,
        { max: 128 }
      ),
      pattern: I18nService.getValidationMessage(
        "newPassword",
        "pattern",
        SUPPORTED_LANGUAGES.FR
      ),
    },
    profilePicture: {
      invalid: I18nService.getValidationMessage(
        "profilePicture",
        "invalid",
        SUPPORTED_LANGUAGES.FR
      ),
    },
    theme: {
      invalid: I18nService.getValidationMessage(
        "theme",
        "invalid",
        SUPPORTED_LANGUAGES.FR
      ),
    },
    language: {
      invalid: I18nService.getValidationMessage(
        "language",
        "invalid",
        SUPPORTED_LANGUAGES.FR
      ),
    },
    defaultTone: {
      invalid: I18nService.getValidationMessage(
        "defaultTone",
        "invalid",
        SUPPORTED_LANGUAGES.FR
      ),
    },
    defaultLength: {
      invalid: I18nService.getValidationMessage(
        "defaultLength",
        "invalid",
        SUPPORTED_LANGUAGES.FR
      ),
    },
    provider: {
      invalid: I18nService.getValidationMessage(
        "provider",
        "invalid",
        SUPPORTED_LANGUAGES.FR
      ),
    },
    displayName: {
      maxLength: I18nService.getValidationMessage(
        "displayName",
        "maxLength",
        SUPPORTED_LANGUAGES.FR,
        { max: 100 }
      ),
    },
    userId: {
      required: I18nService.getValidationMessage(
        "userId",
        "required",
        SUPPORTED_LANGUAGES.FR
      ),
      invalid: I18nService.getValidationMessage(
        "userId",
        "invalid",
        SUPPORTED_LANGUAGES.FR
      ),
    },
  },

  [SUPPORTED_LANGUAGES.EN]: {
    name: {
      required: I18nService.getValidationMessage(
        "name",
        "required",
        SUPPORTED_LANGUAGES.EN
      ),
      minLength: I18nService.getValidationMessage(
        "name",
        "minLength",
        SUPPORTED_LANGUAGES.EN,
        { min: 2 }
      ),
      maxLength: I18nService.getValidationMessage(
        "name",
        "maxLength",
        SUPPORTED_LANGUAGES.EN,
        { max: 100 }
      ),
      pattern: I18nService.getValidationMessage(
        "name",
        "pattern",
        SUPPORTED_LANGUAGES.EN
      ),
    },
    email: {
      required: I18nService.getValidationMessage(
        "email",
        "required",
        SUPPORTED_LANGUAGES.EN
      ),
      invalid: I18nService.getValidationMessage(
        "email",
        "invalid",
        SUPPORTED_LANGUAGES.EN
      ),
      maxLength: I18nService.getValidationMessage(
        "email",
        "maxLength",
        SUPPORTED_LANGUAGES.EN,
        { max: 255 }
      ),
    },
    password: {
      required: I18nService.getValidationMessage(
        "password",
        "required",
        SUPPORTED_LANGUAGES.EN
      ),
      minLength: I18nService.getValidationMessage(
        "password",
        "minLength",
        SUPPORTED_LANGUAGES.EN,
        { min: 6 }
      ),
      maxLength: I18nService.getValidationMessage(
        "password",
        "maxLength",
        SUPPORTED_LANGUAGES.EN,
        { max: 128 }
      ),
      pattern: I18nService.getValidationMessage(
        "password",
        "pattern",
        SUPPORTED_LANGUAGES.EN
      ),
      authProviderRequired: I18nService.getValidationMessage(
        "password",
        "authProviderRequired",
        SUPPORTED_LANGUAGES.EN
      ),
    },
    refreshToken: {
      required: I18nService.getValidationMessage(
        "refreshToken",
        "required",
        SUPPORTED_LANGUAGES.EN
      ),
      invalid: I18nService.getValidationMessage(
        "refreshToken",
        "invalid",
        SUPPORTED_LANGUAGES.EN
      ),
    },
    googleToken: {
      required: I18nService.getValidationMessage(
        "googleToken",
        "required",
        SUPPORTED_LANGUAGES.EN
      ),
      invalid: I18nService.getValidationMessage(
        "googleToken",
        "invalid",
        SUPPORTED_LANGUAGES.EN
      ),
    },
    token: {
      required: I18nService.getValidationMessage(
        "token",
        "required",
        SUPPORTED_LANGUAGES.EN
      ),
      invalid: I18nService.getValidationMessage(
        "token",
        "invalid",
        SUPPORTED_LANGUAGES.EN
      ),
      expired: I18nService.getValidationMessage(
        "token",
        "expired",
        SUPPORTED_LANGUAGES.EN
      ),
    },
    currentPassword: {
      required: I18nService.getValidationMessage(
        "currentPassword",
        "required",
        SUPPORTED_LANGUAGES.EN
      ),
      invalid: I18nService.getValidationMessage(
        "currentPassword",
        "invalid",
        SUPPORTED_LANGUAGES.EN
      ),
    },
    newPassword: {
      required: I18nService.getValidationMessage(
        "newPassword",
        "required",
        SUPPORTED_LANGUAGES.EN
      ),
      minLength: I18nService.getValidationMessage(
        "newPassword",
        "minLength",
        SUPPORTED_LANGUAGES.EN,
        { min: 6 }
      ),
      maxLength: I18nService.getValidationMessage(
        "newPassword",
        "maxLength",
        SUPPORTED_LANGUAGES.EN,
        { max: 128 }
      ),
      pattern: I18nService.getValidationMessage(
        "newPassword",
        "pattern",
        SUPPORTED_LANGUAGES.EN
      ),
    },
    profilePicture: {
      invalid: I18nService.getValidationMessage(
        "profilePicture",
        "invalid",
        SUPPORTED_LANGUAGES.EN
      ),
    },
    theme: {
      invalid: I18nService.getValidationMessage(
        "theme",
        "invalid",
        SUPPORTED_LANGUAGES.EN
      ),
    },
    language: {
      invalid: I18nService.getValidationMessage(
        "language",
        "invalid",
        SUPPORTED_LANGUAGES.EN
      ),
    },
    defaultTone: {
      invalid: I18nService.getValidationMessage(
        "defaultTone",
        "invalid",
        SUPPORTED_LANGUAGES.EN
      ),
    },
    defaultLength: {
      invalid: I18nService.getValidationMessage(
        "defaultLength",
        "invalid",
        SUPPORTED_LANGUAGES.EN
      ),
    },
    provider: {
      invalid: I18nService.getValidationMessage(
        "provider",
        "invalid",
        SUPPORTED_LANGUAGES.EN
      ),
    },
    displayName: {
      maxLength: I18nService.getValidationMessage(
        "displayName",
        "maxLength",
        SUPPORTED_LANGUAGES.EN,
        { max: 100 }
      ),
    },
    userId: {
      required: I18nService.getValidationMessage(
        "userId",
        "required",
        SUPPORTED_LANGUAGES.EN
      ),
      invalid: I18nService.getValidationMessage(
        "userId",
        "invalid",
        SUPPORTED_LANGUAGES.EN
      ),
    },
  },
};

/**
 * Get validation message with fallback
 * @param {string} field - Field name
 * @param {string} rule - Validation rule
 * @param {string} language - Language preference
 * @param {object} params - Parameters for message interpolation
 * @returns {string} Validation message
 */
export function getValidationMessage(
  field,
  rule,
  language = SUPPORTED_LANGUAGES.FR,
  params = {}
) {
  const messages =
    VALIDATION_MESSAGES[language] ||
    VALIDATION_MESSAGES[SUPPORTED_LANGUAGES.FR];
  const fieldMessages = messages[field];

  if (fieldMessages && fieldMessages[rule]) {
    let message = fieldMessages[rule];

    // Interpolate parameters in the message
    if (params && typeof params === "object") {
      Object.keys(params).forEach((key) => {
        const placeholder = new RegExp(`\\{${key}\\}`, "g");
        message = message.replace(placeholder, params[key]);
      });
    }

    return message;
  }

  // Fallback to French if not found
  const frenchMessages = VALIDATION_MESSAGES[SUPPORTED_LANGUAGES.FR];
  let fallbackMessage =
    frenchMessages[field]?.[rule] || `Validation error for ${field}.${rule}`;

  // Interpolate parameters in fallback message too
  if (params && typeof params === "object") {
    Object.keys(params).forEach((key) => {
      const placeholder = new RegExp(`\\{${key}\\}`, "g");
      fallbackMessage = fallbackMessage.replace(placeholder, params[key]);
    });
  }

  return fallbackMessage;
}

/**
 * Helper to get all validation messages for a specific language
 * @param {string} language - Language code
 * @returns {object} All validation messages for the language
 */
export function getAllValidationMessages(language = SUPPORTED_LANGUAGES.FR) {
  return (
    VALIDATION_MESSAGES[language] || VALIDATION_MESSAGES[SUPPORTED_LANGUAGES.FR]
  );
}

/**
 * Helper to get validation messages for a specific field
 * @param {string} field - Field name
 * @param {string} language - Language code
 * @returns {object} Validation messages for the field
 */
export function getFieldValidationMessages(
  field,
  language = SUPPORTED_LANGUAGES.FR
) {
  const messages = getAllValidationMessages(language);
  return messages[field] || {};
}
