// ============================================================================
// 📁 src/services/userAvatarService.js - Gestion des avatars utilisateur
// ============================================================================

import mongoose from "mongoose";
import User from "../models/User.js";

import I18nService from "./i18nService.js";
import FileUploadService from "./fileUploadService.js";
import { ErrorFactory, SystemError } from "../utils/customError.js";
import { USER_ERRORS } from "../utils/errorCodes.js";

class UserAvatarService {
  static setLogger(injectedLogger) {
    this.logger = injectedLogger;
  }

  /**
   * 🖼️ Upload et mise à jour de l'avatar utilisateur
   */
  static async updateUserAvatar(userId, fileData, request = null) {
    try {
      this.validateObjectId(userId);

      const user = await User.findById(userId);
      if (!user) {
        throw ErrorFactory.notFound(
          "Utilisateur introuvable",
          USER_ERRORS.USER_NOT_FOUND
        );
      }

      const userLanguage = request
        ? I18nService.getRequestLanguage(request)
        : I18nService.getUserLanguage(user);
      const oldAvatarUrl = user.profilePictureUrl;

      // Build base URL from request
      const baseUrl = this.buildBaseUrl(request);

      // Upload via FileUploadService
      const uploadResult = await FileUploadService.uploadAvatar(
        userId,
        fileData,
        baseUrl,
        userLanguage
      );

      // Update avatar URL in database
      user.profilePictureUrl = uploadResult.avatarUrl;
      await user.save();

      // Delete old avatar if it existed
      if (oldAvatarUrl) {
        try {
          await FileUploadService.deleteAvatar(oldAvatarUrl);
        } catch (deleteError) {
          // Log but don't fail the upload
          this.logger?.warn(
            I18nService.getMessage("logs.oldAvatarDeleteFailed", userLanguage),
            deleteError,
            {
              userId: userId.toString(),
              oldAvatarUrl,
            }
          );
        }
      }

      this.logger?.user(
        I18nService.getMessage("logs.avatarUpdated", userLanguage),
        {
          fileName: uploadResult.fileName,
          fileSize: uploadResult.fileSize,
          oldAvatarUrl: oldAvatarUrl,
          newAvatarUrl: uploadResult.avatarUrl,
        },
        {
          userId: userId.toString(),
          email: user.email,
          action: "avatar_updated",
        }
      );

      return {
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        avatarUrl: uploadResult.avatarUrl,
        uploadedAt: uploadResult.uploadedAt,
        updated: true,
        updatedAt: new Date(),
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur lors de la mise à jour de l'avatar", error, {
        action: "update_user_avatar_failed",
        userId: userId?.toString(),
      });

      throw new SystemError(
        "Erreur lors de la mise à jour de l'avatar",
        error,
        { userId: userId?.toString() }
      );
    }
  }

  /**
   * 🗑️ Supprime l'avatar d'un utilisateur
   */
  static async deleteUserAvatar(userId) {
    try {
      this.validateObjectId(userId);

      const user = await User.findById(userId);
      if (!user) {
        throw ErrorFactory.notFound(
          "Utilisateur introuvable",
          USER_ERRORS.USER_NOT_FOUND
        );
      }

      const userLanguage = I18nService.getUserLanguage(user);

      if (!user.profilePictureUrl) {
        return {
          deleted: false,
          reason: I18nService.getMessage("user.noAvatar", userLanguage),
        };
      }

      const avatarUrl = user.profilePictureUrl;

      // Delete via FileUploadService
      const deleteResult = await FileUploadService.deleteAvatar(avatarUrl);

      if (deleteResult.deleted) {
        // Remove URL from database
        user.profilePictureUrl = null;
        await user.save();

        this.logger?.user(
          I18nService.getMessage("logs.avatarDeleted", userLanguage),
          { avatarUrl },
          {
            userId: userId.toString(),
            email: user.email,
            action: "avatar_deleted",
          }
        );
      }

      return {
        ...deleteResult,
        deletedAt: new Date(),
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur lors de la suppression de l'avatar", error, {
        action: "delete_user_avatar_failed",
        userId: userId?.toString(),
      });

      throw new SystemError(
        "Erreur lors de la suppression de l'avatar",
        error,
        { userId: userId?.toString() }
      );
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

  static buildBaseUrl(request) {
    if (!request) {
      return "http://localhost:3001";
    }

    const protocol = request.protocol;
    const host = request.hostname;
    const port = request.port || (protocol === "https" ? 443 : 80);

    // Don't include port if it's standard (80 for HTTP, 443 for HTTPS)
    if (
      (protocol === "http" && port === 80) ||
      (protocol === "https" && port === 443)
    ) {
      return `${protocol}://${host}`;
    }

    return `${protocol}://${host}:${port}`;
  }
}

export default UserAvatarService;
