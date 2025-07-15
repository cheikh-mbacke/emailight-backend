import UserService from "../services/userService.js";
import AuthService from "../services/authService.js";

import GmailOAuthService from "../services/gmailOAuthService.js";
import OutlookOAuthService from "../services/outlookOAuthService.js";
import TokenRefreshService from "../services/tokenRefreshService.js";
import EmailAccount from "../models/EmailAccount.js";

/**
 * 👤 User management controller
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
      this.logger?.user(
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
      this.logger?.error("Erreur lors du nettoyage des comptes", error, {
        action: "email_accounts_cleanup_failed",
        userId: request.user?._id?.toString(),
      });

      throw error;
    }
  }

  /**
   * 🔗 Generate Gmail OAuth authorization URL
   */
  static async generateGmailAuthUrl(request, reply) {
    try {
      const userId = request.user._id;

      const result = GmailOAuthService.generateAuthUrl(userId);

      this.logger?.user(
        "URL d'autorisation Gmail générée",
        {
          userId: userId.toString(),
          scopes: result.scopes.length,
        },
        {
          userId: userId.toString(),
          action: "gmail_auth_url_generated",
        }
      );

      return reply.success(result, "URL d'autorisation Gmail générée");
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "GMAIL_AUTH_URL_ERROR",
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * 📧 Connect Gmail account via OAuth
   */
  static async connectGmailAccount(request, reply) {
    try {
      const { code, state } = request.body;
      const userId = request.user._id;

      // Valider le state si fourni
      if (state && state !== userId.toString()) {
        return reply.code(400).send({
          error: "Paramètre state invalide",
          message: "Le paramètre state ne correspond pas à l'utilisateur",
          code: "INVALID_STATE_PARAMETER",
        });
      }

      // Échanger le code contre des tokens
      const tokenResult = await GmailOAuthService.exchangeCodeForTokens(
        code,
        userId
      );

      // Sauvegarder le compte en base
      const result = await GmailOAuthService.saveGmailAccount(
        userId,
        tokenResult.tokens,
        tokenResult.userInfo,
        tokenResult.scopes
      );

      return reply
        .code(201)
        .success(result, "Compte Gmail connecté avec succès");
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "GMAIL_CONNECTION_ERROR",
          details: error.details || null,
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * 🔗 Generate Outlook OAuth authorization URL
   */
  static async generateOutlookAuthUrl(request, reply) {
    try {
      const userId = request.user._id;

      const result = OutlookOAuthService.generateAuthUrl(userId);

      this.logger?.user(
        "URL d'autorisation Outlook générée",
        {
          userId: userId.toString(),
          scopes: result.scopes.length,
        },
        {
          userId: userId.toString(),
          action: "outlook_auth_url_generated",
        }
      );

      return reply.success(result, "URL d'autorisation Outlook générée");
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "OUTLOOK_AUTH_URL_ERROR",
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * 📧 Connect Outlook account via OAuth
   */
  static async connectOutlookAccount(request, reply) {
    try {
      const { code, state } = request.body;
      const userId = request.user._id;

      // Valider le state si fourni
      if (state && state !== userId.toString()) {
        return reply.code(400).send({
          error: "Paramètre state invalide",
          message: "Le paramètre state ne correspond pas à l'utilisateur",
          code: "INVALID_STATE_PARAMETER",
        });
      }

      // Échanger le code contre des tokens
      const tokenResult = await OutlookOAuthService.exchangeCodeForTokens(
        code,
        userId
      );

      // Sauvegarder le compte en base
      const result = await OutlookOAuthService.saveOutlookAccount(
        userId,
        tokenResult.tokens,
        tokenResult.userInfo,
        tokenResult.scopes
      );

      return reply
        .code(201)
        .success(result, "Compte Outlook connecté avec succès");
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "OUTLOOK_CONNECTION_ERROR",
          details: error.details || null,
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * 🔄 Refresh email account tokens
   */
  static async refreshEmailAccountTokens(request, reply) {
    try {
      const userId = request.user._id;
      const { accountId } = request.params;

      const result = await TokenRefreshService.refreshAccountById(
        accountId,
        userId
      );

      return reply.success(result, "Tokens rafraîchis avec succès");
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "TOKEN_REFRESH_ERROR",
          details: error.details || null,
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * 🧪 Test email account connection
   */
  static async testEmailAccountConnection(request, reply) {
    try {
      const userId = request.user._id;
      const { accountId } = request.params;

      // Récupérer le compte
      const emailAccount = await EmailAccount.findOne({
        _id: accountId,
        userId: userId,
      });

      if (!emailAccount) {
        return reply.code(404).send({
          error: "Compte email introuvable",
          message: "Ce compte email n'existe pas ou ne vous appartient pas",
          code: "EMAIL_ACCOUNT_NOT_FOUND",
        });
      }

      let result;

      // Tester selon le provider
      switch (emailAccount.provider) {
        case "gmail":
          result = await GmailOAuthService.testConnection(emailAccount);
          break;

        case "outlook":
          result = await OutlookOAuthService.testConnection(emailAccount);
          break;

        default:
          return reply.code(501).send({
            error: "Provider non supporté",
            message: `Le test de connexion n'est pas encore implémenté pour ${emailAccount.provider}`,
            code: "PROVIDER_NOT_SUPPORTED",
          });
      }

      const message =
        result.status === "token_refreshed"
          ? "Connexion testée - Token rafraîchi automatiquement"
          : "Connexion testée avec succès";

      return reply.success(result, message);
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "CONNECTION_TEST_ERROR",
          details: error.details || null,
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * 📊 Get token refresh statistics
   */
  static async getTokenRefreshStats(request, reply) {
    try {
      const result = await TokenRefreshService.getRefreshStats();

      return reply.success(result, "Statistiques de refresh récupérées");
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "REFRESH_STATS_ERROR",
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * 🧹 Manual cleanup of failed email accounts
   */
  static async manualCleanupFailedAccounts(request, reply) {
    try {
      const userId = request.user._id;
      const { maxErrors = 10 } = request.query;

      // Nettoyer seulement les comptes de l'utilisateur connecté
      const userAccounts = await EmailAccount.find({
        userId,
        isActive: true,
        errorCount: { $gte: maxErrors },
      });

      if (userAccounts.length === 0) {
        return reply.success(
          { deactivated: 0, message: "Aucun compte à nettoyer" },
          "Nettoyage terminé"
        );
      }

      // Désactiver les comptes avec trop d'erreurs
      const result = await EmailAccount.updateMany(
        {
          userId,
          isActive: true,
          errorCount: { $gte: maxErrors },
        },
        {
          $set: { isActive: false },
        }
      );

      this.logger?.user(
        "Nettoyage manuel des comptes en erreur",
        {
          deactivated: result.modifiedCount,
          maxErrors,
          userAccounts: userAccounts.map((acc) => ({
            email: acc.email,
            provider: acc.provider,
            errorCount: acc.errorCount,
          })),
        },
        {
          userId: userId.toString(),
          action: "manual_cleanup_failed_accounts",
        }
      );

      return reply.success(
        {
          deactivated: result.modifiedCount,
          accounts: userAccounts.map((acc) => ({
            id: acc._id.toString(),
            email: acc.email,
            provider: acc.provider,
            errorCount: acc.errorCount,
          })),
        },
        `${result.modifiedCount} compte(s) désactivé(s)`
      );
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "MANUAL_CLEANUP_ERROR",
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * 🔧 Force refresh all user tokens (manual)
   */
  static async forceRefreshAllUserTokens(request, reply) {
    try {
      const userId = request.user._id;

      // Récupérer tous les comptes actifs de l'utilisateur
      const userAccounts = await EmailAccount.find({
        userId,
        isActive: true,
        refreshToken: { $exists: true, $ne: null },
      });

      if (userAccounts.length === 0) {
        return reply.success(
          { refreshed: 0, message: "Aucun compte à rafraîchir" },
          "Aucun token à rafraîchir"
        );
      }

      let refreshedCount = 0;
      let errorCount = 0;
      const results = [];

      // Rafraîchir chaque compte individuellement
      for (const account of userAccounts) {
        try {
          const refreshResult =
            await TokenRefreshService.refreshAccountToken(account);

          refreshedCount++;
          results.push({
            accountId: account._id.toString(),
            email: account.email,
            provider: account.provider,
            status: "refreshed",
            newExpiry: refreshResult.newExpiry,
          });
        } catch (error) {
          errorCount++;
          results.push({
            accountId: account._id.toString(),
            email: account.email,
            provider: account.provider,
            status: "failed",
            error: error.message,
          });
        }
      }

      this.logger?.user(
        "Refresh forcé de tous les tokens utilisateur",
        {
          totalAccounts: userAccounts.length,
          refreshed: refreshedCount,
          errors: errorCount,
        },
        {
          userId: userId.toString(),
          action: "force_refresh_all_user_tokens",
        }
      );

      return reply.success(
        {
          totalAccounts: userAccounts.length,
          refreshed: refreshedCount,
          errors: errorCount,
          results,
          processedAt: new Date(),
        },
        `${refreshedCount}/${userAccounts.length} tokens rafraîchis`
      );
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "FORCE_REFRESH_ERROR",
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * 📧 Get detailed email account info with tokens status
   */
  static async getDetailedEmailAccountInfo(request, reply) {
    try {
      const userId = request.user._id;
      const { accountId } = request.params;

      // Récupérer le compte avec plus de détails
      const emailAccount = await EmailAccount.findOne({
        _id: accountId,
        userId: userId,
      });

      if (!emailAccount) {
        return reply.code(404).send({
          error: "Compte email introuvable",
          message: "Ce compte email n'existe pas ou ne vous appartient pas",
          code: "EMAIL_ACCOUNT_NOT_FOUND",
        });
      }

      // Informations détaillées
      const now = new Date();
      const tokenExpiredMinutesAgo = emailAccount.tokenExpiry
        ? Math.round((now - emailAccount.tokenExpiry) / (1000 * 60))
        : null;

      const isExpired =
        emailAccount.tokenExpiry && emailAccount.tokenExpiry < now;
      const expiresInMinutes = emailAccount.tokenExpiry
        ? Math.round((emailAccount.tokenExpiry - now) / (1000 * 60))
        : null;

      const detailedInfo = {
        account: emailAccount.secureInfo,
        tokenStatus: {
          hasAccessToken: !!emailAccount.accessToken,
          hasRefreshToken: !!emailAccount.refreshToken,
          isExpired,
          expiresAt: emailAccount.tokenExpiry,
          expiresInMinutes: isExpired ? null : expiresInMinutes,
          expiredMinutesAgo: isExpired ? tokenExpiredMinutesAgo : null,
          canRefresh: !!emailAccount.refreshToken && emailAccount.isActive,
        },
        health: {
          status: emailAccount.healthStatus,
          errorCount: emailAccount.errorCount,
          lastError: emailAccount.lastError,
          lastUsed: emailAccount.lastUsed,
          isActive: emailAccount.isActive,
          recommendations: [],
        },
        oauth: {
          provider: emailAccount.provider,
          scopes: emailAccount.scopes,
          providerId: emailAccount.providerId,
          isVerified: emailAccount.isVerified,
        },
        usage: {
          emailsSent: emailAccount.emailsSent,
          createdAt: emailAccount.createdAt,
          lastSyncAt: emailAccount.lastSyncAt,
        },
      };

      // Ajouter des recommandations
      if (isExpired && emailAccount.refreshToken) {
        detailedInfo.health.recommendations.push(
          "Token expiré - Refresh recommandé"
        );
      }
      if (emailAccount.errorCount >= 3) {
        detailedInfo.health.recommendations.push(
          "Plusieurs erreurs - Vérifier la connexion"
        );
      }
      if (
        !emailAccount.lastUsed ||
        now - emailAccount.lastUsed > 30 * 24 * 60 * 60 * 1000
      ) {
        detailedInfo.health.recommendations.push(
          "Compte non utilisé depuis 30+ jours"
        );
      }
      if (!emailAccount.isVerified) {
        detailedInfo.health.recommendations.push("Email non vérifié");
      }

      return reply.success(detailedInfo, "Informations détaillées du compte");
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "GET_DETAILED_ACCOUNT_ERROR",
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * 🔧 Update email account settings
   */
  static async updateEmailAccountSettings(request, reply) {
    try {
      const userId = request.user._id;
      const { accountId } = request.params;
      const { displayName, isActive, settings } = request.body;

      // Récupérer le compte
      const emailAccount = await EmailAccount.findOne({
        _id: accountId,
        userId: userId,
      });

      if (!emailAccount) {
        return reply.code(404).send({
          error: "Compte email introuvable",
          message: "Ce compte email n'existe pas ou ne vous appartient pas",
          code: "EMAIL_ACCOUNT_NOT_FOUND",
        });
      }

      // Mettre à jour les champs autorisés
      const updates = {};

      if (displayName !== undefined) {
        updates.displayName = displayName.trim();
      }

      if (isActive !== undefined) {
        updates.isActive = isActive;
      }

      if (settings) {
        // Mettre à jour les paramètres spécifiques
        if (settings.defaultSignature !== undefined) {
          updates["settings.defaultSignature"] = settings.defaultSignature;
        }
        if (settings.autoReply !== undefined) {
          updates["settings.autoReply"] = settings.autoReply;
        }
        if (settings.allowedAliases !== undefined) {
          updates["settings.allowedAliases"] = settings.allowedAliases;
        }
      }

      if (Object.keys(updates).length === 0) {
        return reply.code(400).send({
          error: "Aucune mise à jour fournie",
          message: "Au moins un champ doit être modifié",
          code: "NO_UPDATES_PROVIDED",
        });
      }

      // Appliquer les mises à jour
      const updatedAccount = await EmailAccount.findByIdAndUpdate(
        accountId,
        { $set: updates },
        { new: true, runValidators: true }
      );

      this.logger?.user(
        "Paramètres du compte email mis à jour",
        {
          accountId: accountId.toString(),
          email: updatedAccount.email,
          updatedFields: Object.keys(updates),
        },
        {
          userId: userId.toString(),
          email: updatedAccount.email,
          action: "email_account_settings_updated",
        }
      );

      return reply.success(
        {
          account: updatedAccount.secureInfo,
          updatedFields: Object.keys(updates),
          updatedAt: new Date(),
        },
        "Paramètres du compte mis à jour"
      );
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "UPDATE_ACCOUNT_SETTINGS_ERROR",
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }
}

export default UserController;
