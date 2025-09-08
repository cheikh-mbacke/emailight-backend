import ProfileController from "../controllers/profileController.js";
import UserController from "../controllers/userController.js";
import AuthController from "../controllers/authController.js";
import PasswordController from "../controllers/passwordController.js";
import { authenticateToken } from "../middleware/auth.js";
import {
  validateForgotPassword,
  validateResetPassword,
  validateUpdateProfile,
  validateChangePassword,
  validateRequestPasswordReset,
  validateResetPassword as validateResetPasswordToken,
} from "../middleware/validation.js";
import { createRateLimitMiddleware } from "../middleware/rateLimiting.js";

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
              status: { type: "string", example: "success" },
              data: {
                type: "object",
                properties: {
                  id: {
                    type: "string",
                    description: "ID unique de l'utilisateur",
                  },
                  name: { type: "string", description: "Nom de l'utilisateur" },
                  email: {
                    type: "string",
                    description: "Email de l'utilisateur",
                  },
                  subscriptionStatus: {
                    type: "string",
                    description: "Statut de l'abonnement",
                    example: "free",
                  },
                  isEmailVerified: {
                    type: "boolean",
                    description: "Email vérifié ou non",
                  },
                  isActive: {
                    type: "boolean",
                    description: "Compte actif ou non",
                  },
                  profilePictureUrl: {
                    type: "string",
                    nullable: true,
                    description: "URL de l'avatar",
                  },
                },
                required: [
                  "id",
                  "name",
                  "email",
                  "subscriptionStatus",
                  "isEmailVerified",
                  "isActive",
                ],
              },
              message: {
                type: "string",
                example: "Profil récupéré avec succès",
              },
            },
          },
        },
      },
    },
    ProfileController.getProfile
  );

  // ============================================================================
  // ✏️ QUICK PROFILE UPDATE (NAME AND/OR EMAIL)
  // ============================================================================
  fastify.patch(
    "/me",
    {
      preHandler: [authenticateToken, validateUpdateProfile],
      attachValidation: false, // Désactiver la validation Fastify
      schema: {
        tags: ["Users"],
        summary: "Quick profile update (name and/or email)",
        description:
          "Allows the user to quickly update their name and/or email. Body: { name?: string (2-100 chars), email?: string (valid email, max 255 chars) }",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "User's name (2-100 characters)",
            },
            email: {
              type: "string",
              description:
                "User's email address (valid email, max 255 characters)",
            },
          },
          // Schéma permissif pour Swagger uniquement
          // Aucune validation - tout est géré par Joi
        },
        // Exemples pour Swagger UI
        examples: [
          {
            name: "Update name only",
            value: {
              name: "John Doe",
            },
          },
          {
            name: "Update email only",
            value: {
              email: "john.doe@example.com",
            },
          },
          {
            name: "Update both name and email",
            value: {
              name: "John Doe",
              email: "john.doe@example.com",
            },
          },
        ],
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string", example: "success" },
              data: {
                type: "object",
                properties: {
                  id: {
                    type: "string",
                    description: "ID unique de l'utilisateur",
                  },
                  name: { type: "string", description: "Nom de l'utilisateur" },
                  email: {
                    type: "string",
                    description: "Email de l'utilisateur",
                  },
                },
                required: ["id", "name", "email"],
              },
              message: { type: "string" },
            },
          },
        },
      },
    },
    ProfileController.updateProfile
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
          // 🔥 Rendre le champ optionnel pour tester missingFileField
          // required: ["avatar"],
        },
        // 🔥 FORCER Swagger à comprendre que c'est multipart
        consumes: ["multipart/form-data"],
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string", example: "success" },
              data: {
                type: "object",
                properties: {
                  fileName: {
                    type: "string",
                    description: "Nom du fichier uploadé",
                  },
                  fileSize: {
                    type: "number",
                    description: "Taille du fichier en bytes",
                  },
                  avatarUrl: {
                    type: "string",
                    description: "URL complète de l'avatar",
                  },
                  uploadedAt: { type: "string", format: "date-time" },
                  updated: { type: "boolean" },
                  updatedAt: { type: "string", format: "date-time" },
                },
                required: [
                  "fileName",
                  "fileSize",
                  "avatarUrl",
                  "uploadedAt",
                  "updated",
                  "updatedAt",
                ],
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
      return ProfileController.uploadAvatar(request, reply);
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
              status: { type: "string", example: "success" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    ProfileController.deleteAvatar
  );

  // ============================================================================
  // 🗑️ DELETE USER ACCOUNT (GDPR)
  // ============================================================================
  fastify.delete(
    "/me",
    {
      preHandler: authenticateToken,
      attachValidation: false,
      schema: {
        tags: ["Users"],
        summary: "Delete user account permanently",
        description:
          "Permanently delete the user account and all associated data (GDPR compliant)",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          properties: {
            password: {
              type: "string",
              description:
                "User password for confirmation (required only for email-based accounts)",
            },
          },
          // Password is optional - validation is done in the service based on user type
        },
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string", example: "success" },
              message: { type: "string" },
            },
            required: ["status", "message"],
          },
        },
      },
    },
    UserController.deleteAccount
  );

  // ============================================================================
  // 🔐 CHANGE PASSWORD (Authenticated)
  // ============================================================================
  fastify.patch(
    "/me/password",
    {
      preHandler: [authenticateToken, validateChangePassword],
      attachValidation: false,
      schema: {
        tags: ["Users"],
        summary: "Change user password",
        description:
          "Change the current user's password. Requires current password for verification.",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          properties: {
            currentPassword: {
              type: "string",
              description: "Current password for verification",
            },
            newPassword: {
              type: "string",
              description:
                "New password (6-128 chars, must contain lowercase, uppercase, and number)",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string", example: "success" },
              data: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                },
              },
              message: { type: "string" },
            },
          },
        },
      },
    },
    PasswordController.changePassword
  );

  // ============================================================================
  // 📧 REQUEST PASSWORD RESET (Public)
  // ============================================================================
  fastify.post(
    "/me/forgot-password",
    {
      preHandler: [validateRequestPasswordReset],
      attachValidation: false,
      schema: {
        tags: ["Users"],
        summary: "Request password reset",
        description:
          "Request a password reset email. Always returns success for security.",
        body: {
          type: "object",
          properties: {
            email: {
              type: "string",
              format: "email",
              description: "User email address",
            },
          },
          required: ["email"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string", example: "success" },
              data: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                },
              },
              message: { type: "string" },
            },
          },
        },
      },
    },
    PasswordController.requestPasswordReset
  );

  // ============================================================================
  // 🔄 RESET PASSWORD WITH TOKEN (Public)
  // ============================================================================
  fastify.post(
    "/me/reset-password",
    {
      preHandler: [validateResetPasswordToken],
      attachValidation: false,
      schema: {
        tags: ["Users"],
        summary: "Reset password with token",
        description:
          "Reset user password using a valid reset token from email.",
        body: {
          type: "object",
          properties: {
            token: {
              type: "string",
              description: "Password reset token from email",
            },
            newPassword: {
              type: "string",
              description:
                "New password (6-128 chars, must contain lowercase, uppercase, and number)",
            },
          },
          required: ["token", "newPassword"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string", example: "success" },
              data: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                },
              },
              message: { type: "string" },
            },
          },
        },
      },
    },
    PasswordController.resetPassword
  );
}

export default userRoutes;
