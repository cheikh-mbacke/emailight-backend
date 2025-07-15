// ============================================================================
// 📁 src/services/emailAccountsService.js - Gestion des comptes email
// ============================================================================

import mongoose from "mongoose";
import User from "../models/User.js";
import EmailAccount from "../models/EmailAccount.js";
import PaginationHelper from "../utils/paginationHelper.js";
import I18nService from "./i18nService.js";
import { ErrorFactory, SystemError } from "../utils/customError.js";
import { USER_ERRORS, EMAIL_ACCOUNT_ERRORS } from "../utils/errorCodes.js";
import { SECURITY_INTERVALS, TIME_HELPERS } from "../constants/timeConstants.js";

class EmailAccountsService {
  static setLogger(injectedLogger) {
    this.logger = injectedLogger;
  }

  /**
   * 📧 Récupère les comptes email d'un utilisateur avec pagination
   */
  static async getUserEmailAccounts(userId, filters = {}, options = {}) {
    try {
      this.validateObjectId(userId);

      const { active, provider, ...paginationParams } = filters;
      const { baseUrl } = options;

      // Validation des paramètres de pagination
      const validatedPagination =
        PaginationHelper.validatePaginationParams(paginationParams);

      let query = { userId };

      if (active !== undefined) {
        query.isActive = active;
      }

      if (provider) {
        query.provider = provider;
      }

      // Comptage total
      const total = await EmailAccount.countDocuments(query);

      // Exécution de la requête avec pagination
      const emailAccounts = await PaginationHelper.applyPaginationToQuery(
        EmailAccount.find(query).select("-accessToken -refreshToken"),
        validatedPagination
      );

      const accounts = emailAccounts.map((account) => account.secureInfo);

      // Construction de la réponse paginée
      const response = PaginationHelper.buildPaginatedResponse(
        accounts,
        total,
        validatedPagination,
        {
          baseUrl,
          queryParams: { active, provider },
        }
      );

      return {
        ...response,
        summary: {
          active: accounts.filter((acc) => acc.isActive).length,
          healthy: accounts.filter((acc) => acc.healthStatus === "healthy")
            .length,
          needsAttention: accounts.filter((acc) =>
            ["token_expired", "errors"].includes(acc.healthStatus)
          ).length,
        },
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error(
        "Erreur lors de la récupération des comptes email",
        error,
        {
          action: "get_user_email_accounts_failed",
          userId: userId?.toString(),
        }
      );

      throw new SystemError(
        "Erreur lors de la récupération des comptes email",
        error,
        { userId: userId?.toString() }
      );
    }
  }

  /**
   * ➕ Crée un nouveau compte email
   */
  static async createEmailAccount(userId, accountData) {
    try {
      this.validateObjectId(userId);

      const session = await mongoose.startSession();

      try {
        return await session.withTransaction(async () => {
          const emailAccount = new EmailAccount({
            userId,
            ...accountData,
          });

          await emailAccount.save({ session });

          // Add to user's connected accounts
          await User.findByIdAndUpdate(
            userId,
            { $push: { connectedEmailAccounts: emailAccount._id } },
            { session }
          );

          const user = await User.findById(userId).session(session);
          const userLanguage = I18nService.getUserLanguage(user);

          this.logger?.user(
            I18nService.getMessage("logs.emailAccountCreated", userLanguage),
            {
              email: emailAccount.email,
              provider: emailAccount.provider,
            },
            {
              userId: userId.toString(),
              action: "email_account_created",
            }
          );

          return {
            account: emailAccount.secureInfo,
            created: true,
            createdAt: new Date(),
          };
        });
      } finally {
        await session.endSession();
      }
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur lors de la création du compte email", error, {
        action: "create_email_account_failed",
        userId: userId?.toString(),
      });

      throw new SystemError(
        "Erreur lors de la création du compte email",
        error,
        { userId: userId?.toString() }
      );
    }
  }

  /**
   * 🔌 Déconnecte un compte email
   */
  static async disconnectEmailAccount(userId, accountId) {
    try {
      this.validateObjectId(userId);
      this.validateObjectId(accountId);

      const session = await mongoose.startSession();

      try {
        return await session.withTransaction(async () => {
          const emailAccount = await EmailAccount.findOne({
            _id: accountId,
            userId: userId,
          }).session(session);

          if (!emailAccount) {
            throw ErrorFactory.notFound(
              "Compte email introuvable",
              EMAIL_ACCOUNT_ERRORS.EMAIL_ACCOUNT_NOT_FOUND
            );
          }

          // Delete account
          await EmailAccount.findByIdAndDelete(accountId, { session });

          // Remove from user's list
          await User.findByIdAndUpdate(
            userId,
            { $pull: { connectedEmailAccounts: accountId } },
            { session }
          );

          const user = await User.findById(userId).session(session);
          const userLanguage = I18nService.getUserLanguage(user);

          this.logger?.user(
            I18nService.getMessage(
              "logs.emailAccountDisconnected",
              userLanguage
            ),
            {
              email: emailAccount.email,
              provider: emailAccount.provider,
            },
            {
              userId: userId.toString(),
              action: "email_account_disconnected",
            }
          );

          return {
            disconnectedAccount: {
              email: emailAccount.email,
              provider: emailAccount.provider,
            },
            disconnectedAt: new Date(),
          };
        });
      } finally {
        await session.endSession();
      }
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error(
        "Erreur lors de la déconnexion du compte email",
        error,
        {
          action: "disconnect_email_account_failed",
          userId: userId?.toString(),
          accountId: accountId?.toString(),
        }
      );

      throw new SystemError(
        "Erreur lors de la déconnexion du compte email",
        error,
        { userId: userId?.toString(), accountId: accountId?.toString() }
      );
    }
  }

  /**
   * 🏥 Vérification de santé d'un compte email
   */
  static async checkEmailAccountHealth(userId, accountId) {
    try {
      this.validateObjectId(userId);
      this.validateObjectId(accountId);

      const emailAccount = await EmailAccount.findOne({
        _id: accountId,
        userId: userId,
      });

      if (!emailAccount) {
        throw ErrorFactory.notFound(
          "Compte email introuvable",
          EMAIL_ACCOUNT_ERRORS.EMAIL_ACCOUNT_NOT_FOUND
        );
      }

      const user = await User.findById(userId);
      const userLanguage = I18nService.getUserLanguage(user);

      // Health diagnostics
      const health = {
        status: emailAccount.healthStatus,
        isActive: emailAccount.isActive,
        isTokenExpired: emailAccount.isTokenExpired(),
        errorCount: emailAccount.errorCount,
        lastError: emailAccount.lastError,
        lastUsed: emailAccount.lastUsed,
        recommendations: [],
      };

      // Generate recommendations
      if (health.isTokenExpired) {
        health.recommendations.push(
          I18nService.getMessage("health.tokenExpired", userLanguage)
        );
      }
      if (health.errorCount >= 5) {
        health.recommendations.push(
          I18nService.getMessage("health.tooManyErrors", userLanguage)
        );
      }
      if (
        TIME_HELPERS.isExpired(
          health.lastUsed,
          SECURITY_INTERVALS.LAST_USED_WARNING_THRESHOLD
        )
      ) {
        health.recommendations.push(
          I18nService.getMessage("health.notUsedRecently", userLanguage)
        );
      }

      return {
        account: {
          email: emailAccount.email,
          provider: emailAccount.provider,
        },
        health,
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur lors de la vérification de santé", error, {
        action: "check_email_account_health_failed",
        userId: userId?.toString(),
        accountId: accountId?.toString(),
      });

      throw new SystemError(
        "Erreur lors de la vérification de santé du compte email",
        error,
        { userId: userId?.toString(), accountId: accountId?.toString() }
      );
    }
  }



  /**
   * 📊 Récupère les informations détaillées d'un compte email
   */
  static async getDetailedEmailAccountInfo(userId, accountId) {
    try {
      this.validateObjectId(userId);
      this.validateObjectId(accountId);

      const emailAccount = await EmailAccount.findOne({
        _id: accountId,
        userId: userId,
      });

      if (!emailAccount) {
        throw ErrorFactory.notFound(
          "Compte email introuvable",
          EMAIL_ACCOUNT_ERRORS.EMAIL_ACCOUNT_NOT_FOUND
        );
      }

      return {
        account: emailAccount.detailedInfo,
        info: {
          createdAt: emailAccount.createdAt,
          lastUsed: emailAccount.lastUsed,
          errorCount: emailAccount.errorCount,
          lastError: emailAccount.lastError,
        },
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error(
        "Erreur lors de la récupération des infos détaillées",
        error,
        {
          action: "get_detailed_email_account_info_failed",
          userId: userId?.toString(),
          accountId: accountId?.toString(),
        }
      );

      throw new SystemError(
        "Erreur lors de la récupération des infos détaillées",
        error,
        { userId: userId?.toString(), accountId: accountId?.toString() }
      );
    }
  }

  /**
   * ⚙️ Met à jour les paramètres d'un compte email
   */
  static async updateEmailAccountSettings(userId, accountId, settings) {
    try {
      this.validateObjectId(userId);
      this.validateObjectId(accountId);

      const emailAccount = await EmailAccount.findOne({
        _id: accountId,
        userId: userId,
      });

      if (!emailAccount) {
        throw ErrorFactory.notFound(
          "Compte email introuvable",
          EMAIL_ACCOUNT_ERRORS.EMAIL_ACCOUNT_NOT_FOUND
        );
      }

      // Update settings
      Object.assign(emailAccount, settings);
      await emailAccount.save();

      const user = await User.findById(userId);
      const userLanguage = I18nService.getUserLanguage(user);

      this.logger?.user(
        I18nService.getMessage(
          "logs.emailAccountSettingsUpdated",
          userLanguage
        ),
        {
          email: emailAccount.email,
          updatedFields: Object.keys(settings),
        },
        {
          userId: userId.toString(),
          action: "email_account_settings_updated",
        }
      );

      return {
        account: emailAccount.secureInfo,
        updated: true,
        updatedAt: new Date(),
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error(
        "Erreur lors de la mise à jour des paramètres",
        error,
        {
          action: "update_email_account_settings_failed",
          userId: userId?.toString(),
          accountId: accountId?.toString(),
        }
      );

      throw new SystemError(
        "Erreur lors de la mise à jour des paramètres",
        error,
        { userId: userId?.toString(), accountId: accountId?.toString() }
      );
    }
  }

  /**
   * 🧹 Nettoyage des comptes email inactifs
   */
  static async cleanupInactiveEmailAccounts(userId) {
    try {
      this.validateObjectId(userId);

      const inactiveThreshold = new Date(
        Date.now() - SECURITY_INTERVALS.INACTIVE_ACCOUNT_THRESHOLD
      );

      const result = await EmailAccount.updateMany(
        {
          userId,
          $or: [
            { tokenExpiry: { $lt: inactiveThreshold } },
            { errorCount: { $gte: 10 } },
            { lastUsed: { $lt: inactiveThreshold } },
          ],
        },
        {
          $set: { isActive: false },
        }
      );

      if (result.modifiedCount > 0) {
        const user = await User.findById(userId);
        const userLanguage = I18nService.getUserLanguage(user);

        this.logger?.user(
          I18nService.getMessage("logs.accountsCleaned", userLanguage),
          {
            accountsDeactivated: result.modifiedCount,
          },
          {
            userId: userId.toString(),
            action: "email_accounts_cleanup",
          }
        );
      }

      return {
        accountsDeactivated: result.modifiedCount,
        cleanupDate: new Date(),
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur lors du nettoyage des comptes", error, {
        action: "cleanup_inactive_email_accounts_failed",
        userId: userId?.toString(),
      });

      throw new SystemError(
        "Erreur lors du nettoyage des comptes email inactifs",
        error,
        { userId: userId?.toString() }
      );
    }
  }

  /**
   * 🧹 Nettoyage manuel des comptes en échec
   */
  static async manualCleanupFailedAccounts(userId) {
    try {
      this.validateObjectId(userId);

      const result = await EmailAccount.updateMany(
        {
          userId,
          errorCount: { $gte: 5 },
        },
        {
          $set: { isActive: false },
        }
      );

      if (result.modifiedCount > 0) {
        const user = await User.findById(userId);
        const userLanguage = I18nService.getUserLanguage(user);

        this.logger?.user(
          I18nService.getMessage("logs.failedAccountsCleaned", userLanguage),
          {
            accountsDeactivated: result.modifiedCount,
          },
          {
            userId: userId.toString(),
            action: "manual_cleanup_failed_accounts",
          }
        );
      }

      return {
        accountsDeactivated: result.modifiedCount,
        cleanupDate: new Date(),
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur lors du nettoyage manuel des comptes", error, {
        action: "manual_cleanup_failed_accounts_failed",
        userId: userId?.toString(),
      });

      throw new SystemError(
        "Erreur lors du nettoyage manuel des comptes en échec",
        error,
        { userId: userId?.toString() }
      );
    }
  }

  // Helpers
  static validateObjectId(id, fieldName = "ID") {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ErrorFactory.badRequest(
        `${fieldName} invalide : ${id}`,
        "INVALID_OBJECT_ID"
      );
    }
  }
}

export default EmailAccountsService;
