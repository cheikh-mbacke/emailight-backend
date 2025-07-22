import AuthController from "../controllers/authController.js";
import { authenticateToken } from "../middleware/auth.js";
import {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateForgotPassword,
  validateResetPassword,
  validateRefreshToken,
  validateGoogleAuth,
} from "../middleware/validation.js";
import {
  loginRateLimit,
  createRateLimitMiddleware,
} from "../middleware/rateLimiting.js";

/**
 * 🔐 Authentication routes plugin
 */
async function authRoutes(fastify, options) {
  // ============================================================================
  // 📝 USER REGISTRATION
  // ============================================================================
  fastify.post(
    "/register",
    {
      attachValidation: true, // Désactive la validation automatique Fastify
      preHandler: [
        createRateLimitMiddleware({
          max: 3,
          window: 60 * 60 * 1000, // 1 heure
          keyGenerator: (request) => `register:${request.ip}`,
          message: "Trop de tentatives d'inscription. Réessayez dans 1 heure.",
        }),
        validateRegister,
      ],
      schema: {
        tags: ["Authentication"],
        summary: "Register a new user",
        body: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: {
              type: "string",
              minLength: 2,
              maxLength: 100,
              description: "User's full name",
            },
            email: {
              type: "string",
              format: "email",
              description: "User's email address",
            },
            password: {
              type: "string",
              minLength: 6,
              description: "User's password (min 6 characters)",
            },
          },
          additionalProperties: false,
        },
        response: {
          201: {
            type: "object",
            properties: {
              status: {
                type: "string",
                enum: ["success"],
                description: "Response status",
              },
              data: {
                type: "object",
                properties: {
                  accessToken: {
                    type: "string",
                    description: "JWT access token",
                  },
                  refreshToken: {
                    type: "string",
                    description: "JWT refresh token",
                  },
                  expiresIn: {
                    type: "string",
                    description: "Token expiration time",
                  },
                },
                required: ["accessToken", "refreshToken", "expiresIn"],
              },
              message: { type: "string", description: "Success message" },
            },
            required: ["status", "data", "message"],
          },
          400: {
            type: "object",
            properties: {
              status: {
                type: "string",
                enum: ["failed"],
                description: "Response status",
              },
              errorCode: {
                type: "string",
                description: "HTTP status code",
                example: "400",
              },
              errorName: {
                type: "string",
                description: "Error name/type",
                example: "VALIDATION_ERROR",
              },
              errorMessage: {
                type: "string",
                description: "Error message",
                example: "Email is required",
              },
            },
            required: ["status", "errorCode", "errorName", "errorMessage"],
          },
          409: {
            type: "object",
            properties: {
              status: {
                type: "string",
                enum: ["failed"],
                description: "Response status",
              },
              errorCode: {
                type: "string",
                description: "HTTP status code",
                example: "409",
              },
              errorName: {
                type: "string",
                description: "Error name/type",
                example: "EMAIL_ALREADY_EXISTS",
              },
              errorMessage: {
                type: "string",
                description: "Error message",
                example: "Email already exists",
              },
            },
            required: ["status", "errorCode", "errorName", "errorMessage"],
          },
          500: {
            type: "object",
            properties: {
              status: {
                type: "string",
                enum: ["failed"],
                description: "Response status",
              },
              errorCode: {
                type: "string",
                description: "HTTP status code",
                example: "500",
              },
              errorName: {
                type: "string",
                description: "Error name/type",
                example: "SYSTEM_ERROR",
              },
              errorMessage: {
                type: "string",
                description: "Error message",
                example: "Internal server error",
              },
            },
            required: ["status", "errorCode", "errorName", "errorMessage"],
          },
        },
      },
    },
    AuthController.register
  );

  // ============================================================================
  // 🔑 USER LOGIN
  // ============================================================================
  fastify.post(
    "/login",
    {
      attachValidation: true, // Désactive la validation automatique Fastify
      preHandler: [loginRateLimit, validateLogin],
      schema: {
        tags: ["Authentication"],
        summary: "User login",
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              description: "User's email address",
            },
            password: {
              type: "string",
              description: "User's password",
            },
          },
          additionalProperties: false,
        },
        response: {
          200: {
            type: "object",
            properties: {
              status: {
                type: "string",
                enum: ["success"],
                description: "Response status",
              },
              data: {
                type: "object",
                properties: {
                  accessToken: {
                    type: "string",
                    description: "JWT access token",
                  },
                  refreshToken: {
                    type: "string",
                    description: "JWT refresh token",
                  },
                  expiresIn: {
                    type: "string",
                    description: "Token expiration time",
                  },
                },
                required: ["accessToken", "refreshToken", "expiresIn"],
              },
              message: { type: "string", description: "Success message" },
            },
            required: ["status", "data", "message"],
          },
          400: {
            type: "object",
            properties: {
              status: {
                type: "string",
                enum: ["failed"],
                description: "Response status",
              },
              errorCode: {
                type: "string",
                description: "HTTP status code",
                example: "400",
              },
              errorName: {
                type: "string",
                description: "Error name/type",
                example: "VALIDATION_ERROR",
              },
              errorMessage: {
                type: "string",
                description: "Error message",
                example: "Email is required",
              },
            },
            required: ["status", "errorCode", "errorName", "errorMessage"],
          },
          401: {
            type: "object",
            properties: {
              status: {
                type: "string",
                enum: ["failed"],
                description: "Response status",
              },
              errorCode: {
                type: "string",
                description: "HTTP status code",
                example: "401",
              },
              errorName: {
                type: "string",
                description: "Error name/type",
                example: "INVALID_CREDENTIALS",
              },
              errorMessage: {
                type: "string",
                description: "Error message",
                example: "Invalid email or password",
              },
            },
            required: ["status", "errorCode", "errorName", "errorMessage"],
          },
          429: {
            type: "object",
            properties: {
              status: {
                type: "string",
                enum: ["failed"],
                description: "Response status",
              },
              errorCode: {
                type: "string",
                description: "HTTP status code",
                example: "429",
              },
              errorName: {
                type: "string",
                description: "Error name/type",
                example: "RATE_LIMIT_EXCEEDED",
              },
              errorMessage: {
                type: "string",
                description: "Error message",
                example: "Too many login attempts",
              },
            },
            required: ["status", "errorCode", "errorName", "errorMessage"],
          },
          500: {
            type: "object",
            properties: {
              status: {
                type: "string",
                enum: ["failed"],
                description: "Response status",
              },
              errorCode: {
                type: "string",
                description: "HTTP status code",
                example: "500",
              },
              errorName: {
                type: "string",
                description: "Error name/type",
                example: "SYSTEM_ERROR",
              },
              errorMessage: {
                type: "string",
                description: "Error message",
                example: "Internal server error",
              },
            },
            required: ["status", "errorCode", "errorName", "errorMessage"],
          },
        },
      },
    },
    AuthController.login
  );

  // ============================================================================
  // 🔄 REFRESH TOKEN
  // ============================================================================
  fastify.post(
    "/refresh-token",
    {
      attachValidation: true, // Désactive la validation automatique Fastify
      preHandler: validateRefreshToken,
      schema: {
        tags: ["Authentication"],
        summary: "Refresh access token",
        description: "Generate a new access token using a valid refresh token",
        body: {
          type: "object",
          required: ["refreshToken"],
          properties: {
            refreshToken: {
              type: "string",
              description: "Valid refresh token obtained from login/register",
            },
          },
          additionalProperties: false,
        },
        response: {
          200: {
            type: "object",
            properties: {
              status: {
                type: "string",
                enum: ["success"],
                description: "Response status",
              },
              data: {
                type: "object",
                properties: {
                  accessToken: {
                    type: "string",
                    description: "New JWT access token",
                  },
                  expiresIn: {
                    type: "string",
                    description: "Token expiration time",
                  },
                },
                required: ["accessToken", "expiresIn"],
              },
              message: {
                type: "string",
                description: "Success message",
              },
            },
            required: ["status", "data", "message"],
          },
          400: {
            type: "object",
            properties: {
              status: {
                type: "string",
                enum: ["failed"],
                description: "Response status",
              },
              errorCode: {
                type: "string",
                description: "HTTP status code",
                example: "400",
              },
              errorName: {
                type: "string",
                description: "Error name/type",
                example: "VALIDATION_ERROR",
              },
              errorMessage: {
                type: "string",
                description: "Error message",
                example: "Refresh token is required",
              },
            },
            required: ["status", "errorCode", "errorName", "errorMessage"],
          },
          401: {
            type: "object",
            properties: {
              status: {
                type: "string",
                enum: ["failed"],
                description: "Response status",
              },
              errorCode: {
                type: "string",
                description: "HTTP status code",
                example: "401",
              },
              errorName: {
                type: "string",
                description: "Error name/type",
                example: "INVALID_TOKEN",
              },
              errorMessage: {
                type: "string",
                description: "Error message",
                example: "Invalid or expired refresh token",
              },
            },
            required: ["status", "errorCode", "errorName", "errorMessage"],
          },
          500: {
            type: "object",
            properties: {
              status: {
                type: "string",
                enum: ["failed"],
                description: "Response status",
              },
              errorCode: {
                type: "string",
                description: "HTTP status code",
                example: "500",
              },
              errorName: {
                type: "string",
                description: "Error name/type",
                example: "SYSTEM_ERROR",
              },
              errorMessage: {
                type: "string",
                description: "Error message",
                example: "Internal server error",
              },
            },
            required: ["status", "errorCode", "errorName", "errorMessage"],
          },
        },
      },
    },
    AuthController.refreshToken
  );

  // ============================================================================
  // 🔍 GOOGLE OAUTH AUTHENTICATION
  // ============================================================================
  fastify.post(
    "/google",
    {
      preHandler: validateGoogleAuth,
      schema: {
        tags: ["Authentication"],
        summary: "Google OAuth authentication",
        description: "Authenticate user using Google OAuth2 token",
        // Pas de validation body ici - gérée par le middleware Joi avec traductions
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  user: { type: "object" },
                  accessToken: { type: "string" },
                  refreshToken: { type: "string" },
                  expiresIn: { type: "string" },
                  isNew: {
                    type: "boolean",
                    description: "True if this is a new account",
                  },
                  linkedAccount: {
                    type: "boolean",
                    description:
                      "True if existing email account was linked to Google",
                  },
                },
              },
              message: { type: "string" },
            },
          },
        },
      },
    },
    AuthController.googleAuth
  );

  // ============================================================================
  // 🚪 LOGOUT
  // ============================================================================
  fastify.post(
    "/logout",
    {
      preHandler: authenticateToken,
      schema: {
        tags: ["Authentication"],
        summary: "User logout",
        security: [{ bearerAuth: [] }],
      },
    },
    AuthController.logout
  );

  // ============================================================================
  // 👤 CURRENT USER PROFILE
  // ============================================================================
  fastify.get(
    "/me",
    {
      preHandler: authenticateToken,
      schema: {
        tags: ["Authentication"],
        summary: "Get the connected user profile",
        security: [{ bearerAuth: [] }],
      },
    },
    AuthController.getProfile
  );

  // ============================================================================
  // ✏️ UPDATE PROFILE
  // ============================================================================
  fastify.patch(
    "/me",
    {
      preHandler: [authenticateToken, validateUpdateProfile],
      schema: {
        tags: ["Authentication"],
        summary: "Update user profile",
        security: [{ bearerAuth: [] }],
        // Pas de validation body ici - gérée par le middleware Joi avec traductions
      },
    },
    AuthController.updateProfile
  );

  // ============================================================================
  // 🗑️ DELETE ACCOUNT (GDPR)
  // ============================================================================
  fastify.delete(
    "/me",
    {
      preHandler: authenticateToken,
      schema: {
        tags: ["Authentication"],
        summary: "Permanently delete user account",
        security: [{ bearerAuth: [] }],
      },
    },
    AuthController.deleteAccount
  );

  // ============================================================================
  // 🔄 FORGOT PASSWORD
  // ============================================================================
  fastify.post(
    "/forgot-password",
    {
      preHandler: [
        createRateLimitMiddleware({
          max: 3,
          window: 60 * 60 * 1000, // 1 heure
          keyGenerator: (request) => `forgot-password:${request.ip}`,
          message:
            "Trop de demandes de réinitialisation. Réessayez dans 1 heure.",
        }),
        validateForgotPassword,
      ],
      schema: {
        tags: ["Authentication"],
        summary: "Request password reset",
        // Pas de validation body ici - gérée par le middleware Joi avec traductions
      },
    },
    AuthController.forgotPassword
  );

  // ============================================================================
  // 🔒 RESET PASSWORD
  // ============================================================================
  fastify.post(
    "/reset-password",
    {
      preHandler: [
        createRateLimitMiddleware({
          max: 5,
          window: 15 * 60 * 1000, // 15 minutes
          keyGenerator: (request) => `reset-password:${request.ip}`,
          message:
            "Trop de tentatives de réinitialisation. Réessayez dans 15 minutes.",
        }),
        validateResetPassword,
      ],
      schema: {
        tags: ["Authentication"],
        summary: "Reset password using a token",
        // Pas de validation body ici - gérée par le middleware Joi avec traductions
      },
    },
    AuthController.resetPassword
  );

  // ============================================================================
  // 🧪 TEST TOKEN GENERATOR (DEVELOPMENT ONLY)
  // ============================================================================
  if (process.env.NODE_ENV === "development") {
    fastify.post(
      "/test/generate-tokens",
      {
        preHandler: authenticateToken,
        schema: {
          tags: ["Authentication"],
          summary:
            "Generate test refresh token with custom expiration (DEV ONLY)",
          description:
            "Generate refresh token for testing purposes with custom expiration time",
          security: [{ bearerAuth: [] }],
          body: {
            type: "object",
            properties: {
              refreshTokenExpiresIn: {
                type: "string",
                default: "7d",
                description:
                  "Refresh token expiration (e.g., '1s', '1m', '1h', '7d')",
              },
            },
            additionalProperties: false,
          },
          response: {
            200: {
              type: "object",
              properties: {
                status: {
                  type: "string",
                  enum: ["success"],
                  description: "Response status",
                },
                data: {
                  type: "object",
                  properties: {
                    refreshToken: {
                      type: "string",
                      description: "JWT refresh token with custom expiration",
                    },
                    refreshTokenExpiresIn: {
                      type: "string",
                      description: "Refresh token expiration time",
                    },
                    generatedAt: {
                      type: "string",
                      description: "Timestamp when token was generated",
                    },
                  },
                  required: [
                    "refreshToken",
                    "refreshTokenExpiresIn",
                    "generatedAt",
                  ],
                },
                message: {
                  type: "string",
                  description: "Success message",
                },
              },
              required: ["status", "data", "message"],
            },
            400: {
              type: "object",
              properties: {
                status: {
                  type: "string",
                  enum: ["failed"],
                  description: "Response status",
                },
                errorCode: {
                  type: "string",
                  description: "HTTP status code",
                  example: "400",
                },
                errorName: {
                  type: "string",
                  description: "Error name/type",
                  example: "VALIDATION_ERROR",
                },
                errorMessage: {
                  type: "string",
                  description: "Error message",
                  example: "Invalid user ID",
                },
              },
              required: ["status", "errorCode", "errorName", "errorMessage"],
            },
          },
        },
      },
      AuthController.generateTestTokens
    );
  }
}

export default authRoutes;
