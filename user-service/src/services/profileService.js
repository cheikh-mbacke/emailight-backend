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

      this.logger?.user(
        "Profil utilisateur récupéré",
        {
          userId: userId.toString(),
          email: user.email,
          name: user.name,
        },
        {
          userId: userId.toString(),
          action: "get_user_profile",
        }
      );
      // ✅ FORMAT SIMPLIFIÉ: Seulement les informations essentielles du profil
      // Les autres informations ont leurs propres routes dédiées
      const profileData = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        subscriptionStatus: user.subscriptionStatus || "free",
        isEmailVerified: user.isEmailVerified || false,
        isActive: user.isActive || true,
        profilePictureUrl: user.profilePictureUrl || null,
      };

      // ✅ DEBUG: Log des données du profil
      this.logger?.debug("Données du profil construites", {
        profileData,
        userFields: {
          _id: user._id,
          name: user.name,
          email: user.email,
          subscriptionStatus: user.subscriptionStatus,
          isEmailVerified: user.isEmailVerified,
          isActive: user.isActive,
          profilePictureUrl: user.profilePictureUrl,
        },
      });

      return profileData;
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
   * ✏️ Met à jour le profil d'un utilisateur (nom et/ou email)
   */
  static async updateUserProfile(userId, updateData, language = "FR") {
    try {
      this.validateObjectId(userId);

      // ✅ VALIDATION: Les données sont déjà validées par Joi dans le middleware
      const { name, email } = updateData;

      // Préparer les données de mise à jour (déjà nettoyées par Joi)
      const updateFields = {};
      if (name) {
        updateFields.name = name; // Déjà trimé par Joi
      }
      if (email) {
        updateFields.email = email; // Déjà lowercase et trimé par Joi
      }

      // Récupérer l'utilisateur actuel pour les logs
      const currentUser = await User.findById(userId);
      if (!currentUser) {
        throw ErrorFactory.notFound(
          "Utilisateur introuvable",
          USER_ERRORS.USER_NOT_FOUND
        );
      }

      // Mettre à jour l'utilisateur
      const user = await User.findByIdAndUpdate(userId, updateFields, {
        new: true,
        runValidators: true,
      });

      const userLanguage = I18nService.getUserLanguage(user);

      // Log des changements
      this.logger?.user(
        I18nService.getMessage("logs.profileUpdated", userLanguage),
        {
          oldName: currentUser.name,
          newName: user.name,
          oldEmail: currentUser.email,
          newEmail: user.email,
          fieldsUpdated: Object.keys(updateFields),
        },
        {
          userId: userId.toString(),
          email: user.email,
          action: "profile_updated",
        }
      );

      // Retourner le format simplifié
      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      // Gestion spécifique de l'erreur d'email dupliqué
      if (error.code === 11000 && error.keyPattern?.email) {
        throw ErrorFactory.conflict(
          I18nService.getValidationMessage("email", "exists", language),
          USER_ERRORS.USER_EXISTS
        );
      }

      this.logger?.error("Erreur lors de la mise à jour du profil", error, {
        action: "update_user_profile_failed",
        userId: userId?.toString(),
      });
      throw new SystemError("Erreur lors de la mise à jour du profil", error, {
        userId: userId?.toString(),
      });
    }
  }

  /**
   * ✏️ Met à jour le nom d'un utilisateur (méthode legacy)
   */
  static async updateUserName(userId, name) {
    return this.updateUserProfile(userId, { name });
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
  // ✅ SUPPRIMÉ: Les validations sont maintenant gérées par Joi dans le middleware
}

export default ProfileService;
