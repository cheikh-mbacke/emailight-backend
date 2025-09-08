// ============================================================================
// 📁 src/controllers/profileController.js - Gestion du profil utilisateur
// ============================================================================

import ProfileService from "../services/profileService.js";
import UserAvatarService from "../services/userAvatarService.js";
import I18nService from "../services/i18nService.js";

/**
 * 👤 Profile management controller
 * Responsabilités : Profil utilisateur, avatar, informations de base
 */
class ProfileController {
  // ✅ Injection du logger
  static setLogger(injectedLogger) {
    this.logger = injectedLogger;
  }

  /**
   * 📋 Get detailed user profile
   */
  static async getProfile(request, reply) {
    try {
      const userId = request.user._id;

      // ✅ DEBUG: Log des informations de l'utilisateur authentifié
      this.logger?.debug("Récupération du profil", {
        userId: userId?.toString(),
        userObject: request.user,
        hasUser: !!request.user,
      });

      const result = await ProfileService.getUserProfile(userId);

      // ✅ DEBUG: Log du résultat du service
      this.logger?.debug("Résultat du ProfileService", {
        result,
        resultType: typeof result,
        hasResult: !!result,
        resultKeys: result ? Object.keys(result) : [],
      });

      // ✅ TRADUCTION: Utiliser le système de traduction
      const { getTranslation } = await import("../constants/translations.js");
      const message = getTranslation(
        "user.profile_retrieved",
        request.language
      );

      return reply.success(result, message);
    } catch (error) {
      // ✅ DEBUG: Log des erreurs
      this.logger?.error("Erreur dans getProfile", {
        error: error.message,
        stack: error.stack,
        userId: request.user?._id?.toString(),
      });

      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          status: "failed",
          errorCode: String(error.statusCode),
          errorName: error.code || "USER_PROFILE_ERROR",
          errorMessage: error.message,
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * ✏️ Quick profile update (name and/or email)
   */
  static async updateProfile(request, reply) {
    try {
      const { name, email } = request.body;
      const userId = request.user._id;

      const result = await ProfileService.updateUserProfile(
        userId,
        {
          name,
          email,
        },
        request.language
      );

      // ✅ TRADUCTION: Utiliser le système de traduction
      const { getTranslation } = await import("../constants/translations.js");
      const message = getTranslation(
        "success.profile_updated",
        request.language
      );

      return reply.success(result, message);
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          status: "failed",
          errorCode: String(error.statusCode),
          errorName: error.code || "PROFILE_UPDATE_ERROR",
          errorMessage: error.message,
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * 🖼️ Upload user avatar
   */
  static async uploadAvatar(request, reply) {
    try {
      const userId = request.user._id;

      // 🔥 VÉRIFICATION: S'assurer que c'est du multipart
      if (!request.isMultipart()) {
        return reply.code(400).send({
          status: "failed",
          errorCode: "400",
          errorName: "INVALID_CONTENT_TYPE",
          errorMessage: "L'upload nécessite le format multipart/form-data",
        });
      }

      // 🔥 RÉCUPÉRATION DU FICHIER via multipart
      const data = await request.file();

      if (!data) {
        // ✅ TRADUCTION: Utiliser le système de validation existant
        const errorMessage = I18nService.getValidationMessage(
          "file",
          "required",
          request.language
        );

        return reply.code(400).send({
          status: "failed",
          errorCode: "400",
          errorName: "NO_FILE_PROVIDED",
          errorMessage: errorMessage,
        });
      }

      // 🔥 VÉRIFICATION: Fichier tronqué par Fastify multipart
      console.log(`🔍 Propriété truncated: ${data.file.truncated}`);
      console.log(`🔍 Type de data.file: ${typeof data.file}`);
      console.log(`🔍 Propriétés de data.file:`, Object.keys(data.file));

      if (data.file.truncated) {
        console.log(
          "❌ Fichier tronqué par Fastify multipart - taille dépassée"
        );

        // ✅ TRADUCTION: Utiliser le système de traduction
        const { getTranslation } = await import("../constants/translations.js");
        const errorMessage = getTranslation(
          "validation.file_size.truncated",
          request.language
        );

        return reply.code(413).send({
          status: "failed",
          errorCode: "413",
          errorName: "FILE_TOO_LARGE",
          errorMessage: errorMessage,
        });
      }

      // 🔥 VALIDATION DU NOM DE CHAMP
      if (data.fieldname !== "avatar") {
        return reply.code(400).send({
          status: "failed",
          errorCode: "400",
          errorName: "INVALID_FIELD_NAME",
          errorMessage: "Le fichier doit être envoyé dans le champ 'avatar'",
        });
      }

      // 🔥 CONVERSION STREAM → BUFFER
      const chunks = [];
      for await (const chunk of data.file) {
        chunks.push(chunk);
      }
      const fileBuffer = Buffer.concat(chunks);

      // 🔥 VALIDATION TAILLE
      const maxSize = 5 * 1024 * 1024; // 5MB
      const fileSizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(2);

      console.log(`🔍 Validation taille: ${fileSizeMB}MB (max: 5MB)`);
      console.log(`🔍 Taille exacte: ${fileBuffer.length} bytes`);

      // 🔥 DÉTECTION: Fichier tronqué si taille = limite exacte
      if (fileBuffer.length === maxSize) {
        console.log(
          `❌ Fichier suspect: taille exacte de la limite (${fileSizeMB}MB)`
        );
        console.log(`❌ Probablement tronqué par Fastify multipart`);

        // ✅ TRADUCTION: Utiliser le système de traduction
        const { getTranslation } = await import("../constants/translations.js");
        const errorMessage = getTranslation(
          "validation.file_size.truncated",
          request.language
        );

        return reply.code(413).send({
          status: "failed",
          errorCode: "413",
          errorName: "FILE_TOO_LARGE",
          errorMessage: errorMessage,
        });
      }

      if (fileBuffer.length > maxSize) {
        console.log(`❌ Fichier trop volumineux: ${fileSizeMB}MB > 5MB`);

        // ✅ TRADUCTION: Utiliser le système de traduction
        const { getTranslation } = await import("../constants/translations.js");
        const errorMessage = getTranslation(
          "validation.file_size.too_large",
          request.language
        );

        return reply.code(400).send({
          status: "failed",
          errorCode: "400",
          errorName: "FILE_TOO_LARGE",
          errorMessage: errorMessage,
        });
      }

      console.log(`✅ Taille OK: ${fileSizeMB}MB`);

      // 🔥 VALIDATION TYPE MIME
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/bmp",
      ];
      if (!allowedTypes.includes(data.mimetype)) {
        // ✅ TRADUCTION: Utiliser le système de traduction
        const { getTranslation } = await import("../constants/translations.js");
        const errorMessage = getTranslation(
          "validation.file_type.invalid",
          request.language
        ).replace("{types}", allowedTypes.join(", "));

        return reply.code(400).send({
          status: "failed",
          errorCode: "400",
          errorName: "INVALID_FILE_TYPE",
          errorMessage: errorMessage,
        });
      }

      // Préparer les données du fichier
      const fileData = {
        data: fileBuffer,
        filename: data.filename,
        mimetype: data.mimetype,
        encoding: data.encoding,
      };

      // 🔥 PASSER LA REQUEST pour construire l'URL complète
      const result = await UserAvatarService.updateUserAvatar(
        userId,
        fileData,
        request
      );

      // ✅ TRADUCTION: Utiliser le système de traduction
      const { getTranslation } = await import("../constants/translations.js");
      const message = getTranslation(
        "success.avatar_updated",
        request.language
      );

      return reply.success(result, message);
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          status: "failed",
          errorCode: String(error.statusCode),
          errorName: error.code || "AVATAR_UPLOAD_ERROR",
          errorMessage: error.message,
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * 🗑️ Delete user avatar
   */
  static async deleteAvatar(request, reply) {
    try {
      const userId = request.user._id;

      const result = await UserAvatarService.deleteUserAvatar(userId);

      // ✅ TRADUCTION: Utiliser le système de traduction
      const { getTranslation } = await import("../constants/translations.js");

      if (result.deleted) {
        const message = getTranslation(
          "success.avatar_deleted",
          request.language
        );
        return reply.success(null, message);
      } else {
        // 🎯 Aucun avatar à supprimer - utiliser le format d'erreur standardisé
        const message = getTranslation("user.no_avatar", request.language);
        return reply.code(400).send({
          status: "failed",
          errorCode: "400",
          errorName: "NO_AVATAR_TO_DELETE",
          errorMessage: message,
        });
      }
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          status: "failed",
          errorCode: String(error.statusCode),
          errorName: error.code || "DELETE_AVATAR_ERROR",
          errorMessage: error.message,
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }
}

export default ProfileController;
