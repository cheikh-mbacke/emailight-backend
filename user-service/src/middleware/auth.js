import User from "../models/User.js";

// ✅ Logger par défaut avec injection
let logger = {
  error: (msg, error, context) =>
    console.error(`❌ [AUTH] ${msg}`, error || "", context || ""),
  warn: (msg, data, context) =>
    console.warn(`⚠️ [AUTH] ${msg}`, data || "", context || ""),
  info: (msg, data, context) =>
    console.log(`📡 [AUTH] ${msg}`, data || "", context || ""),
  auth: (msg, data, context) =>
    console.log(`🔐 [AUTH] ${msg}`, data || "", context || ""),
};

/**
 * ✅ Injection du logger
 */
export const setLogger = (injectedLogger) => {
  logger = injectedLogger;
};

/**
 * 🔐 JWT Authentication Middleware for Fastify
 * Uses @fastify/jwt which is pre-configured in the app
 */
export const authenticateToken = async (request, reply) => {
  try {
    // Verify and decode JWT (handled by @fastify/jwt)
    await request.jwtVerify();

    // Decoded payload is available as request.user
    const userId = request.user.userId;

    if (!userId) {
      logger.warn(
        "Token JWT invalide - userId manquant",
        { token: "présent" },
        {
          action: "invalid_jwt_token",
          endpoint: `${request.method} ${request.url}`,
        }
      );

      return reply.code(401).send({
        error: "Invalid token",
        message: "User ID is missing from token",
      });
    }

    // Fetch the user from the database
    const user = await User.findById(userId);

    if (!user) {
      logger.warn(
        "Utilisateur introuvable pour le token JWT",
        { userId },
        {
          action: "user_not_found_for_token",
          endpoint: `${request.method} ${request.url}`,
        }
      );

      return reply.code(401).send({
        error: "User not found",
        message: "The user associated with this token no longer exists",
      });
    }

    // Check if the account is active
    if (!user.isActive) {
      logger.warn(
        "Tentative d'accès avec compte désactivé",
        { userId, email: user.email },
        {
          userId: userId.toString(),
          action: "inactive_account_access",
          endpoint: `${request.method} ${request.url}`,
        }
      );

      return reply.code(401).send({
        error: "Account disabled",
        message: "Your account has been deactivated",
      });
    }

    // Check if the account is locked
    if (user.isAccountLocked()) {
      logger.warn(
        "Tentative d'accès avec compte verrouillé",
        { userId, email: user.email },
        {
          userId: userId.toString(),
          action: "locked_account_access",
          endpoint: `${request.method} ${request.url}`,
        }
      );

      return reply.code(423).send({
        error: "Account locked",
        message:
          "Your account is temporarily locked due to too many failed login attempts",
      });
    }

    // Attach the full user object to the request
    request.user = user;

    // Update last active time and session info
    await user.updateLastActive(request.ip, request.headers["user-agent"]);

    // Log successful authentication
    logger.auth(
      "Authentification réussie",
      {
        userId,
        email: user.email,
        endpoint: `${request.method} ${request.url}`,
      },
      {
        userId: userId.toString(),
        action: "authentication_success",
        endpoint: `${request.method} ${request.url}`,
      }
    );
  } catch (error) {
    // 🎯 Handle specific JWT errors (4xx - métier)
    if (error.code === "FST_JWT_NO_AUTHORIZATION_IN_HEADER") {
      logger.warn(
        "Tentative d'accès sans token",
        {
          endpoint: `${request.method} ${request.url}`,
          ip: request.ip,
        },
        {
          action: "missing_authorization_header",
          endpoint: `${request.method} ${request.url}`,
        }
      );

      return reply.code(401).send({
        error: "Missing token",
        message: "Authorization header required with a Bearer token",
      });
    }

    if (error.code === "FST_JWT_AUTHORIZATION_TOKEN_EXPIRED") {
      logger.info(
        "Token JWT expiré",
        {
          endpoint: `${request.method} ${request.url}`,
          ip: request.ip,
        },
        {
          action: "token_expired",
          endpoint: `${request.method} ${request.url}`,
        }
      );

      return reply.code(401).send({
        error: "Token expired",
        message: "Your session has expired, please log in again",
      });
    }

    if (error.code === "FST_JWT_AUTHORIZATION_TOKEN_INVALID") {
      logger.warn(
        "Token JWT invalide",
        {
          endpoint: `${request.method} ${request.url}`,
          ip: request.ip,
        },
        {
          action: "invalid_token",
          endpoint: `${request.method} ${request.url}`,
        }
      );

      return reply.code(401).send({
        error: "Invalid token",
        message: "The authentication token is invalid",
      });
    }

    // 🎯 Erreurs de base de données ou système (5xx)
    if (
      error.name === "MongoNetworkError" ||
      error.name === "MongoServerError" ||
      error.name === "CastError" ||
      !error.code
    ) {
      logger.error("Erreur système d'authentification", error, {
        action: "authentication_system_error",
        endpoint: `${request.method} ${request.url}`,
        ip: request.ip,
        errorType: error.name || "unknown",
      });

      // 🚨 Laisser remonter les erreurs système au gestionnaire centralisé
      throw error;
    }

    // 🎯 Autres erreurs JWT (probablement métier)
    logger.error("Erreur d'authentification non catégorisée", error, {
      action: "authentication_failed",
      endpoint: `${request.method} ${request.url}`,
      ip: request.ip,
      errorCode: error.code,
    });

    return reply.code(401).send({
      error: "Authentication failed",
      message: "Unable to verify your identity",
    });
  }
};

/**
 * 🔓 Optional Authentication Middleware
 * Attaches the user if the token is valid; otherwise continues without user
 */
export const optionalAuth = async (request, reply) => {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      request.user = null;
      return;
    }

    await request.jwtVerify();
    const userId = request.user.userId;

    if (userId) {
      const user = await User.findById(userId);
      if (user && user.isActive && !user.isAccountLocked()) {
        request.user = user;
        await user.updateLastActive(request.ip, request.headers["user-agent"]);

        logger.auth(
          "Authentification optionnelle réussie",
          { userId, email: user.email },
          {
            userId: userId.toString(),
            action: "optional_auth_success",
            endpoint: `${request.method} ${request.url}`,
          }
        );
      } else {
        request.user = null;
        logger.info(
          "Authentification optionnelle échouée - compte inactif ou verrouillé",
          { userId },
          {
            action: "optional_auth_failed_account_status",
            endpoint: `${request.method} ${request.url}`,
          }
        );
      }
    } else {
      request.user = null;
    }
  } catch (error) {
    // 🎯 Pour optional auth, on log seulement et on continue
    request.user = null;

    // 🚨 Si c'est une erreur système, on la laisse remonter
    if (
      error.name === "MongoNetworkError" ||
      error.name === "MongoServerError" ||
      (!error.code &&
        error.name !== "JsonWebTokenError" &&
        error.name !== "TokenExpiredError")
    ) {
      logger.error(
        "Erreur système lors de l'authentification optionnelle",
        error,
        {
          action: "optional_auth_system_error",
          endpoint: `${request.method} ${request.url}`,
          ip: request.ip,
        }
      );

      throw error;
    }

    // 🎯 Erreurs métier - on log et on continue
    logger.info(
      "Authentification optionnelle échouée",
      { error: error.message },
      {
        action: "optional_auth_failed",
        endpoint: `${request.method} ${request.url}`,
      }
    );
  }
};

/**
 * 👑 Middleware: Admin-only access (future use)
 */
export const requireAdmin = async (request, reply) => {
  await authenticateToken(request, reply);

  if (!request.user.isAdmin) {
    logger.warn(
      "Tentative d'accès admin non autorisée",
      {
        userId: request.user._id,
        email: request.user.email,
      },
      {
        userId: request.user._id.toString(),
        action: "unauthorized_admin_access",
        endpoint: `${request.method} ${request.url}`,
      }
    );

    return reply.code(403).send({
      error: "Access denied",
      message: "Administrator rights are required",
    });
  }
};

/**
 * 💳 Middleware: Premium subscription required
 */
export const requirePremium = async (request, reply) => {
  await authenticateToken(request, reply);

  const allowedStatuses = ["premium", "enterprise"];
  if (!allowedStatuses.includes(request.user.subscriptionStatus)) {
    logger.info(
      "Accès premium requis",
      {
        userId: request.user._id,
        currentSubscription: request.user.subscriptionStatus,
      },
      {
        userId: request.user._id.toString(),
        action: "premium_access_required",
        endpoint: `${request.method} ${request.url}`,
      }
    );

    return reply.code(402).send({
      error: "Subscription required",
      message: "This feature requires a premium or enterprise subscription",
      requiredSubscription: "premium",
    });
  }
};

/**
 * 📧 Middleware: Email sending rate limit check
 */
export const checkEmailLimits = async (request, reply) => {
  if (!request.user) {
    return reply.code(401).send({
      error: "Authentication required",
    });
  }

  if (!request.user.canSendEmail()) {
    const limits = {
      free: 50,
      premium: 500,
      enterprise: 5000,
    };

    logger.warn(
      "Limite d'emails atteinte",
      {
        userId: request.user._id,
        emailsSentToday: request.user.security.emailsSentToday,
        dailyLimit: limits[request.user.subscriptionStatus],
        subscriptionStatus: request.user.subscriptionStatus,
      },
      {
        userId: request.user._id.toString(),
        action: "email_limit_reached",
        endpoint: `${request.method} ${request.url}`,
      }
    );

    return reply.code(429).send({
      error: "Email limit reached",
      message: `You have reached your daily limit of ${limits[request.user.subscriptionStatus]} emails`,
      dailyLimit: limits[request.user.subscriptionStatus],
      emailsSentToday: request.user.security.emailsSentToday,
      subscriptionStatus: request.user.subscriptionStatus,
    });
  }
};

/**
 * 🔒 Fastify Hook: Load user from JWT before route handlers
 * A more "Fastify-native" alternative to classic middleware
 */
export const jwtPreHandler = {
  preHandler: authenticateToken,
};

export const optionalJwtPreHandler = {
  preHandler: optionalAuth,
};

export const premiumPreHandler = {
  preHandler: requirePremium,
};

export const emailLimitsPreHandler = {
  preHandler: [authenticateToken, checkEmailLimits],
};
