// ============================================================================
// 📁 src/controllers/userController.js - Gestion des utilisateurs (refactorisé)
// ============================================================================

import UserService from "../services/userService.js";
import AuthService from "../services/authService.js";
import I18nService from "../services/i18nService.js";

/**
 * 👤 User management controller (refactorisé)
 * Responsabilités : Fonctions de base utilisateur, suppression de compte, changement de mot de passe
 */
class UserController {
  // ✅ Injection du logger
  static setLogger(injectedLogger) {
    this.logger = injectedLogger;
  }

  /**
   * 🗑️ Delete user account permanently (GDPR)
   */
  static async deleteAccount(request, reply) {
    try {
      const userId = request.user._id;
      const { password } = request.body;

      // Validation de sécurité - le mot de passe n'est requis que si l'utilisateur en a un
      // La validation complète se fait dans le service

      const language = I18nService.getRequestLanguage(request);
      const result = await UserService.deleteUserAccount(
        userId,
        password,
        language
      );

      this.logger?.user(
        "Compte utilisateur supprimé",
        {
          userId: userId.toString(),
          email: request.user.email,
        },
        {
          userId: userId.toString(),
          action: "account_deleted",
        }
      );

      const successMessage = I18nService.getMessage(
        "success.account_deleted",
        language
      );
      return reply.success(null, successMessage);
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          status: "failed",
          errorCode: String(error.statusCode),
          errorName: error.code || "ACCOUNT_DELETION_ERROR",
          errorMessage: error.message,
        });
      }
      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * 🔐 Securely change user password
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
          status: "failed",
          errorCode: String(error.statusCode),
          errorName: error.code || "PASSWORD_CHANGE_ERROR",
          errorMessage: error.message,
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }
}

export default UserController;
