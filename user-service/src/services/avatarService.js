// ============================================================================
// src/services/avatarService.js - Service spécialisé pour la gestion des avatars
// ============================================================================

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { FILE_CONSTANTS, LIMITS } from "../constants/timeConstants.js";
import I18nService from "./i18nService.js";
import { ErrorFactory } from "../utils/customError.js";
import { USER_ERRORS, FILE_ERRORS } from "../utils/errorCodes.js";
import {
  ErrorFactory,
  ValidationError,
  SystemError,
} from "../utils/customError.js";

/**
 * 🖼️ Service de gestion des avatars utilisateur
 * Responsabilités : upload, validation, redimensionnement, suppression, nettoyage
 */
class AvatarService {
  // Configuration par défaut
  static config = {
    uploadDir: "uploads/avatars",
    tempDir: "uploads/temp",
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ],
    allowedExtensions: ["jpg", "jpeg", "png", "webp", "gif"],
    imageSizes: {
      thumbnail: { width: 64, height: 64 },
      small: { width: 128, height: 128 },
      medium: { width: 256, height: 256 },
      large: { width: 512, height: 512 },
    },
  };

  // Logger injection
  static setLogger(injectedLogger) {
    this.logger = injectedLogger;
  }

  /**
   * 📤 Upload et traitement d'un avatar
   * @param {string} userId - ID de l'utilisateur
   * @param {object} fileData - Données du fichier (buffer, mimetype, filename)
   * @param {string} baseUrl - URL de base pour construire l'URL publique
   * @returns {Promise<object>} Résultat de l'upload
   */
  static async uploadAvatar(
    userId,
    fileData,
    baseUrl = "http://localhost:3001"
  ) {
    try {
      // 1. Validation des données d'entrée
      this.validateUserId(userId);
      this.validateFileData(fileData);

      const userLanguage = I18nService.getAvailableLanguages().FR; // TODO: récupérer de l'utilisateur

      // 2. Validation du fichier
      const validationResult = this.validateFile(fileData);
      if (!validationResult.isValid) {
        throw new ValidationError(
          validationResult.errors.join(", "),
          USER_ERRORS.INVALID_FILE
        );
      }

      // 3. Génération du nom de fichier unique
      const fileInfo = this.generateFileName(userId, fileData);

      // 4. Préparation des répertoires
      await this.ensureDirectories();

      // 5. Sauvegarde temporaire
      const tempPath = await this.saveTempFile(fileData, fileInfo);

      let finalPath;
      try {
        // 6. Traitement de l'image (redimensionnement, optimisation)
        finalPath = await this.processImage(tempPath, fileInfo);

        // 7. Construction de l'URL publique
        const avatarUrl = this.buildPublicUrl(fileInfo.fileName, baseUrl);

        // 8. Nettoyage du fichier temporaire
        await this.cleanupTempFile(tempPath);

        const result = {
          avatarUrl,
          fileName: fileInfo.fileName,
          fileSize: fileInfo.processedSize || fileData.size,
          originalSize: fileData.size,
          dimensions: this.config.imageSizes.medium, // Taille par défaut
          uploadedAt: new Date(),
          processed: true,
        };

        this.logger?.info(
          I18nService.getMessage("logs.avatarUploaded", userLanguage),
          {
            userId,
            fileName: fileInfo.fileName,
            originalSize: fileData.size,
            processedSize: result.fileSize,
            compressionRatio:
              fileData.size > 0 ? result.fileSize / fileData.size : 1,
          },
          {
            action: "avatar_uploaded",
            userId,
          }
        );

        return result;
      } catch (processingError) {
        // Nettoyage en cas d'erreur de traitement
        await this.cleanupTempFile(tempPath);
        if (finalPath) {
          await this.cleanupFile(finalPath);
        }
        throw processingError;
      }
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Error uploading avatar", error, {
        action: "upload_avatar_failed",
        userId,
        fileSize: fileData?.size,
        mimeType: fileData?.mimetype,
      });

      throw new SystemError("Error uploading avatar", error, {
        userId,
      });
    }
  }

  /**
   * 🗑️ Supprime un avatar
   * @param {string} avatarUrl - URL ou chemin de l'avatar
   * @returns {Promise<object>} Résultat de la suppression
   */
  static async deleteAvatar(avatarUrl) {
    try {
      if (!avatarUrl) {
        return { deleted: false, reason: "No avatar URL provided" };
      }

      // Extraction du nom de fichier depuis l'URL
      const fileName = this.extractFileNameFromUrl(avatarUrl);
      if (!fileName) {
        return { deleted: false, reason: "Invalid avatar URL format" };
      }

      // Vérification que c'est bien un fichier local
      if (!this.isLocalFile(avatarUrl)) {
        return { deleted: false, reason: "External URLs cannot be deleted" };
      }

      const filePath = path.join(this.config.uploadDir, fileName);

      // Vérification de l'existence du fichier
      try {
        await fs.access(filePath);
      } catch (accessError) {
        this.logger?.warn(
          "Attempted to delete non-existent avatar file",
          { avatarUrl, filePath },
          { action: "delete_nonexistent_avatar" }
        );
        return { deleted: false, reason: "File not found" };
      }

      // Suppression du fichier
      await fs.unlink(filePath);

      // Suppression des variantes (thumbnail, etc.) si elles existent
      await this.deleteAvatarVariants(fileName);

      this.logger?.info(
        "Avatar deleted successfully",
        { avatarUrl, fileName, filePath },
        { action: "avatar_deleted" }
      );

      return {
        deleted: true,
        deletedFile: fileName,
        deletedAt: new Date(),
      };
    } catch (error) {
      this.logger?.error("Error deleting avatar", error, {
        action: "delete_avatar_failed",
        avatarUrl,
      });

      throw new SystemError("Error deleting avatar", error, {
        avatarUrl,
      });
    }
  }

  /**
   * 🧹 Nettoyage des fichiers orphelins et temporaires
   * @param {number} maxAge - Âge maximum en millisecondes
   * @returns {Promise<object>} Statistiques de nettoyage
   */
  static async cleanupOrphanedFiles(
    maxAge = FILE_CONSTANTS.ORPHANED_FILE_CLEANUP
  ) {
    try {
      const stats = {
        tempFilesDeleted: 0,
        orphanedFilesDeleted: 0,
        errors: [],
        cleanupDate: new Date(),
      };

      // 1. Nettoyage des fichiers temporaires
      try {
        const tempStats = await this.cleanupTempFiles(
          FILE_CONSTANTS.TEMP_FILE_CLEANUP
        );
        stats.tempFilesDeleted = tempStats.deletedCount;
      } catch (tempError) {
        stats.errors.push(`Temp cleanup error: ${tempError.message}`);
      }

      // 2. Nettoyage des fichiers orphelins (TODO: nécessite une liste des avatars en DB)
      // Cette partie sera implémentée quand on aura accès à la liste des avatars actifs

      this.logger?.info("Avatar cleanup completed", stats, {
        action: "avatar_cleanup_completed",
      });

      return stats;
    } catch (error) {
      this.logger?.error("Error during avatar cleanup", error, {
        action: "avatar_cleanup_failed",
      });

      throw new SystemError("Error during avatar cleanup", error);
    }
  }

  /**
   * 📊 Obtient les statistiques d'utilisation des avatars
   * @returns {Promise<object>} Statistiques
   */
  static async getStorageStats() {
    try {
      const stats = {
        totalFiles: 0,
        totalSize: 0,
        byType: {},
        oldestFile: null,
        newestFile: null,
        averageSize: 0,
      };

      // Lecture du répertoire des avatars
      try {
        await fs.access(this.config.uploadDir);
        const files = await fs.readdir(this.config.uploadDir);

        for (const file of files) {
          const filePath = path.join(this.config.uploadDir, file);
          const fileStat = await fs.stat(filePath);

          if (fileStat.isFile()) {
            stats.totalFiles++;
            stats.totalSize += fileStat.size;

            const ext = path.extname(file).toLowerCase();
            stats.byType[ext] = (stats.byType[ext] || 0) + 1;

            if (
              !stats.oldestFile ||
              fileStat.birthtime < stats.oldestFile.date
            ) {
              stats.oldestFile = {
                file,
                date: fileStat.birthtime,
                size: fileStat.size,
              };
            }

            if (
              !stats.newestFile ||
              fileStat.birthtime > stats.newestFile.date
            ) {
              stats.newestFile = {
                file,
                date: fileStat.birthtime,
                size: fileStat.size,
              };
            }
          }
        }

        stats.averageSize =
          stats.totalFiles > 0 ? stats.totalSize / stats.totalFiles : 0;
      } catch (dirError) {
        // Répertoire n'existe pas ou n'est pas accessible
        this.logger?.warn("Avatar directory not accessible", {
          error: dirError.message,
        });
      }

      return stats;
    } catch (error) {
      this.logger?.error("Error getting storage stats", error, {
        action: "get_storage_stats_failed",
      });

      throw new SystemError("Error retrieving storage statistics", error);
    }
  }

  // ==========================================
  // 🔧 MÉTHODES UTILITAIRES PRIVÉES
  // ==========================================

  /**
   * Valide l'ID utilisateur
   */
  static validateUserId(userId) {
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      throw new ValidationError("Invalid user ID", USER_ERRORS.INVALID_USER_ID);
    }
  }

  /**
   * Valide les données du fichier
   */
  static validateFileData(fileData) {
    if (!fileData) {
      throw new ValidationError(
        "No file data provided",
        USER_ERRORS.INVALID_FILE
      );
    }

    if (!fileData.buffer && !fileData.data) {
      throw new ValidationError(
        "No file buffer provided",
        USER_ERRORS.INVALID_FILE
      );
    }

    if (!fileData.mimetype) {
      throw new ValidationError(
        "No mime type provided",
        USER_ERRORS.INVALID_FILE
      );
    }
  }

  /**
   * Valide le fichier selon les contraintes
   */
  static validateFile(fileData) {
    const errors = [];

    // Taille
    const fileSize =
      fileData.size || (fileData.buffer ? fileData.buffer.length : 0);
    if (fileSize > this.config.maxFileSize) {
      errors.push(
        `File too large (max: ${Math.round(this.config.maxFileSize / 1024 / 1024)}MB)`
      );
    }

    if (fileSize === 0) {
      errors.push("File is empty");
    }

    // Type MIME
    if (!this.config.allowedMimeTypes.includes(fileData.mimetype)) {
      errors.push(
        `Invalid file type. Allowed: ${this.config.allowedMimeTypes.join(", ")}`
      );
    }

    // Extension (si filename fourni)
    if (fileData.filename) {
      const ext = path.extname(fileData.filename).toLowerCase().slice(1);
      if (ext && !this.config.allowedExtensions.includes(ext)) {
        errors.push(
          `Invalid file extension. Allowed: ${this.config.allowedExtensions.join(", ")}`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Génère un nom de fichier unique
   */
  static generateFileName(userId, fileData) {
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(8).toString("hex");
    const ext = this.getFileExtension(fileData);

    const fileName = `${userId}_${timestamp}_${randomBytes}.${ext}`;

    return {
      fileName,
      originalName: fileData.filename || "unknown",
      extension: ext,
      timestamp,
    };
  }

  /**
   * Obtient l'extension du fichier
   */
  static getFileExtension(fileData) {
    // Priorité à l'extension du filename
    if (fileData.filename) {
      const ext = path.extname(fileData.filename).toLowerCase().slice(1);
      if (this.config.allowedExtensions.includes(ext)) {
        return ext;
      }
    }

    // Fallback sur le type MIME
    const mimeToExt = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    };

    return mimeToExt[fileData.mimetype] || "jpg";
  }

  /**
   * S'assure que les répertoires existent
   */
  static async ensureDirectories() {
    try {
      await fs.mkdir(this.config.uploadDir, { recursive: true });
      await fs.mkdir(this.config.tempDir, { recursive: true });
    } catch (error) {
      throw new SystemError("Cannot create upload directories", error);
    }
  }

  /**
   * Sauvegarde temporaire du fichier
   */
  static async saveTempFile(fileData, fileInfo) {
    const tempPath = path.join(
      this.config.tempDir,
      `temp_${fileInfo.fileName}`
    );
    const buffer = fileData.buffer || fileData.data;

    await fs.writeFile(tempPath, buffer);
    return tempPath;
  }

  /**
   * Traite l'image (redimensionnement, optimisation)
   * Note: Version basique sans dépendance externe comme Sharp
   */
  static async processImage(tempPath, fileInfo) {
    const finalPath = path.join(this.config.uploadDir, fileInfo.fileName);

    // Pour l'instant, simple copie (TODO: ajouter redimensionnement avec Sharp)
    await fs.copyFile(tempPath, finalPath);

    // Obtenir la taille du fichier traité
    const stats = await fs.stat(finalPath);
    fileInfo.processedSize = stats.size;

    return finalPath;
  }

  /**
   * Construit l'URL publique
   */
  static buildPublicUrl(fileName, baseUrl) {
    const cleanBaseUrl = baseUrl.replace(/\/$/, ""); // Supprime le slash final
    return `${cleanBaseUrl}/uploads/avatars/${fileName}`;
  }

  /**
   * Extrait le nom de fichier depuis une URL
   */
  static extractFileNameFromUrl(avatarUrl) {
    if (!avatarUrl || typeof avatarUrl !== "string") {
      return null;
    }

    // Extraction du nom de fichier depuis l'URL
    const match = avatarUrl.match(/\/uploads\/avatars\/([^/?]+)/);
    return match ? match[1] : null;
  }

  /**
   * Vérifie si c'est un fichier local
   */
  static isLocalFile(avatarUrl) {
    return avatarUrl && avatarUrl.includes("/uploads/");
  }

  /**
   * Supprime les variantes d'avatar (thumbnails, etc.)
   */
  static async deleteAvatarVariants(fileName) {
    // TODO: Implémenter quand on aura les variantes de taille
    // const baseName = path.parse(fileName).name;
    // const ext = path.parse(fileName).ext;
    //
    // for (const [sizeName, _] of Object.entries(this.config.imageSizes)) {
    //   const variantName = `${baseName}_${sizeName}${ext}`;
    //   const variantPath = path.join(this.config.uploadDir, variantName);
    //
    //   try {
    //     await fs.unlink(variantPath);
    //   } catch (error) {
    //     // Ignore si le fichier n'existe pas
    //   }
    // }
  }

  /**
   * Nettoyage des fichiers temporaires
   */
  static async cleanupTempFiles(maxAge = FILE_CONSTANTS.TEMP_FILE_CLEANUP) {
    let deletedCount = 0;

    try {
      const files = await fs.readdir(this.config.tempDir);
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(this.config.tempDir, file);
        const stats = await fs.stat(filePath);

        if (now - stats.birthtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }
    } catch (error) {
      // Si le répertoire n'existe pas, pas d'erreur
      if (error.code !== "ENOENT") {
        throw error;
      }
    }

    return { deletedCount };
  }

  /**
   * Supprime un fichier temporaire
   */
  static async cleanupTempFile(tempPath) {
    try {
      await fs.unlink(tempPath);
    } catch (error) {
      // Log but don't throw - cleanup is not critical
      this.logger?.warn("Failed to cleanup temp file", {
        tempPath,
        error: error.message,
      });
    }
  }

  /**
   * Supprime un fichier
   */
  static async cleanupFile(filePath) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      this.logger?.warn("Failed to cleanup file", {
        filePath,
        error: error.message,
      });
    }
  }

  /**
   * 🏥 Vérification de santé du service
   */
  static async healthCheck() {
    try {
      const health = {
        status: "healthy",
        timestamp: new Date(),
        checks: {},
      };

      // Vérification des répertoires
      try {
        await fs.access(this.config.uploadDir);
        health.checks.uploadDirectory = "accessible";
      } catch (error) {
        health.checks.uploadDirectory = "error";
        health.status = "degraded";
      }

      try {
        await fs.access(this.config.tempDir);
        health.checks.tempDirectory = "accessible";
      } catch (error) {
        health.checks.tempDirectory = "error";
        health.status = "degraded";
      }

      // Statistiques de stockage
      const storageStats = await this.getStorageStats();
      health.storage = {
        totalFiles: storageStats.totalFiles,
        totalSizeMB: Math.round(storageStats.totalSize / 1024 / 1024),
        averageSizeMB: Math.round(storageStats.averageSize / 1024 / 1024),
      };

      return health;
    } catch (error) {
      return {
        status: "error",
        timestamp: new Date(),
        error: error.message,
      };
    }
  }
}

export default AvatarService;
