// ============================================================================
// 📁 src/controllers/profileController.js - Gestion du profil utilisateur
// ============================================================================

import ProfileService from "../services/profileService.js";
import UserAvatarService from "../services/userAvatarService.js";

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

      const result = await ProfileService.getUserProfile(userId);

      return reply.success(result, "Profil récupéré avec succès");
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "USER_PROFILE_ERROR",
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * ✏️ Quick profile update (name only)
   */
  static async updateProfile(request, reply) {
    try {
      const { name } = request.body;
      const userId = request.user._id;

      const result = await ProfileService.updateUserName(userId, name);

      return reply.success(result, "Nom mis à jour avec succès");
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "NAME_UPDATE_ERROR",
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
          error: "Format invalide",
          message: "L'upload nécessite le format multipart/form-data",
          code: "INVALID_CONTENT_TYPE",
        });
      }

      // 🔥 RÉCUPÉRATION DU FICHIER via multipart
      const data = await request.file();

      if (!data) {
        return reply.code(400).send({
          error: "Aucun fichier fourni",
          message: "Veuillez sélectionner un fichier image pour votre avatar",
          code: "NO_FILE_PROVIDED",
        });
      }

      // 🔥 VALIDATION DU NOM DE CHAMP
      if (data.fieldname !== "avatar") {
        return reply.code(400).send({
          error: "Nom de champ invalide",
          message: "Le fichier doit être envoyé dans le champ 'avatar'",
          code: "INVALID_FIELD_NAME",
        });
      }

      // 🔥 CONVERSION STREAM → BUFFER
      const chunks = [];
      for await (const chunk of data.file) {
        chunks.push(chunk);
      }
      const fileBuffer = Buffer.concat(chunks);

      // 🔥 VALIDATION TAILLE
      if (fileBuffer.length > 5 * 1024 * 1024) {
        // 5MB
        return reply.code(400).send({
          error: "Fichier trop volumineux",
          message: "La taille maximale autorisée est de 5MB",
          code: "FILE_TOO_LARGE",
        });
      }

      // 🔥 VALIDATION TYPE MIME
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      if (!allowedTypes.includes(data.mimetype)) {
        return reply.code(400).send({
          error: "Type de fichier non autorisé",
          message: `Types autorisés: ${allowedTypes.join(", ")}`,
          code: "INVALID_FILE_TYPE",
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

      return reply.success(result, "Avatar mis à jour avec succès");
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "AVATAR_UPLOAD_ERROR",
          details: error.details || null,
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

      const message = result.deleted
        ? "Avatar supprimé avec succès"
        : "Aucun avatar à supprimer";

      return reply.success(result, message);
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "DELETE_AVATAR_ERROR",
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * 📊 Get user statistics
   */
  static async getStats(request, reply) {
    try {
      const userId = request.user._id;

      const result = await ProfileService.getUserStats(userId);

      return reply.success(result, "Statistiques récupérées avec succès");
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "USER_STATS_ERROR",
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }
}

export default ProfileController;
