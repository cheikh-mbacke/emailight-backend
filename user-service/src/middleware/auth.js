const User = require("../models/User");

/**
 * 🔐 JWT Authentication Middleware for Fastify
 * Uses @fastify/jwt which is pre-configured in the app
 */
const authenticateToken = async (request, reply) => {
  try {
    // Verify and decode JWT (handled by @fastify/jwt)
    await request.jwtVerify();

    // Decoded payload is available as request.user
    const userId = request.user.userId;

    if (!userId) {
      return reply.code(401).send({
        error: "Invalid token",
        message: "User ID is missing from token",
      });
    }

    // Fetch the user from the database
    const user = await User.findById(userId);

    if (!user) {
      return reply.code(401).send({
        error: "User not found",
        message: "The user associated with this token no longer exists",
      });
    }

    // Check if the account is active
    if (!user.isActive) {
      return reply.code(401).send({
        error: "Account disabled",
        message: "Your account has been deactivated",
      });
    }

    // Check if the account is locked
    if (user.isAccountLocked()) {
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
  } catch (error) {
    // Handle specific JWT errors
    if (error.code === "FST_JWT_NO_AUTHORIZATION_IN_HEADER") {
      return reply.code(401).send({
        error: "Missing token",
        message: "Authorization header required with a Bearer token",
      });
    }

    if (error.code === "FST_JWT_AUTHORIZATION_TOKEN_EXPIRED") {
      return reply.code(401).send({
        error: "Token expired",
        message: "Your session has expired, please log in again",
      });
    }

    if (error.code === "FST_JWT_AUTHORIZATION_TOKEN_INVALID") {
      return reply.code(401).send({
        error: "Invalid token",
        message: "The authentication token is invalid",
      });
    }

    // General error
    request.log.error("Authentication error:", error);
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
const optionalAuth = async (request, reply) => {
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
      } else {
        request.user = null;
      }
    } else {
      request.user = null;
    }
  } catch (error) {
    request.user = null;
  }
};

/**
 * 👑 Middleware: Admin-only access (future use)
 */
const requireAdmin = async (request, reply) => {
  await authenticateToken(request, reply);

  if (!request.user.isAdmin) {
    return reply.code(403).send({
      error: "Access denied",
      message: "Administrator rights are required",
    });
  }
};

/**
 * 💳 Middleware: Premium subscription required
 */
const requirePremium = async (request, reply) => {
  await authenticateToken(request, reply);

  const allowedStatuses = ["premium", "enterprise"];
  if (!allowedStatuses.includes(request.user.subscriptionStatus)) {
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
const checkEmailLimits = async (request, reply) => {
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
const jwtPreHandler = {
  preHandler: authenticateToken,
};

const optionalJwtPreHandler = {
  preHandler: optionalAuth,
};

const premiumPreHandler = {
  preHandler: requirePremium,
};

const emailLimitsPreHandler = {
  preHandler: [authenticateToken, checkEmailLimits],
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  requirePremium,
  checkEmailLimits,
  jwtPreHandler,
  optionalJwtPreHandler,
  premiumPreHandler,
  emailLimitsPreHandler,
};
