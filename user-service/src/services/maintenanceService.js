// ============================================================================
// 📁 src/services/maintenanceService.js - Tâches de maintenance
// ============================================================================

import User from "../models/User.js";
import QuotaService from "./quotaService.js";

import SecurityService from "./securityService.js";
import { SystemError } from "../utils/customError.js";

class MaintenanceService {
  static setLogger(injectedLogger) {
    this.logger = injectedLogger;
  }

  /**
   * 🧹 Nettoyage global des données utilisateur
   */
  static async performMaintenance() {
    try {
      const maintenanceResults = {
        timestamp: new Date(),
        tasks: {},
      };

      // 1. Reset daily quotas
      try {
        const quotaReset = await QuotaService.resetDailyQuota();
        maintenanceResults.tasks.quotaReset = {
          success: true,
          resetCount: quotaReset.resetCount,
        };
      } catch (quotaError) {
        maintenanceResults.tasks.quotaReset = {
          success: false,
          error: quotaError.message,
        };
      }

      // 2. Cleanup orphaned avatar files
      try {
        const avatarCleanup = await AvatarService.cleanupOrphanedFiles();
        maintenanceResults.tasks.avatarCleanup = {
          success: true,
          ...avatarCleanup,
        };
      } catch (avatarError) {
        maintenanceResults.tasks.avatarCleanup = {
          success: false,
          error: avatarError.message,
        };
      }

      // 3. Cleanup expired tokens
      try {
        const tokenCleanup = await this.cleanupExpiredTokens();
        maintenanceResults.tasks.tokenCleanup = {
          success: true,
          ...tokenCleanup,
        };
      } catch (tokenError) {
        maintenanceResults.tasks.tokenCleanup = {
          success: false,
          error: tokenError.message,
        };
      }

      // 4. Unlock expired accounts
      try {
        const accountUnlock = await SecurityService.unlockExpiredAccounts();
        maintenanceResults.tasks.accountUnlock = {
          success: true,
          ...accountUnlock,
        };
      } catch (unlockError) {
        maintenanceResults.tasks.accountUnlock = {
          success: false,
          error: unlockError.message,
        };
      }

      // 5. Cleanup inactive users
      try {
        const inactiveCleanup = await this.cleanupInactiveUsers();
        maintenanceResults.tasks.inactiveCleanup = {
          success: true,
          ...inactiveCleanup,
        };
      } catch (inactiveError) {
        maintenanceResults.tasks.inactiveCleanup = {
          success: false,
          error: inactiveError.message,
        };
      }

      // 6. Optimize database indexes
      try {
        const indexOptimization = await this.optimizeIndexes();
        maintenanceResults.tasks.indexOptimization = {
          success: true,
          ...indexOptimization,
        };
      } catch (indexError) {
        maintenanceResults.tasks.indexOptimization = {
          success: false,
          error: indexError.message,
        };
      }

      this.logger?.info(
        "User service maintenance completed",
        maintenanceResults,
        { action: "user_service_maintenance_completed" }
      );

      return maintenanceResults;
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur lors de la maintenance", error, {
        action: "perform_user_service_maintenance_failed",
      });

      throw new SystemError(
        "Erreur lors de la maintenance du service utilisateur",
        error
      );
    }
  }

  /**
   * 🧹 Nettoie les tokens expirés
   */
  static async cleanupExpiredTokens() {
    try {
      const now = new Date();
      const tokenCleanup = await User.updateMany(
        {
          $or: [
            { emailVerificationExpires: { $lt: now } },
            { passwordResetExpires: { $lt: now } },
          ],
        },
        {
          $unset: {
            emailVerificationToken: 1,
            emailVerificationExpires: 1,
            passwordResetToken: 1,
            passwordResetExpires: 1,
          },
        }
      );

      this.logger?.info(
        "Expired tokens cleaned",
        {
          cleanedTokens: tokenCleanup.modifiedCount,
        },
        {
          action: "expired_tokens_cleaned",
        }
      );

      return {
        cleanedTokens: tokenCleanup.modifiedCount,
        cleanedAt: new Date(),
      };
    } catch (error) {
      this.logger?.error("Erreur lors du nettoyage des tokens expirés", error, {
        action: "cleanup_expired_tokens_failed",
      });

      throw new SystemError(
        "Erreur lors du nettoyage des tokens expirés",
        error
      );
    }
  }

  /**
   * 🧹 Nettoie les utilisateurs inactifs
   */
  static async cleanupInactiveUsers() {
    try {
      const inactiveThreshold = new Date(
        Date.now() - 365 * 24 * 60 * 60 * 1000 // 1 an
      );

      const inactiveUsers = await User.find({
        isActive: true,
        lastLoginAt: { $lt: inactiveThreshold },
        createdAt: { $lt: inactiveThreshold },
      });

      const deactivatedCount = 0;
      const deletedCount = 0;

      for (const user of inactiveUsers) {
        // Marquer comme inactif au lieu de supprimer
        user.isActive = false;
        user.deactivatedAt = new Date();
        user.deactivationReason = "inactive_user";
        await user.save();
        deactivatedCount++;
      }

      this.logger?.info(
        "Inactive users cleaned",
        {
          deactivatedCount,
          deletedCount,
        },
        {
          action: "inactive_users_cleaned",
        }
      );

      return {
        deactivatedCount,
        deletedCount,
        cleanedAt: new Date(),
      };
    } catch (error) {
      this.logger?.error(
        "Erreur lors du nettoyage des utilisateurs inactifs",
        error,
        {
          action: "cleanup_inactive_users_failed",
        }
      );

      throw new SystemError(
        "Erreur lors du nettoyage des utilisateurs inactifs",
        error
      );
    }
  }

  /**
   * 🔧 Optimise les index de la base de données
   */
  static async optimizeIndexes() {
    try {
      const optimizationResults = {
        indexesAnalyzed: 0,
        indexesOptimized: 0,
        errors: [],
      };

      // Analyser les index existants
      const indexes = await User.collection.getIndexes();
      optimizationResults.indexesAnalyzed = Object.keys(indexes).length;

      // Vérifier les index critiques
      const criticalIndexes = [
        { email: 1 },
        { googleId: 1 },
        { isActive: 1 },
        { createdAt: 1 },
        { lastLoginAt: 1 },
      ];

      for (const index of criticalIndexes) {
        try {
          const indexName = Object.keys(index)[0];
          const indexExists = Object.values(indexes).some(
            (idx) => idx.key && idx.key[indexName]
          );

          if (!indexExists) {
            await User.collection.createIndex(index);
            optimizationResults.indexesOptimized++;
          }
        } catch (indexError) {
          optimizationResults.errors.push(
            `Index creation failed: ${indexError.message}`
          );
        }
      }

      this.logger?.info("Database indexes optimized", optimizationResults, {
        action: "database_indexes_optimized",
      });

      return {
        ...optimizationResults,
        optimizedAt: new Date(),
      };
    } catch (error) {
      this.logger?.error("Erreur lors de l'optimisation des index", error, {
        action: "optimize_indexes_failed",
      });

      throw new SystemError("Erreur lors de l'optimisation des index", error);
    }
  }

  /**
   * 📊 Obtient les statistiques de maintenance
   */
  static async getMaintenanceStats() {
    try {
      const stats = {
        timestamp: new Date(),
        database: {
          totalUsers: await User.countDocuments(),
          activeUsers: await User.countDocuments({ isActive: true }),
          inactiveUsers: await User.countDocuments({ isActive: false }),
          usersWithExpiredTokens: await User.countDocuments({
            $or: [
              { emailVerificationExpires: { $lt: new Date() } },
              { passwordResetExpires: { $lt: new Date() } },
            ],
          }),
        },
        storage: {
          estimatedSize: "N/A",
        },
        performance: {
          avgResponseTime: "N/A",
        },
      };

      return stats;
    } catch (error) {
      this.logger?.error(
        "Erreur lors de la récupération des statistiques de maintenance",
        error,
        {
          action: "get_maintenance_stats_failed",
        }
      );

      throw new SystemError(
        "Erreur lors de la récupération des statistiques de maintenance",
        error
      );
    }
  }

  /**
   * 🔄 Exécute une tâche de maintenance spécifique
   */
  static async runSpecificTask(taskName) {
    try {
      switch (taskName) {
        case "cleanup_expired_tokens":
          return await this.cleanupExpiredTokens();

        case "cleanup_inactive_users":
          return await this.cleanupInactiveUsers();

        case "optimize_indexes":
          return await this.optimizeIndexes();

        case "unlock_expired_accounts":
          return await SecurityService.unlockExpiredAccounts();

        default:
          throw new Error(`Tâche de maintenance inconnue: ${taskName}`);
      }
    } catch (error) {
      this.logger?.error(
        `Erreur lors de l'exécution de la tâche ${taskName}`,
        error,
        {
          action: `run_maintenance_task_failed`,
          taskName,
        }
      );

      throw new SystemError(
        `Erreur lors de l'exécution de la tâche ${taskName}`,
        error
      );
    }
  }
}

export default MaintenanceService;
