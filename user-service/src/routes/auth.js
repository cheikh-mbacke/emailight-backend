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
      preHandler: validateRegister,
      schema: {
        tags: ["Authentication"],
        summary: "Register a new user",
        body: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", minLength: 2, maxLength: 100 },
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 6 },
          },
        },
        response: {
          201: {
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
                },
              },
              message: { type: "string" },
            },
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
      preHandler: validateLogin,
      schema: {
        tags: ["Authentication"],
        summary: "User login",
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
        },
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
                  lastLogin: { type: "string", format: "date-time" },
                },
              },
              message: { type: "string" },
            },
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
              description: "Valid refresh token",
            },
          },
        },
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
                },
              },
              message: { type: "string" },
            },
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
        body: {
          type: "object",
          required: ["googleToken"],
          properties: {
            googleToken: {
              type: "string",
              description: "Google ID token from OAuth2 flow",
            },
          },
        },
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
        body: {
          type: "object",
          properties: {
            name: { type: "string", minLength: 2, maxLength: 100 },
            email: { type: "string", format: "email" },
            currentPassword: { type: "string" },
            newPassword: { type: "string", minLength: 6 },
          },
        },
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
      preHandler: validateForgotPassword,
      schema: {
        tags: ["Authentication"],
        summary: "Request password reset",
        body: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string", format: "email" },
          },
        },
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
      preHandler: validateResetPassword,
      schema: {
        tags: ["Authentication"],
        summary: "Reset password using a token",
        body: {
          type: "object",
          required: ["token", "password"],
          properties: {
            token: { type: "string" },
            password: { type: "string", minLength: 6 },
          },
        },
      },
    },
    AuthController.resetPassword
  );
}

export default authRoutes;
