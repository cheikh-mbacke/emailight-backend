// ============================================================================
// 📁 src/services/fileUploadService.js - Service de gestion des uploads
// ============================================================================

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import {
  ValidationError,
  SystemError,
  NotFoundError,
} from "../utils/customError.js";

/**
 * 📁 File Upload Service
 */
class FileUploadService {
  // ✅ Injection du logger
  static setLogger(injectedLogger) {
    this.logger = injectedLogger;
  }

  // Configuration des uploads
  static config = {
    avatar: {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/bmp",
      ],
      allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"],
      uploadDir: "uploads/avatars",
      maxWidth: 512,
      maxHeight: 512,
    },
  };

  /**
   * 📤 Upload and process avatar image
   */
  static async uploadAvatar(userId, fileData, baseUrl = null, language = "FR") {
    try {
      // Validation du fichier
      await this.validateAvatarFile(fileData, language);

      // Génération du nom de fichier unique
      const fileName = this.generateUniqueFileName(
        userId,
        fileData.filename || "avatar.jpg"
      );

      // Création du répertoire s'il n'existe pas
      await this.ensureUploadDirectory(this.config.avatar.uploadDir);

      // Chemin complet du fichier
      const filePath = path.join(this.config.avatar.uploadDir, fileName);

      // Sauvegarde du fichier
      await fs.writeFile(filePath, fileData.data);

      // 🔥 URL COMPLÈTE au lieu d'URL relative
      const avatarUrl = baseUrl
        ? `${baseUrl}/uploads/avatars/${fileName}`
        : `http://localhost:3001/uploads/avatars/${fileName}`;

      this.logger.user(
        "Avatar uploadé avec succès",
        {
          fileName,
          fileSize: fileData.data.length,
          mimeType: fileData.mimetype,
          avatarUrl,
        },
        {
          userId: userId.toString(),
          action: "avatar_uploaded",
        }
      );

      return {
        fileName,
        filePath,
        avatarUrl,
        fileSize: fileData.data.length,
        mimeType: fileData.mimetype,
        uploadedAt: new Date(),
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger.error("Erreur lors de l'upload d'avatar", error, {
        action: "avatar_upload_failed",
        userId: userId?.toString(),
      });

      throw new SystemError("Erreur lors de l'upload de l'avatar", error, {
        userId: userId?.toString(),
      });
    }
  }

  /**
   * 🗑️ Delete avatar file
   */
  static async deleteAvatar(avatarUrl) {
    try {
      if (!avatarUrl) {
        return { deleted: false, reason: "Aucun avatar à supprimer" };
      }

      // Extraire le nom du fichier de l'URL
      const fileName = path.basename(avatarUrl);
      const filePath = path.join(this.config.avatar.uploadDir, fileName);

      // Vérifier si le fichier existe
      try {
        await fs.access(filePath);
      } catch (accessError) {
        this.logger.warn("Fichier avatar introuvable", {
          filePath,
          avatarUrl,
        });
        return { deleted: false, reason: "Fichier introuvable" };
      }

      // Supprimer le fichier
      await fs.unlink(filePath);

      this.logger.user(
        "Avatar supprimé",
        { fileName, filePath },
        { action: "avatar_deleted" }
      );

      return {
        deleted: true,
        fileName,
        deletedAt: new Date(),
      };
    } catch (error) {
      this.logger.error("Erreur lors de la suppression d'avatar", error, {
        action: "avatar_deletion_failed",
        avatarUrl,
      });

      throw new SystemError(
        "Erreur lors de la suppression de l'avatar",
        error,
        {
          avatarUrl,
        }
      );
    }
  }

  /**
   * ✅ Validate avatar file
   */
  static async validateAvatarFile(fileData, language = "FR") {
    console.log(
      `🔍 FileUploadService.validateAvatarFile: Langue reçue = ${language}`
    );
    // Vérifier la présence du fichier
    if (!fileData || !fileData.data) {
      throw new ValidationError(
        "Aucun fichier fourni",
        null,
        "NO_FILE_PROVIDED"
      );
    }

    // Vérifier la taille
    if (fileData.data.length > this.config.avatar.maxSize) {
      const { getTranslation } = await import("../constants/translations.js");
      const errorMessage = getTranslation(
        "validation.file_size.too_large",
        language
      );
      throw new ValidationError(errorMessage, null, "FILE_TOO_LARGE");
    }

    // Vérifier le type MIME
    if (
      fileData.mimetype &&
      !this.config.avatar.allowedMimeTypes.includes(fileData.mimetype)
    ) {
      const { getTranslation } = await import("../constants/translations.js");
      const errorMessage = getTranslation(
        "validation.file_type.invalid",
        language
      ).replace("{types}", this.config.avatar.allowedMimeTypes.join(", "));
      throw new ValidationError(errorMessage, null, "INVALID_FILE_TYPE");
    }

    // Vérifier l'extension si disponible
    if (fileData.filename) {
      const extension = path.extname(fileData.filename).toLowerCase();
      if (!this.config.avatar.allowedExtensions.includes(extension)) {
        const { getTranslation } = await import("../constants/translations.js");
        const errorMessage = getTranslation(
          "validation.file_type.invalid",
          language
        ).replace("{types}", this.config.avatar.allowedMimeTypes.join(", "));
        throw new ValidationError(errorMessage, null, "INVALID_FILE_TYPE");
      }
    }

    // Vérifier que ce n'est pas un fichier vide
    if (fileData.data.length === 0) {
      throw new ValidationError("Le fichier est vide", null, "EMPTY_FILE");
    }

    // Vérification basique du header pour détecter les vraies images
    if (fileData.data.length >= 4) {
      const header = fileData.data.slice(0, 4);
      const isValidImage = this.isValidImageHeader(header, fileData.mimetype);

      if (!isValidImage) {
        const { getTranslation } = await import("../constants/translations.js");
        const errorMessage = getTranslation(
          "validation.file_corrupted.invalid",
          language
        );
        throw new ValidationError(errorMessage, null, "INVALID_FILE_FORMAT");
      }
    }

    return true;
  }

  /**
   * 🔍 Check if file header indicates a valid image
   */
  static isValidImageHeader(header, mimetype = null) {
    // JPEG: FF D8 FF
    if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
      return true;
    }

    // PNG: 89 50 4E 47
    if (
      header[0] === 0x89 &&
      header[1] === 0x50 &&
      header[2] === 0x4e &&
      header[3] === 0x47
    ) {
      return true;
    }

    // GIF: 47 49 46 38
    if (
      header[0] === 0x47 &&
      header[1] === 0x49 &&
      header[2] === 0x46 &&
      header[3] === 0x38
    ) {
      return true;
    }

    // WebP: RIFF format - check for "RIFF" at start
    // RIFF: 52 49 46 46 (ASCII: "RIFF")
    if (
      header[0] === 0x52 &&
      header[1] === 0x49 &&
      header[2] === 0x46 &&
      header[3] === 0x46
    ) {
      // Si c'est un fichier RIFF et que le mimetype est WebP, on accepte
      if (mimetype === "image/webp") {
        return true;
      }
    }

    // BMP: 42 4D (ASCII: "BM")
    if (header[0] === 0x42 && header[1] === 0x4d) {
      return true;
    }

    return false;
  }

  /**
   * 🏷️ Generate unique filename
   */
  static generateUniqueFileName(userId, originalFileName) {
    const timestamp = Date.now();
    const randomHash = crypto.randomBytes(8).toString("hex");
    const extension = path.extname(originalFileName) || ".jpg";

    return `avatar_${userId}_${timestamp}_${randomHash}${extension}`;
  }

  /**
   * 📁 Ensure upload directory exists
   */
  static async ensureUploadDirectory(uploadDir) {
    try {
      await fs.access(uploadDir);
    } catch (error) {
      // Directory doesn't exist, create it
      await fs.mkdir(uploadDir, { recursive: true });

      this.logger.info("Répertoire de upload créé", {
        directory: uploadDir,
      });
    }
  }

  /**
   * 📊 Get upload configuration
   */
  static getUploadConfig() {
    return {
      avatar: {
        maxSize: this.config.avatar.maxSize,
        maxSizeMB: Math.round(this.config.avatar.maxSize / 1024 / 1024),
        allowedTypes: this.config.avatar.allowedMimeTypes,
        allowedExtensions: this.config.avatar.allowedExtensions,
        maxDimensions: {
          width: this.config.avatar.maxWidth,
          height: this.config.avatar.maxHeight,
        },
      },
    };
  }

  /**
   * 🧹 Clean up old avatar files (maintenance task)
   */
  static async cleanupOldAvatars(olderThanDays = 30) {
    try {
      const uploadDir = this.config.avatar.uploadDir;
      const cutoffDate = new Date(
        Date.now() - olderThanDays * 24 * 60 * 60 * 1000
      );

      const files = await fs.readdir(uploadDir);
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(uploadDir, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      this.logger.info("Nettoyage des anciens avatars terminé", {
        deletedCount,
        olderThanDays,
        directory: uploadDir,
      });

      return {
        deletedCount,
        cleanupDate: new Date(),
        olderThanDays,
      };
    } catch (error) {
      this.logger.error("Erreur lors du nettoyage des avatars", error, {
        action: "avatar_cleanup_failed",
        olderThanDays,
      });

      throw new SystemError("Erreur lors du nettoyage des avatars", error);
    }
  }
}

export default FileUploadService;
