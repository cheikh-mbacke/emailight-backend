/**
 * 🚨 Classe d'erreur personnalisée pour l'application
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = null, details = null) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Erreur métier (non critique)
    this.timestamp = new Date().toISOString();

    // Capture la stack trace (exclut le constructeur)
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * 📝 Convertit l'erreur en format JSON pour les réponses API
   */
  toJSON() {
    return {
      error: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
    };
  }

  /**
   * 🔍 Vérifie si c'est une erreur client (4xx)
   */
  isClientError() {
    return this.statusCode >= 400 && this.statusCode < 500;
  }

  /**
   * 🔥 Vérifie si c'est une erreur serveur (5xx)
   */
  isServerError() {
    return this.statusCode >= 500;
  }
}

/**
 * 💥 Erreur système critique (non opérationnelle)
 */
export class SystemError extends Error {
  constructor(message, originalError = null, context = {}) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = 500;
    this.isOperational = false; // Erreur système critique
    this.originalError = originalError;
    this.context = context;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: "Erreur interne du serveur",
      code: "SYSTEM_ERROR",
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      // En développement, on peut exposer plus de détails
      ...(process.env.NODE_ENV === "development" && {
        originalError: this.originalError?.message,
        context: this.context,
      }),
    };
  }
}

/**
 * 🔐 Erreurs d'authentification spécialisées
 */
export class AuthError extends AppError {
  constructor(message, code, details = null) {
    super(message, 401, code, details);
  }
}

/**
 * 🚫 Erreurs d'autorisation spécialisées
 */
export class ForbiddenError extends AppError {
  constructor(message, code, details = null) {
    super(message, 403, code, details);
  }
}

/**
 * 🔍 Erreurs de ressource non trouvée
 */
export class NotFoundError extends AppError {
  constructor(message, code, details = null) {
    super(message, 404, code, details);
  }
}

/**
 * ⚡ Erreurs de conflit (doublons, etc.)
 */
export class ConflictError extends AppError {
  constructor(message, code, details = null) {
    super(message, 409, code, details);
  }
}

/**
 * 📝 Erreurs de validation
 */
export class ValidationError extends AppError {
  constructor(message, details = null, code = "VALIDATION_ERROR") {
    super(message, 400, code, details);
  }
}

/**
 * 🚦 Erreurs de limitation de débit
 */
export class RateLimitError extends AppError {
  constructor(message, code, details = null) {
    super(message, 429, code, details);
  }
}

/**
 * 📈 Erreurs de quota spécifiques
 */
export class QuotaExceededError extends AppError {
  constructor(message, quotaInfo = {}, code = "QUOTA_EXCEEDED") {
    super(message, 429, code, { quotaInfo });
    this.quotaInfo = quotaInfo;
  }
}

/**
 * 🏭 Factory pour créer des erreurs facilement
 */
export class ErrorFactory {
  static badRequest(message, code = "BAD_REQUEST", details = null) {
    return new AppError(message, 400, code, details);
  }

  static unauthorized(message, code = "UNAUTHORIZED", details = null) {
    return new AuthError(message, code, details);
  }

  static forbidden(message, code = "FORBIDDEN", details = null) {
    return new ForbiddenError(message, code, details);
  }

  static notFound(message, code = "NOT_FOUND", details = null) {
    return new NotFoundError(message, code, details);
  }

  static conflict(message, code = "CONFLICT", details = null) {
    return new ConflictError(message, code, details);
  }

  static validation(message, details = null, code = "VALIDATION_ERROR") {
    return new ValidationError(message, details, code);
  }

  static rateLimit(message, code = "RATE_LIMIT_EXCEEDED", details = null) {
    return new RateLimitError(message, code, details);
  }

  static internal(message, originalError = null, context = {}) {
    return new SystemError(message, originalError, context);
  }
}
