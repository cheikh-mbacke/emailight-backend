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
    },
    password: {
      minLength: I18nService.getValidationMessage(
        "password",
        "minLength",
        SUPPORTED_LANGUAGES.FR,
        { min: 6 }
      ),
      authProviderRequired: I18nService.getValidationMessage(
        "password",
        "authProviderRequired",
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
    },
    password: {
      minLength: I18nService.getValidationMessage(
        "password",
        "minLength",
        SUPPORTED_LANGUAGES.EN,
        { min: 6 }
      ),
      authProviderRequired: I18nService.getValidationMessage(
        "password",
        "authProviderRequired",
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
  },
};

/**
 * Get validation message with fallback
 * @param {string} field - Field name
 * @param {string} rule - Validation rule
 * @param {string} language - Language preference
 * @returns {string} Validation message
 */
export function getValidationMessage(
  field,
  rule,
  language = SUPPORTED_LANGUAGES.FR
) {
  const messages =
    VALIDATION_MESSAGES[language] ||
    VALIDATION_MESSAGES[SUPPORTED_LANGUAGES.FR];
  const fieldMessages = messages[field];

  if (fieldMessages && fieldMessages[rule]) {
    return fieldMessages[rule];
  }

  // Fallback to French if not found
  const frenchMessages = VALIDATION_MESSAGES[SUPPORTED_LANGUAGES.FR];
  return (
    frenchMessages[field]?.[rule] || `Validation error for ${field}.${rule}`
  );
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
