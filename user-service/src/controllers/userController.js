const UserService = require("../services/userService");
const AuthService = require("../services/authService");
const { logger } = require("../utils/logger");

/**
 * 👤 User management controller
 */
class UserController {
  /**
   * Get detailed user profile
   */
  static async getProfile(request, reply) {
    try {
      const userId = request.user._id;

      const result = await UserService.getUserProfile(userId);

      return reply.success(result, "Profil récupéré avec succès");
    } catch (error) {
      if (error.statusCode) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "USER_PROFILE_ERROR",
        });
      }

      return reply.code(500).error("Erreur lors de la récupération du profil");
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
      if (error.statusCode) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "NAME_UPDATE_ERROR",
        });
      }

      return reply.code(500).error("Erreur lors de la mise à jour");
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
      if (error.statusCode) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "USER_STATS_ERROR",
        });
      }

      return reply
        .code(500)
        .error("Erreur lors de la récupération des statistiques");
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
      return reply
        .code(500)
        .error("Erreur lors de la récupération des comptes");
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
      if (error.statusCode) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "DISCONNECT_ACCOUNT_ERROR",
        });
      }

      return reply.code(500).error("Erreur lors de la déconnexion du compte");
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

      return reply.code(501).send({
        error: "Non implémenté",
        message:
          "La fonctionnalité de refresh des tokens sera implémentée prochainement",
      });
    } catch (error) {
      return reply.code(500).error("Erreur lors du refresh du compte");
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
      if (error.statusCode) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "HEALTH_CHECK_ERROR",
        });
      }

      return reply.code(500).error("Erreur lors du test de santé");
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
      if (error.statusCode) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "PASSWORD_CHANGE_ERROR",
        });
      }

      return reply.code(500).error("Erreur lors du changement de mot de passe");
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
      return reply.code(500).error("Erreur lors du nettoyage des comptes");
    }
  }
}

module.exports = UserController;
