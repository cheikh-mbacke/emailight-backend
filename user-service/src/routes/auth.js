const AuthController = require("../controllers/authController");
const { authenticateToken } = require("../middleware/auth");
const {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateForgotPassword,
  validateResetPassword,
} = require("../middleware/validation");

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
      },
    },
    AuthController.login
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

module.exports = authRoutes;
