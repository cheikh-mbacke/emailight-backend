import UserController from "../controllers/userController.js";
import { authenticateToken } from "../middleware/auth.js";

/**
 * 👤 User routes plugin - Routes de base utilisateur uniquement
 */
async function userRoutes(fastify, options) {
  // ============================================================================
  // 👤 GET CURRENT USER PROFILE
  // ============================================================================
  fastify.get(
    "/me",
    {
      preHandler: authenticateToken,
      schema: {
        tags: ["Users"],
        summary: "Get full user profile",
        description:
          "Returns the detailed profile including preferences, stats, and connected accounts",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  profile: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" },
                      email: { type: "string" },
                      subscriptionStatus: { type: "string" },
                      isEmailVerified: { type: "boolean" },
                    },
                  },
                  preferences: { type: "object" },
                  subscription: { type: "object" },
                  security: { type: "object" },
                  connectedAccounts: { type: "array" },
                  stats: { type: "object" },
                },
              },
              message: { type: "string" },
            },
          },
        },
      },
    },
    UserController.getProfile
  );

  // ============================================================================
  // ✏️ QUICK PROFILE UPDATE (NAME ONLY)
  // ============================================================================
  fastify.patch(
    "/me",
    {
      preHandler: authenticateToken,
      schema: {
        tags: ["Users"],
        summary: "Quick profile update (name only)",
        description: "Allows the user to quickly update their name",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          properties: {
            name: {
              type: "string",
              minLength: 2,
              maxLength: 100,
              description: "New user name",
            },
          },
          required: ["name"],
          additionalProperties: false,
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
                  updated: { type: "boolean" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
              message: { type: "string" },
            },
          },
        },
      },
    },
    UserController.updateProfile
  );

  // ============================================================================
  // 🖼️ UPLOAD USER AVATAR - SOLUTION DÉFINITIVE
  // ============================================================================
  fastify.post(
    "/me/avatar",
    {
      preHandler: authenticateToken,
      schema: {
        tags: ["Users"],
        summary: "Upload user avatar",
        description: "Upload and update user profile picture (max 5MB)",
        security: [{ bearerAuth: [] }],
        // 🔥 SOLUTION: Utiliser le format OpenAPI 3.0 requestBody
        body: {
          type: "object",
          properties: {
            avatar: {
              type: "string",
              format: "binary",
            },
          },
          required: ["avatar"],
        },
        // 🔥 FORCER Swagger à comprendre que c'est multipart
        consumes: ["multipart/form-data"],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  user: { type: "object" },
                  avatar: {
                    type: "object",
                    properties: {
                      url: { type: "string" },
                      fileName: { type: "string" },
                      fileSize: { type: "number" },
                      uploadedAt: { type: "string", format: "date-time" },
                    },
                  },
                  updated: { type: "boolean" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
              message: { type: "string" },
            },
          },
        },
      },
      // 🔥 BYPASS la validation automatique du body pour multipart
      attachValidation: true,
    },
    async (request, reply) => {
      // 🔥 IGNORER les erreurs de validation pour multipart
      if (request.validationError && request.isMultipart()) {
        // Continuer le traitement normal
      } else if (request.validationError) {
        return reply.code(400).send(request.validationError);
      }

      // Appeler le controller normal
      return UserController.uploadAvatar(request, reply);
    }
  );

  // ============================================================================
  // 🗑️ DELETE USER AVATAR
  // ============================================================================
  fastify.delete(
    "/me/avatar",
    {
      preHandler: authenticateToken,
      schema: {
        tags: ["Users"],
        summary: "Delete user avatar",
        description: "Remove the current user avatar",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  deleted: { type: "boolean" },
                  deletedAvatar: { type: "string" },
                  deletedAt: { type: "string", format: "date-time" },
                  reason: { type: "string" },
                },
              },
              message: { type: "string" },
            },
          },
        },
      },
    },
    UserController.deleteAvatar
  );

  // ============================================================================
  // 🗑️ DELETE USER ACCOUNT (GDPR)
  // ============================================================================
  fastify.delete(
    "/me",
    {
      preHandler: authenticateToken,
      schema: {
        tags: ["Users"],
        summary: "Delete user account permanently",
        description:
          "Permanently delete the user account and all associated data (GDPR compliant)",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  accountDeleted: { type: "boolean" },
                  deletedAt: { type: "string", format: "date-time" },
                  email: { type: "string" },
                  deletedData: {
                    type: "object",
                    properties: {
                      emailAccounts: { type: "number" },
                      avatar: { type: "boolean" },
                      preferences: { type: "boolean" },
                      security: { type: "boolean" },
                    },
                  },
                  gdprCompliant: { type: "boolean" },
                },
              },
              message: { type: "string" },
            },
          },
        },
      },
    },
    UserController.deleteAccount
  );

  // ============================================================================
  // 📊 USER USAGE STATS
  // ============================================================================
  fastify.get(
    "/me/stats",
    {
      preHandler: authenticateToken,
      schema: {
        tags: ["Users"],
        summary: "Get user usage statistics",
        description: "Returns detailed usage stats and usage limits",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  user: {
                    type: "object",
                    properties: {
                      memberSince: { type: "string", format: "date-time" },
                      lastActive: { type: "string", format: "date-time" },
                      subscriptionStatus: { type: "string" },
                      isEmailVerified: { type: "boolean" },
                    },
                  },
                  usage: {
                    type: "object",
                    properties: {
                      emailsSentToday: { type: "number" },
                      dailyLimit: { type: "number" },
                      remainingEmails: { type: "number" },
                      canSendEmail: { type: "boolean" },
                    },
                  },
                  emailAccounts: {
                    type: "object",
                    properties: {
                      totalAccounts: { type: "number" },
                      activeAccounts: { type: "number" },
                      totalEmailsSent: { type: "number" },
                      providers: { type: "object" },
                    },
                  },
                  security: { type: "object" },
                },
              },
              message: { type: "string" },
            },
          },
        },
      },
    },
    UserController.getStats
  );

  // ============================================================================
  // 🔒 CHANGE PASSWORD (SECURE)
  // ============================================================================
  fastify.patch(
    "/me/password",
    {
      preHandler: authenticateToken,
      schema: {
        tags: ["Users"],
        summary: "Change password",
        description:
          "Secure password change with current password verification",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["currentPassword", "newPassword"],
          properties: {
            currentPassword: {
              type: "string",
              description: "Current password for verification",
            },
            newPassword: {
              type: "string",
              minLength: 6,
              maxLength: 128,
              description: "New password (minimum 6 characters)",
            },
          },
          additionalProperties: false,
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  passwordChanged: { type: "boolean" },
                  changedAt: { type: "string", format: "date-time" },
                },
              },
              message: { type: "string" },
            },
          },
        },
      },
    },
    UserController.changePassword
  );


}

export default userRoutes;
