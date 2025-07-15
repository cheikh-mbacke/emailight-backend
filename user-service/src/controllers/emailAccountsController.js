// ============================================================================
// 📁 src/controllers/emailAccountsController.js - Gestion des comptes email
// ============================================================================

import EmailAccountsService from "../services/emailAccountsService.js";
import GmailOAuthService from "../services/gmailOAuthService.js";
import TokenRefreshService from "../services/tokenRefreshService.js";

/**
 * 📧 Email accounts management controller
 * Responsabilités : Comptes email OAuth/SMTP, santé, déconnexion
 */
class EmailAccountsController {
  // ✅ Injection du logger
  static setLogger(injectedLogger) {
    this.logger = injectedLogger;
  }

  /**
   * 📋 Get user email accounts with pagination
   */
  static async getEmailAccounts(request, reply) {
    try {
      const userId = request.user._id;
      const { active, provider, page, limit, sortBy, sortOrder } =
        request.query;

      const filters = {
        active: active !== undefined ? active === "true" : undefined,
        provider,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        sortBy: sortBy || "lastUsed",
        sortOrder: sortOrder || "desc",
      };

      // Construire l'URL de base pour les liens de pagination
      const baseUrl = `${request.protocol}://${request.hostname}${request.url.split("?")[0]}`;

      const result = await EmailAccountsService.getUserEmailAccounts(
        userId,
        filters,
        { baseUrl }
      );

      return reply.success(result, "Comptes email récupérés avec succès");
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "EMAIL_ACCOUNTS_ERROR",
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * 🔌 Disconnect email account
   */
  static async disconnectEmailAccount(request, reply) {
    try {
      const userId = request.user._id;
      const { accountId } = request.params;

      const result = await EmailAccountsService.disconnectEmailAccount(
        userId,
        accountId
      );

      return reply.success(result, "Compte email déconnecté avec succès");
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "DISCONNECT_EMAIL_ACCOUNT_ERROR",
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * 🏥 Check email account health
   */
  static async checkEmailAccountHealth(request, reply) {
    try {
      const userId = request.user._id;
      const { accountId } = request.params;

      const result = await EmailAccountsService.checkEmailAccountHealth(
        userId,
        accountId
      );

      return reply.success(result, "Santé du compte vérifiée");
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "EMAIL_ACCOUNT_HEALTH_ERROR",
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * 🧹 Cleanup inactive email accounts
   */
  static async cleanupInactiveEmailAccounts(request, reply) {
    try {
      const userId = request.user._id;

      const result =
        await EmailAccountsService.cleanupInactiveEmailAccounts(userId);

      return reply.success(result, "Nettoyage des comptes terminé");
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "EMAIL_ACCOUNTS_CLEANUP_ERROR",
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
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

      // Créer le compte email
      const result = await EmailAccountsService.createEmailAccount(userId, {
        email: tokenResult.email,
        provider: "gmail",
        oauthTokens: tokenResult.tokens,
        isActive: true,
      });

      this.logger?.user(
        "Compte Gmail connecté avec succès",
        {
          userId: userId.toString(),
          email: tokenResult.email,
        },
        {
          userId: userId.toString(),
          action: "gmail_account_connected",
          email: tokenResult.email,
        }
      );

      return reply.success(result, "Compte Gmail connecté avec succès");
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "GMAIL_CONNECTION_ERROR",
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

      const result = await TokenRefreshService.refreshAccountTokens(
        userId,
        accountId
      );

      return reply.success(result, "Tokens rafraîchis avec succès");
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "TOKEN_REFRESH_ERROR",
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
      const userId = request.user._id;

      const result = await TokenRefreshService.getUserRefreshStats(userId);

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
   * 🧹 Manual cleanup of failed accounts
   */
  static async manualCleanupFailedAccounts(request, reply) {
    try {
      const userId = request.user._id;

      const result =
        await EmailAccountsService.manualCleanupFailedAccounts(userId);

      return reply.success(result, "Nettoyage manuel terminé");
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
   * 🔄 Force refresh all user tokens
   */
  static async forceRefreshAllUserTokens(request, reply) {
    try {
      const userId = request.user._id;

      const result =
        await TokenRefreshService.forceRefreshAllUserTokens(userId);

      return reply.success(result, "Refresh forcé de tous les tokens terminé");
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
   * 📋 Get detailed email account information
   */
  static async getDetailedEmailAccountInfo(request, reply) {
    try {
      const userId = request.user._id;
      const { accountId } = request.params;

      const result = await EmailAccountsService.getDetailedEmailAccountInfo(
        userId,
        accountId
      );

      return reply.success(result, "Informations détaillées récupérées");
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "DETAILED_INFO_ERROR",
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * ⚙️ Update email account settings
   */
  static async updateEmailAccountSettings(request, reply) {
    try {
      const userId = request.user._id;
      const { accountId } = request.params;
      const settings = request.body;

      const result = await EmailAccountsService.updateEmailAccountSettings(
        userId,
        accountId,
        settings
      );

      return reply.success(result, "Paramètres mis à jour avec succès");
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "SETTINGS_UPDATE_ERROR",
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }
}

export default EmailAccountsController;
