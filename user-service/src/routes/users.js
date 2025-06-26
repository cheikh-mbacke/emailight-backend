const UserController = require("../controllers/userController");
const { authenticateToken } = require("../middleware/auth");

/**
 * 👤 User routes plugin
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
  // 📧 GET CONNECTED EMAIL ACCOUNTS
  // ============================================================================
  fastify.get(
    "/me/email-accounts",
    {
      preHandler: authenticateToken,
      schema: {
        tags: ["Users"],
        summary: "List connected email accounts",
        description: "Returns connected email accounts with their status",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            active: {
              type: "boolean",
              description: "Filter by active/inactive status",
            },
            provider: {
              type: "string",
              enum: ["gmail", "outlook", "yahoo", "other"],
              description: "Filter by email provider",
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
                  accounts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        email: { type: "string" },
                        provider: { type: "string" },
                        isActive: { type: "boolean" },
                        healthStatus: { type: "string" },
                        lastUsed: { type: "string", format: "date-time" },
                      },
                    },
                  },
                  total: { type: "number" },
                  summary: {
                    type: "object",
                    properties: {
                      active: { type: "number" },
                      healthy: { type: "number" },
                      needsAttention: { type: "number" },
                    },
                  },
                },
              },
              message: { type: "string" },
            },
          },
        },
      },
    },
    UserController.getEmailAccounts
  );

  // ============================================================================
  // 🗑️ DISCONNECT EMAIL ACCOUNT
  // ============================================================================
  fastify.delete(
    "/me/email-accounts/:accountId",
    {
      preHandler: authenticateToken,
      schema: {
        tags: ["Users"],
        summary: "Disconnect an email account",
        description: "Permanently deletes a connected email account",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["accountId"],
          properties: {
            accountId: {
              type: "string",
              pattern: "^[0-9a-fA-F]{24}$",
              description: "MongoDB ID of the account to disconnect",
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
                  disconnectedAccount: {
                    type: "object",
                    properties: {
                      email: { type: "string" },
                      provider: { type: "string" },
                    },
                  },
                  disconnectedAt: { type: "string", format: "date-time" },
                },
              },
              message: { type: "string" },
            },
          },
        },
      },
    },
    UserController.disconnectEmailAccount
  );

  // ============================================================================
  // 🔄 REFRESH EMAIL ACCOUNT TOKENS
  // ============================================================================
  fastify.post(
    "/me/email-accounts/:accountId/refresh",
    {
      preHandler: authenticateToken,
      schema: {
        tags: ["Users"],
        summary: "Refresh tokens for email account",
        description:
          "Attempts to renew OAuth tokens for a connected email account",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["accountId"],
          properties: {
            accountId: {
              type: "string",
              pattern: "^[0-9a-fA-F]{24}$",
              description: "MongoDB ID of the account to refresh",
            },
          },
        },
        response: {
          501: {
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    UserController.refreshEmailAccount
  );

  // ============================================================================
  // 🧪 CHECK EMAIL ACCOUNT HEALTH
  // ============================================================================
  fastify.get(
    "/me/email-accounts/:accountId/health",
    {
      preHandler: authenticateToken,
      schema: {
        tags: ["Users"],
        summary: "Check health of email account",
        description: "Runs a diagnostic on the connected email account",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["accountId"],
          properties: {
            accountId: {
              type: "string",
              pattern: "^[0-9a-fA-F]{24}$",
              description: "MongoDB ID of the account to diagnose",
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
                  account: {
                    type: "object",
                    properties: {
                      email: { type: "string" },
                      provider: { type: "string" },
                    },
                  },
                  health: {
                    type: "object",
                    properties: {
                      status: { type: "string" },
                      isActive: { type: "boolean" },
                      isTokenExpired: { type: "boolean" },
                      errorCount: { type: "number" },
                      lastError: { type: "string" },
                      lastUsed: { type: "string", format: "date-time" },
                      recommendations: {
                        type: "array",
                        items: { type: "string" },
                      },
                    },
                  },
                },
              },
              message: { type: "string" },
            },
          },
        },
      },
    },
    UserController.checkEmailAccountHealth
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

  // ============================================================================
  // 🧹 CLEANUP INACTIVE EMAIL ACCOUNTS
  // ============================================================================
  fastify.post(
    "/me/email-accounts/cleanup",
    {
      preHandler: authenticateToken,
      schema: {
        tags: ["Users"],
        summary: "Clean up inactive email accounts",
        description:
          "Automatically disables inactive or failing email accounts",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  accountsDeactivated: { type: "number" },
                  cleanupDate: { type: "string", format: "date-time" },
                },
              },
              message: { type: "string" },
            },
          },
        },
      },
    },
    UserController.cleanupEmailAccounts
  );
}

module.exports = userRoutes;
