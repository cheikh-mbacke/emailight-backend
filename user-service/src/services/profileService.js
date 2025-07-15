// ============================================================================
// 📁 src/services/profileService.js - Gestion du profil utilisateur
// ============================================================================

import mongoose from "mongoose";
import User from "../models/User.js";
import QuotaService from "./quotaService.js";
import I18nService from "./i18nService.js";
import { ErrorFactory, SystemError } from "../utils/customError.js";
import { USER_ERRORS } from "../utils/errorCodes.js";

class ProfileService {
  static setLogger(injectedLogger) {
    this.logger = injectedLogger;
    QuotaService.setLogger(injectedLogger);
  }

  /**
   * 📋 Récupère le profil complet d'un utilisateur
   */
  static async getUserProfile(userId) {
    try {
      this.validateObjectId(userId);
      const user = await User.findById(userId).populate(
        "connectedEmailAccounts",
        "email provider isActive lastUsed emailsSent healthStatus"
      );
      if (!user) {
        throw ErrorFactory.notFound(
          "Utilisateur introuvable",
          USER_ERRORS.USER_NOT_FOUND
        );
      }
      const userLanguage = I18nService.getUserLanguage(user);
      const quotaInfo = await QuotaService.getQuotaInfo(
        userId,
        user.preferences?.timezone
      );
      this.logger?.user(
        "Profil utilisateur récupéré",
        {
          userId: userId.toString(),
          hasQuotaInfo: !!quotaInfo,
          connectedAccountsCount: user.connectedEmailAccounts.length,
        },
        {
          userId: userId.toString(),
          action: "get_user_profile",
        }
      );
      return {
        profile: user.profile,
        preferences: user.preferences,
        subscription: {
          status: user.subscriptionStatus,
          endsAt: user.subscriptionEndsAt,
        },
        security: {
          isEmailVerified: user.isEmailVerified,
          lastActiveAt: user.lastActiveAt,
          ...quotaInfo,
        },
        connectedAccounts: user.connectedEmailAccounts,
        stats: {
          accountCreatedAt: user.createdAt,
          totalConnectedAccounts: user.connectedEmailAccounts.length,
          isActive: user.isActive,
        },
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }
      this.logger?.error("Erreur lors de la récupération du profil", error, {
        action: "get_user_profile_failed",
        userId: userId?.toString(),
      });
      throw new SystemError(
        "Erreur lors de la récupération du profil utilisateur",
        error,
        { userId: userId?.toString() }
      );
    }
  }

  /**
   * ✏️ Met à jour le nom d'un utilisateur
   */
  static async updateUserName(userId, name) {
    try {
      this.validateObjectId(userId);
      this.validateName(name);
      const user = await User.findByIdAndUpdate(
        userId,
        { name: name.trim() },
        { new: true, runValidators: true }
      );
      if (!user) {
        throw ErrorFactory.notFound(
          "Utilisateur introuvable",
          USER_ERRORS.USER_NOT_FOUND
        );
      }
      const userLanguage = I18nService.getUserLanguage(user);
      this.logger?.user(
        I18nService.getMessage("logs.nameUpdated", userLanguage),
        {
          oldName: user.name,
          newName: name.trim(),
        },
        {
          userId: userId.toString(),
          email: user.email,
          action: "name_updated",
        }
      );
      return {
        user: user.profile,
        updated: true,
        updatedAt: new Date(),
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }
      this.logger?.error("Erreur lors de la mise à jour du nom", error, {
        action: "update_user_name_failed",
        userId: userId?.toString(),
      });
      throw new SystemError("Erreur lors de la mise à jour du nom", error, {
        userId: userId?.toString(),
      });
    }
  }

  /**
   * 📊 Statistiques utilisateur
   */
  static async getUserStats(userId) {
    try {
      this.validateObjectId(userId);
      const user = await User.findById(userId);
      if (!user) {
        throw ErrorFactory.notFound(
          "Utilisateur introuvable",
          USER_ERRORS.USER_NOT_FOUND
        );
      }
      // Exemple de stats (à adapter selon besoins)
      return {
        email: user.email,
        createdAt: user.createdAt,
        lastActiveAt: user.lastActiveAt,
        totalConnectedAccounts: user.connectedEmailAccounts.length,
        isActive: user.isActive,
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }
      this.logger?.error("Erreur lors de la récupération des stats", error, {
        action: "get_user_stats_failed",
        userId: userId?.toString(),
      });
      throw new SystemError("Erreur lors de la récupération des stats", error, {
        userId: userId?.toString(),
      });
    }
  }

  // Helpers
  static validateObjectId(id, fieldName = "ID") {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ErrorFactory.badRequest(
        `${fieldName} invalide : ${id}`,
        "INVALID_OBJECT_ID"
      );
    }
  }
  static validateName(name) {
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      throw ErrorFactory.badRequest(
        "Nom d'utilisateur invalide",
        "INVALID_NAME"
      );
    }
  }
}

export default ProfileService;
