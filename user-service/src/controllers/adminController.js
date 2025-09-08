// ============================================================================
// 📁 src/controllers/adminController.js - Contrôleur d'administration
// ============================================================================

import SearchService from "../services/searchService.js";
import UserService from "../services/userService.js";
import SecurityService from "../services/securityService.js";

/**
 * 🛡️ Admin Controller - Fonctionnalités d'administration
 */
class AdminController {
  /**
   * 📊 Get global user statistics
   */
  static async getGlobalStats(request, reply) {
    try {
      const stats = await UserService.getGlobalStats();
      return reply.success(stats, "Statistiques globales récupérées");
    } catch (error) {
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          status: "failed",
          errorCode: String(error.statusCode),
          errorName: error.code || "ADMIN_STATS_ERROR",
          errorMessage: error.message,
        });
      }
      throw error;
    }
  }

  /**
   * 🔍 Search users with pagination (admin only)
   */
  static async searchUsers(request, reply) {
    try {
      const {
        query,
        status,
        authProvider,
        subscriptionStatus,
        dateFrom,
        dateTo,
        page,
        limit,
        sortBy,
        sortOrder,
        includeInactive,
        includeSecurityInfo,
      } = request.query;

      const filters = {
        query,
        status,
        authProvider,
        subscriptionStatus,
        dateFrom,
        dateTo,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        sortBy: sortBy || "createdAt",
        sortOrder: sortOrder || "desc",
      };

      const options = {
        includeInactive: includeInactive === "true",
        includeSecurityInfo: includeSecurityInfo === "true",
        baseUrl: `${request.protocol}://${request.hostname}${
          request.url.split("?")[0]
        }`,
      };

      const result = await SearchService.searchUsers(filters, options);
      return reply.success(result, "Recherche d'utilisateurs effectuée");
    } catch (error) {
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          status: "failed",
          errorCode: String(error.statusCode),
          errorName: error.code || "ADMIN_SEARCH_ERROR",
          errorMessage: error.message,
        });
      }
      throw error;
    }
  }

  /**
   * 🔒 Get security statistics
   */
  static async getSecurityStats(request, reply) {
    try {
      const stats = await SecurityService.getSecurityStatistics();
      return reply.success(stats, "Statistiques de sécurité récupérées");
    } catch (error) {
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          status: "failed",
          errorCode: String(error.statusCode),
          errorName: error.code || "SECURITY_STATS_ERROR",
          errorMessage: error.message,
        });
      }
      throw error;
    }
  }

  /**
   * 🔓 Unlock user account (admin only)
   */
  static async unlockUserAccount(request, reply) {
    try {
      const { userId } = request.params;
      const { reason } = request.body;

      const result = await SecurityService.unlockUserAccount(userId, {
        unlockedBy: request.user._id,
        reason: reason || "Unlocked by admin",
      });

      return reply.success(result, "Compte utilisateur déverrouillé");
    } catch (error) {
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          status: "failed",
          errorCode: String(error.statusCode),
          errorName: error.code || "UNLOCK_ACCOUNT_ERROR",
          errorMessage: error.message,
        });
      }
      throw error;
    }
  }

  /**
   * 🚫 Lock user account (admin only)
   */
  static async lockUserAccount(request, reply) {
    try {
      const { userId } = request.params;
      const { reason, duration } = request.body;

      const result = await SecurityService.lockUserAccount(userId, {
        lockedBy: request.user._id,
        reason: reason || "Locked by admin",
        duration: duration || "24h",
      });

      return reply.success(result, "Compte utilisateur verrouillé");
    } catch (error) {
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          status: "failed",
          errorCode: String(error.statusCode),
          errorName: error.code || "LOCK_ACCOUNT_ERROR",
          errorMessage: error.message,
        });
      }
      throw error;
    }
  }

  /**
   * 📊 Get user activity statistics
   */
  static async getUserActivityStats(request, reply) {
    try {
      const { days = 30 } = request.query;
      const stats = await SearchService.getUserActivityStats(parseInt(days));
      return reply.success(stats, "Statistiques d'activité récupérées");
    } catch (error) {
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          status: "failed",
          errorCode: String(error.statusCode),
          errorName: error.code || "ACTIVITY_STATS_ERROR",
          errorMessage: error.message,
        });
      }
      throw error;
    }
  }
}

export default AdminController;
