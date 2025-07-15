// ============================================================================
// 📁 src/services/searchService.js - Recherche d'utilisateurs
// ============================================================================

import User from "../models/User.js";
import PaginationHelper from "../utils/paginationHelper.js";
import { ErrorFactory, SystemError } from "../utils/customError.js";
import { USER_ERRORS } from "../utils/errorCodes.js";

class SearchService {
  static setLogger(injectedLogger) {
    this.logger = injectedLogger;
  }

  /**
   * 🔍 Trouve un utilisateur par Google ID
   */
  static async findByGoogleId(googleId) {
    try {
      return await User.findOne({ googleId, isActive: true });
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur lors de la recherche par Google ID", error, {
        action: "find_user_by_google_id_failed",
        googleId,
      });

      throw new SystemError("Erreur lors de la recherche utilisateur", error, {
        googleId,
      });
    }
  }

  /**
   * 🔍 Trouve un utilisateur par email pour liaison OAuth
   */
  static async findForOAuthLinking(email) {
    try {
      return await User.findOne({
        email: email.toLowerCase().trim(),
        isActive: true,
      });
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error(
        "Erreur lors de la recherche pour liaison OAuth",
        error,
        {
          action: "find_user_for_oauth_linking_failed",
          email: email?.toLowerCase(),
        }
      );

      throw new SystemError("Erreur lors de la recherche utilisateur", error, {
        email: email?.toLowerCase(),
      });
    }
  }

  /**
   * 🔍 Trouve un utilisateur par ID avec gestion d'erreur
   */
  static async findById(userId) {
    try {
      this.validateObjectId(userId, "User ID");

      const user = await User.findById(userId);
      if (!user) {
        throw ErrorFactory.notFound(
          "Utilisateur introuvable",
          USER_ERRORS.USER_NOT_FOUND
        );
      }

      return user;
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur lors de la recherche par ID", error, {
        action: "find_user_by_id_failed",
        userId: userId?.toString(),
      });

      throw new SystemError("Erreur lors de la recherche utilisateur", error, {
        userId: userId?.toString(),
      });
    }
  }

  /**
   * 🔍 Trouve un utilisateur par email
   */
  static async findByEmail(email) {
    try {
      return await User.findOne({
        email: email.toLowerCase().trim(),
        isActive: true,
      });
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur lors de la recherche par email", error, {
        action: "find_user_by_email_failed",
        email: email?.toLowerCase(),
      });

      throw new SystemError("Erreur lors de la recherche utilisateur", error, {
        email: email?.toLowerCase(),
      });
    }
  }

  /**
   * 🔍 Recherche avancée d'utilisateurs avec pagination
   */
  static async searchUsers(filters = {}, options = {}) {
    try {
      const {
        query,
        status,
        authProvider,
        subscriptionStatus,
        dateFrom,
        dateTo,
        ...paginationParams
      } = filters;

      const {
        includeInactive = false,
        includeDeleted = false,
        includeSecurityInfo = false,
        baseUrl,
      } = options;

      // Validation des paramètres de pagination
      const validatedPagination =
        PaginationHelper.validatePaginationParams(paginationParams);

      // Construction de la requête
      let searchQuery = {};

      // Filtre par statut
      if (!includeInactive) {
        searchQuery.isActive = true;
      } else if (status) {
        searchQuery.isActive = status === "active";
      }

      // Filtre par fournisseur d'authentification
      if (authProvider) {
        searchQuery.authProvider = authProvider;
      }

      // Filtre par statut d'abonnement
      if (subscriptionStatus) {
        searchQuery["subscription.status"] = subscriptionStatus;
      }

      // Filtre par date
      if (dateFrom || dateTo) {
        searchQuery.createdAt = {};
        if (dateFrom) searchQuery.createdAt.$gte = new Date(dateFrom);
        if (dateTo) searchQuery.createdAt.$lte = new Date(dateTo);
      }

      // Recherche textuelle
      if (query) {
        searchQuery.$or = [
          { email: { $regex: query, $options: "i" } },
          { name: { $regex: query, $options: "i" } },
        ];
      }

      // Sélection des champs
      let selectFields = "-password -refreshToken";
      if (!includeSecurityInfo) {
        selectFields += " -security";
      }

      // Comptage total
      const total = await User.countDocuments(searchQuery);

      // Exécution de la requête avec pagination
      const users = await PaginationHelper.applyPaginationToQuery(
        User.find(searchQuery).select(selectFields),
        validatedPagination
      );

      // Construction de la réponse paginée
      const response = PaginationHelper.buildPaginatedResponse(
        users,
        total,
        validatedPagination,
        {
          baseUrl,
          queryParams: {
            query,
            status,
            authProvider,
            subscriptionStatus,
            dateFrom,
            dateTo,
          },
        }
      );

      return {
        ...response,
        filters: {
          query,
          status,
          authProvider,
          subscriptionStatus,
          dateFrom,
          dateTo,
        },
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur lors de la recherche d'utilisateurs", error, {
        action: "search_users_failed",
        filters,
      });

      throw new SystemError(
        "Erreur lors de la recherche d'utilisateurs",
        error,
        { filters }
      );
    }
  }

  /**
   * 🔍 Recherche d'utilisateurs par critères de sécurité
   */
  static async searchUsersBySecurity(criteria = {}) {
    try {
      const {
        lockedOnly = false,
        failedAttemptsMin = 0,
        reportCountMin = 0,
        securityScoreMax = 100,
        limit = 50,
      } = criteria;

      let securityQuery = {};

      if (lockedOnly) {
        securityQuery["security.accountLockedUntil"] = { $gt: new Date() };
      }

      if (failedAttemptsMin > 0) {
        securityQuery["security.failedLoginAttempts"] = {
          $gte: failedAttemptsMin,
        };
      }

      if (reportCountMin > 0) {
        securityQuery["security.reportCount"] = { $gte: reportCountMin };
      }

      const users = await User.find({
        isActive: true,
        ...securityQuery,
      })
        .select("email name security createdAt lastLoginAt")
        .sort({ "security.failedLoginAttempts": -1 })
        .limit(limit);

      // Calculer le score de sécurité pour chaque utilisateur
      const usersWithScore = users.map((user) => ({
        ...user.toObject(),
        securityScore: this.calculateSecurityScore(user),
      }));

      // Filtrer par score de sécurité si spécifié
      const filteredUsers =
        securityScoreMax < 100
          ? usersWithScore.filter(
              (user) => user.securityScore <= securityScoreMax
            )
          : usersWithScore;

      return {
        users: filteredUsers,
        total: filteredUsers.length,
        criteria,
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur lors de la recherche par sécurité", error, {
        action: "search_users_by_security_failed",
        criteria,
      });

      throw new SystemError("Erreur lors de la recherche par sécurité", error, {
        criteria,
      });
    }
  }

  /**
   * 🔍 Recherche d'utilisateurs par activité
   */
  static async searchUsersByActivity(criteria = {}) {
    try {
      const {
        activityType = "login", // login, email, avatar
        daysInactive = 30,
        limit = 50,
      } = criteria;

      const inactiveDate = new Date(
        Date.now() - daysInactive * 24 * 60 * 60 * 1000
      );

      let activityQuery = {};

      switch (activityType) {
        case "login":
          activityQuery.lastLoginAt = { $lt: inactiveDate };
          break;
        case "email":
          activityQuery.lastEmailSentAt = { $lt: inactiveDate };
          break;
        case "avatar":
          activityQuery.lastAvatarUpdateAt = { $lt: inactiveDate };
          break;
        default:
          activityQuery.lastLoginAt = { $lt: inactiveDate };
      }

      const users = await User.find({
        isActive: true,
        ...activityQuery,
      })
        .select("email name lastLoginAt createdAt")
        .sort({ lastLoginAt: 1 })
        .limit(limit);

      return {
        users,
        total: users.length,
        criteria: {
          activityType,
          daysInactive,
          inactiveSince: inactiveDate,
        },
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur lors de la recherche par activité", error, {
        action: "search_users_by_activity_failed",
        criteria,
      });

      throw new SystemError("Erreur lors de la recherche par activité", error, {
        criteria,
      });
    }
  }

  /**
   * 📊 Obtient les suggestions de recherche
   */
  static async getSearchSuggestions(query, limit = 10) {
    try {
      if (!query || query.length < 2) {
        return { suggestions: [] };
      }

      const suggestions = await User.find({
        isActive: true,
        $or: [
          { email: { $regex: query, $options: "i" } },
          { name: { $regex: query, $options: "i" } },
        ],
      })
        .select("email name")
        .limit(limit)
        .sort({ createdAt: -1 });

      return {
        suggestions: suggestions.map((user) => ({
          id: user._id,
          email: user.email,
          name: user.name,
          display: `${user.name} (${user.email})`,
        })),
        query,
      };
    } catch (error) {
      this.logger?.error(
        "Erreur lors de la récupération des suggestions",
        error,
        {
          action: "get_search_suggestions_failed",
          query,
        }
      );

      return { suggestions: [], query };
    }
  }

  // Helpers
  static validateObjectId(id, fieldName = "ID") {
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      throw ErrorFactory.badRequest(
        `${fieldName} invalide : ${id}`,
        "INVALID_OBJECT_ID"
      );
    }
  }

  static calculateSecurityScore(user) {
    let score = 100;
    score -= (user.security.failedLoginAttempts || 0) * 5;
    if (
      user.security.accountLockedUntil &&
      user.security.accountLockedUntil > Date.now()
    ) {
      score -= 20;
    }
    score -= (user.security.reportCount || 0) * 10;
    return Math.max(0, Math.min(100, score));
  }

  /**
   * 📊 Statistiques d'activité des utilisateurs
   */
  static async getUserActivityStats(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const stats = await User.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            isActive: true,
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
            },
            newUsers: { $sum: 1 },
            activeUsers: {
              $sum: {
                $cond: [
                  {
                    $gte: [
                      "$lastActive",
                      new Date(Date.now() - 24 * 60 * 60 * 1000),
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
        },
      ]);

      // Statistiques par provider d'authentification
      const authProviderStats = await User.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            isActive: true,
          },
        },
        {
          $group: {
            _id: "$authProvider",
            count: { $sum: 1 },
            activeCount: {
              $sum: {
                $cond: [
                  {
                    $gte: [
                      "$lastActive",
                      new Date(Date.now() - 24 * 60 * 60 * 1000),
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]);

      // Statistiques par statut d'abonnement
      const subscriptionStats = await User.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            isActive: true,
          },
        },
        {
          $group: {
            _id: "$subscriptionStatus",
            count: { $sum: 1 },
            activeCount: {
              $sum: {
                $cond: [
                  {
                    $gte: [
                      "$lastActive",
                      new Date(Date.now() - 24 * 60 * 60 * 1000),
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]);

      return {
        period: {
          days,
          startDate,
          endDate: new Date(),
        },
        dailyStats: stats,
        authProviderStats,
        subscriptionStats,
        summary: {
          totalNewUsers: stats.reduce((sum, day) => sum + day.newUsers, 0),
          totalActiveUsers: stats.reduce(
            (sum, day) => sum + day.activeUsers,
            0
          ),
          averageDailyNewUsers: Math.round(
            stats.reduce((sum, day) => sum + day.newUsers, 0) / days
          ),
          averageDailyActiveUsers: Math.round(
            stats.reduce((sum, day) => sum + day.activeUsers, 0) / days
          ),
        },
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error(
        "Erreur lors de la récupération des statistiques d'activité",
        error,
        {
          action: "get_user_activity_stats_failed",
          days,
        }
      );

      throw new SystemError(
        "Erreur lors de la récupération des statistiques d'activité",
        error,
        { days }
      );
    }
  }
}

export default SearchService;
