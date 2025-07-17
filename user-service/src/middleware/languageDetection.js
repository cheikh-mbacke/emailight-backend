// ============================================================================
// 📁 src/middleware/languageDetection.js - Détection de langue améliorée
// ============================================================================

import { SUPPORTED_LANGUAGES } from "../constants/enums.js";
import I18nService from "../services/i18nService.js";

// Logger par défaut avec injection
let logger = {
  debug: (msg, data) => {
    if (typeof console !== "undefined") {
      console.log(`🌍 [LANG] ${msg}`, data || "");
    }
  },
  error: (msg, error) => {
    if (typeof console !== "undefined") {
      console.error(`❌ [LANG] ${msg}`, error || "");
    }
  },
};

/**
 * ✅ Injection du logger
 */
export const setLogger = (injectedLogger) => {
  logger = injectedLogger;
  // Injecter aussi dans I18nService pour cohérence
  I18nService.setLogger(injectedLogger);
};

/**
 * 🌍 Détecter la langue selon la stratégie hybride
 * Ordre de priorité :
 * 1. ?lang=fr (paramètre de requête) - Contrôle utilisateur
 * 2. X-Language: fr (header personnalisé) - Configuration client
 * 3. Accept-Language (header standard) - Préférence navigateur
 * 4. Langue par défaut (FR) - Fallback
 */
export const detectLanguage = (request) => {
  try {
    // 1. Paramètre de requête (priorité haute)
    const queryLang = request.query?.lang;
    if (queryLang && I18nService.isLanguageSupported(queryLang)) {
      logger.debug("Langue détectée via paramètre de requête", {
        lang: queryLang,
        source: "query",
      });
      return queryLang;
    }

    // 2. Header personnalisé X-Language
    const headerLang = request.headers["x-language"];
    if (headerLang && I18nService.isLanguageSupported(headerLang)) {
      logger.debug("Langue détectée via header X-Language", {
        lang: headerLang,
        source: "header",
      });
      return headerLang;
    }

    // 3. Header standard Accept-Language
    const acceptLanguage = request.headers["accept-language"];
    if (acceptLanguage) {
      const detectedLang = parseAcceptLanguage(acceptLanguage);
      if (detectedLang) {
        logger.debug("Langue détectée via Accept-Language", {
          acceptLanguage,
          detected: detectedLang,
          source: "accept-language",
        });
        return detectedLang;
      }
    }

    // 4. Langue par défaut
    logger.debug("Utilisation de la langue par défaut", {
      lang: SUPPORTED_LANGUAGES.FR,
      source: "default",
    });
    return SUPPORTED_LANGUAGES.FR;
  } catch (error) {
    logger.error("Erreur lors de la détection de langue, fallback vers FR", {
      error: error.message,
    });
    return SUPPORTED_LANGUAGES.FR;
  }
};

/**
 * 🔍 Parser le header Accept-Language
 * Exemple: "fr-FR,fr;q=0.9,en;q=0.8" -> "FR"
 */
function parseAcceptLanguage(acceptLanguage) {
  try {
    if (!acceptLanguage) return null;

    // Parser les langues avec leurs scores de qualité
    const languages = acceptLanguage
      .split(",")
      .map((lang) => {
        const [language, quality = "q=1.0"] = lang.trim().split(";");
        const q = parseFloat(quality.replace("q=", "")) || 1.0;
        return { language: language.split("-")[0].toUpperCase(), q };
      })
      .sort((a, b) => b.q - a.q); // Trier par qualité décroissante

    // Trouver la première langue supportée
    for (const { language } of languages) {
      if (I18nService.isLanguageSupported(language)) {
        return language;
      }
    }

    return null;
  } catch (error) {
    logger.error("Erreur lors du parsing Accept-Language", {
      error: error.message,
    });
    return null;
  }
}

/**
 * 🌍 Middleware Fastify pour injecter la langue détectée
 */
export const languageDetectionMiddleware = async (request, reply) => {
  try {
    // Détecter la langue
    const detectedLanguage = detectLanguage(request);

    // Injecter dans la requête pour utilisation dans les contrôleurs
    request.language = detectedLanguage;

    // Ajouter dans les headers de réponse pour information
    reply.header("X-Detected-Language", detectedLanguage);

    logger.debug("Langue injectée dans la requête", {
      language: detectedLanguage,
      url: request.url,
      method: request.method,
    });
  } catch (error) {
    logger.error("Erreur dans le middleware de détection de langue", {
      error: error.message,
    });
    // Fallback vers la langue par défaut
    request.language = SUPPORTED_LANGUAGES.FR;
    reply.header("X-Detected-Language", SUPPORTED_LANGUAGES.FR);
  }
};

/**
 * 🌍 Helper pour obtenir la langue depuis une requête
 * @param {object} request - Objet requête Fastify
 * @param {string} fallback - Langue de fallback
 * @returns {string} Langue détectée ou fallback
 */
export const getRequestLanguage = (
  request,
  fallback = SUPPORTED_LANGUAGES.FR
) => {
  return request.language || fallback;
};

/**
 * 🌍 Helper pour valider une langue
 * @param {string} language - Langue à valider
 * @returns {boolean} True si la langue est supportée
 */
export const isValidLanguage = (language) => {
  return I18nService.isLanguageSupported(language);
};

/**
 * 🌍 Helper pour obtenir la langue avec fallback sécurisé
 * @param {object} request - Objet requête Fastify
 * @param {object} user - Objet utilisateur (optionnel)
 * @returns {string} Langue validée
 */
export const getSecureLanguage = (request, user = null) => {
  // Priorité 1: Langue de la requête
  if (request.language && I18nService.isLanguageSupported(request.language)) {
    return request.language;
  }

  // Priorité 2: Langue de l'utilisateur
  if (user) {
    const userLanguage = I18nService.getUserLanguage(user);
    if (I18nService.isLanguageSupported(userLanguage)) {
      return userLanguage;
    }
  }

  // Priorité 3: Langue par défaut
  return SUPPORTED_LANGUAGES.FR;
};

/**
 * 🌍 Helper pour obtenir les statistiques de détection de langue
 * @returns {object} Statistiques de détection
 */
export const getLanguageDetectionStats = () => {
  return {
    supportedLanguages: Object.values(SUPPORTED_LANGUAGES),
    defaultLanguage: SUPPORTED_LANGUAGES.FR,
    detectionSources: ["query", "header", "accept-language", "default"],
  };
};
