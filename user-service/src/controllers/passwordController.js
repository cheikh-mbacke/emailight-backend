// ============================================================================
// 📁 passwordController.js - Contrôleur de gestion des mots de passe
// ============================================================================

import PasswordService from "../services/passwordService.js";

/**
 * 🔐 Password management controller
 */
class PasswordController {
  /**
   * 📝 Set logger instance
   */
  static setLogger(injectedLogger) {
    this.logger = injectedLogger;
    PasswordService.setLogger(injectedLogger);
  }

  /**
   * 🔄 Change user password
   */
  static async changePassword(request, reply) {
    try {
      const { currentPassword, newPassword } = request.body;
      const userId = request.user._id.toString();

      const result = await PasswordService.changePassword(
        userId,
        currentPassword,
        newPassword,
        request.language
      );

      return reply.success(null, result.message);
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

  /**
   * 📧 Request password reset
   */
  static async requestPasswordReset(request, reply) {
    try {
      const { email } = request.body;

      const result = await PasswordService.requestPasswordReset(
        email,
        request.language
      );

      return reply.success(result, result.message);
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          status: "failed",
          errorCode: String(error.statusCode),
          errorName: error.code || "PASSWORD_RESET_REQUEST_ERROR",
          errorMessage: error.message,
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * 🔄 Reset password with token
   */
  static async resetPassword(request, reply) {
    try {
      const { token, newPassword } = request.body;

      const result = await PasswordService.resetPassword(
        token,
        newPassword,
        request.language
      );

      return reply.success(result, result.message);
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          status: "failed",
          errorCode: String(error.statusCode),
          errorName: error.code || "PASSWORD_RESET_ERROR",
          errorMessage: error.message,
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }
}

export default PasswordController;
