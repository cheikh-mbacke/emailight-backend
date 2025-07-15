// ============================================================================
// 📁 src/routes/admin.js - Routes d'administration
// ============================================================================

import AdminController from "../controllers/adminController.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

/**
 * 🛡️ Admin routes plugin - Routes d'administration uniquement
 */
async function adminRoutes(fastify, options) {
  // ============================================================================
  // 📊 GLOBAL STATISTICS
  // ============================================================================
  fastify.get(
    "/stats/global",
    {
      preHandler: [authenticateToken, requireAdmin],
      schema: {
        tags: ["Admin"],
        summary: "Get global user statistics",
        description: "Returns comprehensive global statistics about users",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  timestamp: { type: "string", format: "date-time" },
                  bySubscription: { type: "array" },
                  byAuthProvider: { type: "array" },
                  createdByMonth: { type: "array" },
                  securityMetrics: { type: "array" },
                },
              },
              message: { type: "string" },
            },
          },
        },
      },
    },
    AdminController.getGlobalStats
  );

  // ============================================================================
  // 🔍 SEARCH USERS WITH PAGINATION
  // ============================================================================
  fastify.get(
    "/users/search",
    {
      preHandler: [authenticateToken, requireAdmin],
      schema: {
        tags: ["Admin"],
        summary: "Search users with pagination",
        description: "Advanced user search with filtering and pagination",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query for name or email",
            },
            status: {
              type: "string",
              enum: ["active", "inactive"],
              description: "Filter by user status",
            },
            authProvider: {
              type: "string",
              enum: ["local", "google"],
              description: "Filter by authentication provider",
            },
            subscriptionStatus: {
              type: "string",
              enum: ["free", "premium", "enterprise"],
              description: "Filter by subscription status",
            },
            dateFrom: {
              type: "string",
              format: "date",
              description: "Filter users created from this date",
            },
            dateTo: {
              type: "string",
              format: "date",
              description: "Filter users created until this date",
            },
            includeInactive: {
              type: "boolean",
              default: false,
              description: "Include inactive users in results",
            },
            includeSecurityInfo: {
              type: "boolean",
              default: false,
              description: "Include security information in results",
            },
            // Paramètres de pagination
            page: {
              type: "integer",
              minimum: 1,
              default: 1,
              description: "Numéro de page (défaut: 1)",
            },
            limit: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 20,
              description: "Nombre d'éléments par page (défaut: 20, max: 100)",
            },
            sortBy: {
              type: "string",
              enum: [
                "createdAt",
                "lastActive",
                "name",
                "email",
                "subscriptionStatus",
              ],
              default: "createdAt",
              description: "Champ de tri",
            },
            sortOrder: {
              type: "string",
              enum: ["asc", "desc"],
              default: "desc",
              description: "Ordre de tri",
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
                  data: {
                    type: "array",
                    items: { type: "object" },
                  },
                  pagination: {
                    type: "object",
                    properties: {
                      page: { type: "integer" },
                      limit: { type: "integer" },
                      total: { type: "integer" },
                      totalPages: { type: "integer" },
                      hasNext: { type: "boolean" },
                      hasPrev: { type: "boolean" },
                      nextPage: { type: ["integer", "null"] },
                      prevPage: { type: ["integer", "null"] },
                    },
                  },
                  meta: {
                    type: "object",
                    properties: {
                      timestamp: { type: "string", format: "date-time" },
                      totalResults: { type: "integer" },
                      resultsPerPage: { type: "integer" },
                      currentPage: { type: "integer" },
                    },
                  },
                  links: {
                    type: "object",
                    properties: {
                      self: { type: "string" },
                      first: { type: "string" },
                      last: { type: "string" },
                      prev: { type: ["string", "null"] },
                      next: { type: ["string", "null"] },
                    },
                  },
                  filters: { type: "object" },
                },
              },
              message: { type: "string" },
            },
          },
        },
      },
    },
    AdminController.searchUsers
  );

  // ============================================================================
  // 🔒 SECURITY STATISTICS
  // ============================================================================
  fastify.get(
    "/stats/security",
    {
      preHandler: [authenticateToken, requireAdmin],
      schema: {
        tags: ["Admin"],
        summary: "Get security statistics",
        description: "Returns security-related statistics and metrics",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    AdminController.getSecurityStats
  );

  // ============================================================================
  // 🔓 UNLOCK USER ACCOUNT
  // ============================================================================
  fastify.post(
    "/users/:userId/unlock",
    {
      preHandler: [authenticateToken, requireAdmin],
      schema: {
        tags: ["Admin"],
        summary: "Unlock user account",
        description: "Manually unlock a locked user account",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: {
              type: "string",
              pattern: "^[0-9a-fA-F]{24}$",
              description: "User ID to unlock",
            },
          },
        },
        body: {
          type: "object",
          properties: {
            reason: {
              type: "string",
              description: "Reason for unlocking the account",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    AdminController.unlockUserAccount
  );

  // ============================================================================
  // 🚫 LOCK USER ACCOUNT
  // ============================================================================
  fastify.post(
    "/users/:userId/lock",
    {
      preHandler: [authenticateToken, requireAdmin],
      schema: {
        tags: ["Admin"],
        summary: "Lock user account",
        description: "Manually lock a user account",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: {
              type: "string",
              pattern: "^[0-9a-fA-F]{24}$",
              description: "User ID to lock",
            },
          },
        },
        body: {
          type: "object",
          properties: {
            reason: {
              type: "string",
              description: "Reason for locking the account",
            },
            duration: {
              type: "string",
              description: "Lock duration (e.g., '24h', '7d')",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    AdminController.lockUserAccount
  );

  // ============================================================================
  // 📊 USER ACTIVITY STATISTICS
  // ============================================================================
  fastify.get(
    "/stats/activity",
    {
      preHandler: [authenticateToken, requireAdmin],
      schema: {
        tags: ["Admin"],
        summary: "Get user activity statistics",
        description:
          "Returns user activity statistics for the specified period",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            days: {
              type: "integer",
              minimum: 1,
              maximum: 365,
              default: 30,
              description: "Number of days to analyze (1-365)",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    AdminController.getUserActivityStats
  );
}

export default adminRoutes;
