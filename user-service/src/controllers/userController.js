// ============================================================================
// 📁 src/controllers/userController.js - Gestion des utilisateurs (refactorisé)
// ============================================================================

import UserService from "../services/userService.js";
import AuthService from "../services/authService.js";

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

      const result = await UserService.deleteUserAccount(userId, password);

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

      return reply.success(result, "Compte supprimé avec succès");
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
          error: error.message,
          code: error.code || "PASSWORD_CHANGE_ERROR",
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }
}

export default UserController;
