// ============================================================================
// 📁 src/services/i18nService.js - Service d'internationalisation refactorisé
// ============================================================================

import { SUPPORTED_LANGUAGES } from "../constants/enums.js";
import {
  getTranslation,
  getAllTranslations,
  hasTranslation,
} from "../constants/translations.js";

// Logger par défaut avec injection
let logger = {
  debug: (msg, data) => {
    if (typeof console !== "undefined") {
      console.log(`🌍 [I18N] ${msg}`, data || "");
    }
  },
  error: (msg, error) => {
    if (typeof console !== "undefined") {
      console.error(`❌ [I18N] ${msg}`, error || "");
    }
  },
};

/**
 * 🌍 Service d'internationalisation centralisé
 */
class I18nService {
  /**
   * ✅ Injection du logger
   */
  static setLogger(injectedLogger) {
    logger = injectedLogger;
  }

  /**
   * 🌍 Obtenir un message traduit
   * @param {string} key - Clé de traduction (ex: "auth.login_success")
   * @param {string} language - Langue cible
   * @param {object} params - Paramètres d'interpolation
   * @returns {string} Message traduit
   */
  static getMessage(key, language = SUPPORTED_LANGUAGES.FR, params = {}) {
    try {
      // Valider la langue
      if (!this.isLanguageSupported(language)) {
        language = SUPPORTED_LANGUAGES.FR;
        logger.debug("Langue non supportée, fallback vers FR", {
          requestedLanguage: language,
        });
      }

      // Obtenir la traduction
      const translation = getTranslation(key, language, params);

      // Log si la clé n'existe pas
      if (translation === key) {
        logger.debug("Clé de traduction non trouvée", { key, language });
      }

      return translation;
    } catch (error) {
      logger.error("Erreur lors de la traduction", {
        key,
        language,
        error: error.message,
      });
      return key;
    }
  }

  /**
   * ✅ Obtenir un message de validation
   * @param {string} field - Nom du champ
   * @param {string} rule - Règle de validation
   * @param {string} language - Langue cible
   * @param {object} params - Paramètres d'interpolation
   * @returns {string} Message de validation traduit
   */
  static getValidationMessage(
    field,
    rule,
    language = SUPPORTED_LANGUAGES.FR,
    params = {}
  ) {
    const key = `validation.${field}.${rule}`;
    return this.getMessage(key, language, params);
  }

  /**
   * ✅ Obtenir un message de succès
   * @param {string} type - Type de succès
   * @param {string} language - Langue cible
   * @returns {string} Message de succès traduit
   */
  static getSuccessMessage(type, language = SUPPORTED_LANGUAGES.FR) {
    const key = `auth.${type}`;
    return this.getMessage(key, language);
  }

  /**
   * ✅ Obtenir un message d'erreur d'authentification
   * @param {string} type - Type d'erreur
   * @param {string} language - Langue cible
   * @returns {string} Message d'erreur traduit
   */
  static getAuthErrorMessage(type, language = SUPPORTED_LANGUAGES.FR) {
    const key = `auth.${type}`;
    return this.getMessage(key, language);
  }

  /**
   * ✅ Obtenir un message utilisateur
   * @param {string} type - Type de message
   * @param {string} language - Langue cible
   * @returns {string} Message utilisateur traduit
   */
  static getUserMessage(type, language = SUPPORTED_LANGUAGES.FR) {
    const key = `user.${type}`;
    return this.getMessage(key, language);
  }

  /**
   * ✅ Obtenir un message de compte email
   * @param {string} type - Type de message
   * @param {string} language - Langue cible
   * @returns {string} Message de compte email traduit
   */
  static getEmailAccountMessage(type, language = SUPPORTED_LANGUAGES.FR) {
    const key = `email_account.${type}`;
    return this.getMessage(key, language);
  }

  /**
   * ✅ Obtenir un message de succès
   * @param {string} type - Type de succès
   * @param {string} language - Langue cible
   * @returns {string} Message de succès traduit
   */
  static getSuccessMessage(type, language = SUPPORTED_LANGUAGES.FR) {
    const key = `success.${type}`;
    return this.getMessage(key, language);
  }

  /**
   * ✅ Obtenir un message de log
   * @param {string} type - Type de log
   * @param {string} language - Langue cible
   * @returns {string} Message de log traduit
   */
  static getLogMessage(type, language = SUPPORTED_LANGUAGES.FR) {
    const key = `logs.${type}`;
    return this.getMessage(key, language);
  }

  /**
   * ✅ Obtenir un message de santé
   * @param {string} type - Type de message de santé
   * @param {string} language - Langue cible
   * @returns {string} Message de santé traduit
   */
  static getHealthMessage(type, language = SUPPORTED_LANGUAGES.FR) {
    const key = `health.${type}`;
    return this.getMessage(key, language);
  }

  /**
   * ✅ Obtenir un message de quota
   * @param {string} type - Type de message de quota
   * @param {string} language - Langue cible
   * @returns {string} Message de quota traduit
   */
  static getQuotaMessage(type, language = SUPPORTED_LANGUAGES.FR) {
    const key = `quota.${type}`;
    return this.getMessage(key, language);
  }

  /**
   * ✅ Obtenir un message de sécurité
   * @param {string} type - Type de message de sécurité
   * @param {string} language - Langue cible
   * @returns {string} Message de sécurité traduit
   */
  static getSecurityMessage(type, language = SUPPORTED_LANGUAGES.FR) {
    const key = `security.${type}`;
    return this.getMessage(key, language);
  }

  /**
   * 🌍 Obtenir les langues supportées
   * @returns {object} Objet des langues supportées
   */
  static getAvailableLanguages() {
    return SUPPORTED_LANGUAGES;
  }

  /**
   * 🌍 Vérifier si une langue est supportée
   * @param {string} language - Langue à vérifier
   * @returns {boolean} True si la langue est supportée
   */
  static isLanguageSupported(language) {
    return Object.values(SUPPORTED_LANGUAGES).includes(language);
  }

  /**
   * 🌍 Obtenir la langue d'un utilisateur
   * @param {object} user - Objet utilisateur
   * @returns {string} Langue de l'utilisateur ou FR par défaut
   */
  static getUserLanguage(user) {
    if (user && user.preferences && user.preferences.language) {
      return this.isLanguageSupported(user.preferences.language)
        ? user.preferences.language
        : SUPPORTED_LANGUAGES.FR;
    }
    return SUPPORTED_LANGUAGES.FR;
  }

  /**
   * 🌍 Obtenir la langue depuis une requête
   * @param {object} request - Objet requête Fastify
   * @returns {string} Langue détectée ou FR par défaut
   */
  static getRequestLanguage(request) {
    return request.language || SUPPORTED_LANGUAGES.FR;
  }

  /**
   * ✅ Créer une erreur de validation avec message traduit
   * @param {string} field - Nom du champ
   * @param {string} rule - Règle de validation
   * @param {string} language - Langue cible
   * @param {object} params - Paramètres d'interpolation
   * @returns {array} [isError, message] pour compatibilité
   */
  static createValidationError(
    field,
    rule,
    language = SUPPORTED_LANGUAGES.FR,
    params = {}
  ) {
    const message = this.getValidationMessage(field, rule, language, params);
    return [true, message];
  }

  /**
   * 🌍 Obtenir toutes les traductions pour une langue
   * @param {string} language - Langue cible
   * @returns {object} Toutes les traductions pour la langue
   */
  static getAllTranslations(language = SUPPORTED_LANGUAGES.FR) {
    return getAllTranslations(language);
  }

  /**
   * 🌍 Vérifier si une clé de traduction existe
   * @param {string} key - Clé à vérifier
   * @param {string} language - Langue cible
   * @returns {boolean} True si la clé existe
   */
  static hasTranslation(key, language = SUPPORTED_LANGUAGES.FR) {
    return hasTranslation(key, language);
  }

  /**
   * 🔧 Obtenir les statistiques de traduction
   * @returns {object} Statistiques des traductions
   */
  static getTranslationStats() {
    const stats = {};

    Object.values(SUPPORTED_LANGUAGES).forEach((lang) => {
      const translations = getAllTranslations(lang);
      stats[lang] = {
        totalKeys: this.countKeys(translations),
        categories: Object.keys(translations).length,
      };
    });

    return stats;
  }

  /**
   * 🔧 Compter le nombre de clés dans un objet de traductions
   * @param {object} obj - Objet de traductions
   * @returns {number} Nombre de clés
   */
  static countKeys(obj) {
    let count = 0;

    for (const key in obj) {
      if (typeof obj[key] === "object" && obj[key] !== null) {
        count += this.countKeys(obj[key]);
      } else {
        count++;
      }
    }

    return count;
  }
}

export default I18nService;
