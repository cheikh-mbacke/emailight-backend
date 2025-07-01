import UserService from "../services/userService.js";
import AuthService from "../services/authService.js";

/**
 * 👤 User management controller (MISE À JOUR)
 */
class UserController {
  // ✅ Injection du logger
  static setLogger(injectedLogger) {
    this.logger = injectedLogger;
  }

  /**
   * Get detailed user profile
   */
  static async getProfile(request, reply) {
    try {
      const userId = request.user._id;

      const result = await UserService.getUserProfile(userId);

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
      // Le gestionnaire exceptionless.js va automatiquement capturer et reporter
      throw error;
    }
  }

  /**
   * Quick profile update (name only)
   */
  static async updateProfile(request, reply) {
    try {
      const { name } = request.body;
      const userId = request.user._id;

      const result = await UserService.updateUserName(userId, name);

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
      const result = await UserService.updateUserAvatar(
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

      const result = await UserService.deleteUserAvatar(userId);

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
   * 🗑️ Delete user account permanently (GDPR)
   */
  static async deleteAccount(request, reply) {
    try {
      const userId = request.user._id;
      const userEmail = request.user.email;

      // Confirmation suppression définitive
      const result = await UserService.deleteUserAccount(userId);

      // Log spécial pour la suppression définitive de compte
      this.logger.user(
        "Compte supprimé définitivement par l'utilisateur",
        {
          email: userEmail,
          deletedData: result.deletedData,
          gdprCompliant: result.gdprCompliant,
        },
        {
          userId: userId.toString(),
          email: userEmail,
          action: "account_self_deleted",
          critical: true,
        }
      );

      return reply.success(result, "Compte supprimé définitivement");
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "ACCOUNT_DELETION_ERROR",
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  static async getStats(request, reply) {
    try {
      const userId = request.user._id;

      const result = await UserService.getUserStats(userId);

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

  /**
   * Get connected email accounts
   */
  static async getEmailAccounts(request, reply) {
    try {
      const userId = request.user._id;
      const { active, provider } = request.query;

      const result = await UserService.getUserEmailAccounts(userId, {
        active,
        provider,
      });

      return reply.success(result, "Comptes email récupérés avec succès");
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "GET_EMAIL_ACCOUNTS_ERROR",
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * Disconnect an email account
   */
  static async disconnectEmailAccount(request, reply) {
    try {
      const userId = request.user._id;
      const { accountId } = request.params;

      const result = await UserService.disconnectEmailAccount(
        userId,
        accountId
      );

      return reply.success(result, "Compte email déconnecté avec succès");
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "DISCONNECT_ACCOUNT_ERROR",
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * Refresh an email account (placeholder)
   */
  static async refreshEmailAccount(request, reply) {
    try {
      const { accountId } = request.params;

      // TODO: Implement OAuth token refresh logic
      // Depends on the provider (Gmail, Outlook, etc.)

      this.logger.info(
        "Tentative de refresh d'un compte email",
        {
          accountId,
          feature: "non_implementé",
        },
        {
          userId: request.user._id.toString(),
          action: "email_account_refresh_attempted",
        }
      );

      return reply.code(501).send({
        error: "Non implémenté",
        message:
          "La fonctionnalité de refresh des tokens sera implémentée prochainement",
      });
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "REFRESH_ACCOUNT_ERROR",
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * Check email account health
   */
  static async checkEmailAccountHealth(request, reply) {
    try {
      const userId = request.user._id;
      const { accountId } = request.params;

      const result = await UserService.checkEmailAccountHealth(
        userId,
        accountId
      );

      return reply.success(result, "État de santé du compte récupéré");
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "HEALTH_CHECK_ERROR",
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * Securely change user password
   */
  static async changePassword(request, reply) {
    try {
      const { currentPassword, newPassword } = request.body;
      const userId = request.user._id;

      const result = await AuthService.changePassword(userId, {
        currentPassword,
        newPassword,
      });

      return reply.success(
        {
          passwordChanged: result.passwordChanged,
          changedAt: result.changedAt,
        },
        "Mot de passe mis à jour avec succès"
      );
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "PASSWORD_CHANGE_ERROR",
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * Clean up inactive email accounts
   */
  static async cleanupEmailAccounts(request, reply) {
    try {
      const userId = request.user._id;

      const result = await UserService.cleanupInactiveEmailAccounts(userId);

      return reply.success(result, "Nettoyage des comptes terminé");
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "CLEANUP_ERROR",
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      // Log local pour debug mais on laisse remonter
      this.logger.error("Erreur lors du nettoyage des comptes", error, {
        action: "email_accounts_cleanup_failed",
        userId: request.user?._id?.toString(),
      });

      throw error;
    }
  }
}

export default UserController;
