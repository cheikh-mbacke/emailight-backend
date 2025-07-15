// ============================================================================
// 📁 src/services/smtpConnectionService.js - Service de connexion SMTP/IMAP
// ============================================================================

import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";
import EmailAccount from "../models/EmailAccount.js";
import User from "../models/User.js";
import { AuthError, SystemError, ConflictError } from "../utils/customError.js";
import { EMAIL_ACCOUNT_ERRORS } from "../utils/errorCodes.js";
import { VALIDATION_HELPERS } from "../constants/validationRules.js";

/**
 * 📧 SMTP/IMAP Connection Service
 */
class SmtpConnectionService {
  static logger = null;

  /**
   * ✅ Injection du logger
   */
  static setLogger(injectedLogger) {
    this.logger = injectedLogger;
  }

  /**
   * 🔧 Configuration des providers SMTP/IMAP courants
   */
  static getProviderConfig(provider) {
    const configs = {
      gmail: {
        smtp: {
          host: "smtp.gmail.com",
          port: 587,
          secure: false, // true pour 465, false pour autres ports
          requireTLS: true,
        },
        imap: {
          host: "imap.gmail.com",
          port: 993,
          secure: true,
        },
        authType: "oauth", // Gmail préfère OAuth
        displayName: "Gmail",
      },

      yahoo: {
        smtp: {
          host: "smtp.mail.yahoo.com",
          port: 587,
          secure: false,
          requireTLS: true,
        },
        imap: {
          host: "imap.mail.yahoo.com",
          port: 993,
          secure: true,
        },
        authType: "password",
        displayName: "Yahoo Mail",
      },
      emailight: {
        smtp: {
          host: "mail.emailight.com",
          port: 465,
          secure: true,
          requireTLS: false,
        },
        imap: {
          host: "mail.emailight.com",
          port: 993,
          secure: true,
        },
        pop3: {
          host: "mail.emailight.com",
          port: 995,
          secure: true,
        },
        authType: "password",
        displayName: "Emailight",
      },
      other: {
        smtp: {
          host: null, // À configurer par l'utilisateur
          port: 587,
          secure: false,
          requireTLS: true,
        },
        imap: {
          host: null,
          port: 993,
          secure: true,
        },
        authType: "password",
        displayName: "Serveur personnalisé",
      },
    };

    return configs[provider] || configs.other;
  }

  /**
   * 🧪 Tester la connexion SMTP
   */
  static async testSmtpConnection(smtpConfig) {
    try {
      this.logger?.info("Test de connexion SMTP en cours", {
        host: smtpConfig.smtp.host,
        port: smtpConfig.smtp.port,
        email: smtpConfig.email,
      });

      // Créer le transporteur nodemailer
      const transporter = nodemailer.createTransporter({
        host: smtpConfig.smtp.host,
        port: smtpConfig.smtp.port,
        secure: smtpConfig.smtp.secure || false,
        requireTLS: smtpConfig.smtp.requireTLS !== false,
        auth: {
          user: smtpConfig.username,
          pass: smtpConfig.password,
        },
        connectionTimeout: 10000, // 10 secondes
        greetingTimeout: 5000, // 5 secondes
        socketTimeout: 10000, // 10 secondes
      });

      // Vérifier la connexion
      await transporter.verify();

      this.logger?.success("Test SMTP réussi", {
        host: smtpConfig.smtp.host,
        email: smtpConfig.email,
      });

      return {
        success: true,
        message: "Connexion SMTP établie avec succès",
        testedAt: new Date(),
      };
    } catch (error) {
      this.logger?.error("Échec du test SMTP", error, {
        host: smtpConfig.smtp?.host,
        port: smtpConfig.smtp?.port,
        email: smtpConfig.email,
      });

      throw new AuthError(
        `Échec de la connexion SMTP: ${error.message}`,
        "SMTP_CONNECTION_FAILED",
        {
          host: smtpConfig.smtp?.host,
          port: smtpConfig.smtp?.port,
          details: error.message,
        }
      );
    }
  }

  /**
   * 🧪 Tester la connexion IMAP (optionnel)
   */
  static async testImapConnection(smtpConfig) {
    try {
      if (!smtpConfig.imap || !smtpConfig.imap.host) {
        return {
          success: true,
          message: "IMAP non configuré - test ignoré",
          skipped: true,
        };
      }

      this.logger?.info("Test de connexion IMAP en cours", {
        host: smtpConfig.imap.host,
        port: smtpConfig.imap.port,
        email: smtpConfig.email,
      });

      const client = new ImapFlow({
        host: smtpConfig.imap.host,
        port: smtpConfig.imap.port,
        secure: smtpConfig.imap.secure !== false,
        auth: {
          user: smtpConfig.username,
          pass: smtpConfig.password,
        },
        logger: false, // Désactiver les logs IMAP détaillés
      });

      // Se connecter et se déconnecter immédiatement
      await client.connect();
      await client.logout();

      this.logger?.success("Test IMAP réussi", {
        host: smtpConfig.imap.host,
        email: smtpConfig.email,
      });

      return {
        success: true,
        message: "Connexion IMAP établie avec succès",
        testedAt: new Date(),
      };
    } catch (error) {
      this.logger?.warn("Échec du test IMAP", error, {
        host: smtpConfig.imap?.host,
        port: smtpConfig.imap?.port,
        email: smtpConfig.email,
      });

      // IMAP est optionnel, donc on warning au lieu d'erreur fatale
      return {
        success: false,
        message: `Connexion IMAP échouée: ${error.message}`,
        error: error.message,
        testedAt: new Date(),
      };
    }
  }

  /**
   * 💾 Sauvegarder le compte SMTP en base de données
   */
  static async saveSmtpAccount(userId, smtpConfig, testResults) {
    try {
      // Vérifier si ce compte existe déjà
      const existingAccount = await EmailAccount.findOne({
        userId,
        email: smtpConfig.email.toLowerCase(),
      });

      if (existingAccount) {
        throw new ConflictError(
          "Ce compte email est déjà connecté",
          EMAIL_ACCOUNT_ERRORS.EMAIL_ACCOUNT_ALREADY_EXISTS
        );
      }

      // Déterminer le provider basé sur le domaine email
      const emailDomain = smtpConfig.email.split("@")[1].toLowerCase();
      let provider = "other";
      let displayName = smtpConfig.displayName || smtpConfig.email;

      if (emailDomain.includes("gmail.com")) {
        provider = "gmail";
        displayName = displayName || "Gmail (SMTP)";
      } else if (emailDomain.includes("yahoo.")) {
        provider = "yahoo";
        displayName = displayName || "Yahoo (SMTP)";
      }

      // Préparer les credentials chiffrés
      const credentials = {
        username: smtpConfig.username,
        password: smtpConfig.password,
        smtp: smtpConfig.smtp,
        imap: smtpConfig.imap || null,
      };

      // Créer le compte email
      const emailAccount = new EmailAccount({
        userId,
        email: smtpConfig.email.toLowerCase(),
        displayName,
        provider,
        providerId: `smtp_${smtpConfig.email.toLowerCase()}`,

        // Utiliser les champs existants pour stocker les credentials SMTP
        accessToken: JSON.stringify(credentials), // Sera chiffré automatiquement
        refreshToken: null, // Pas de refresh token pour SMTP
        tokenExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an par défaut

        scopes: ["smtp"], // Scope personnalisé pour SMTP
        isActive: true,
        isVerified: testResults.smtp.success,

        // Stocker les détails de configuration dans settings
        settings: {
          connectionType: "smtp",
          smtpHost: smtpConfig.smtp.host,
          smtpPort: smtpConfig.smtp.port,
          smtpSecure: smtpConfig.smtp.secure,
          imapHost: smtpConfig.imap?.host || null,
          imapPort: smtpConfig.imap?.port || null,
          imapSecure: smtpConfig.imap?.secure || null,
          testResults: {
            smtp: testResults.smtp,
            imap: testResults.imap,
            testedAt: new Date(),
          },
        },
      });

      await emailAccount.save();

      // Ajouter à la liste de l'utilisateur
      await User.findByIdAndUpdate(userId, {
        $addToSet: { connectedEmailAccounts: emailAccount._id },
      });

      this.logger?.user(
        "Compte SMTP connecté avec succès",
        {
          email: smtpConfig.email,
          provider,
          smtpHost: smtpConfig.smtp.host,
          imapConfigured: !!smtpConfig.imap,
        },
        {
          userId: userId.toString(),
          email: smtpConfig.email,
          action: "smtp_account_connected",
        }
      );

      return {
        account: emailAccount.secureInfo,
        connected: true,
        connectedAt: new Date(),
        testResults,
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur sauvegarde compte SMTP", error, {
        action: "smtp_account_save_failed",
        userId: userId?.toString(),
        email: smtpConfig?.email,
      });

      throw new SystemError(
        "Erreur lors de la sauvegarde du compte SMTP",
        error
      );
    }
  }

  /**
   * 🔧 Configurer et tester un compte SMTP/IMAP complet
   * ✅ CORRIGÉ: Validation déléguée au middleware Joi
   */
  static async configureSmtpAccount(userId, smtpConfig) {
    try {
      // ✅ FIX: Validation déjà effectuée par le middleware Joi
      // smtpConfig est déjà validé par le schéma smtpConfig

      // 2. Auto-complétion avec la config du provider si applicable
      const emailDomain = smtpConfig.email.split("@")[1].toLowerCase();
      let autoConfig = null;

      if (emailDomain.includes("gmail.com")) {
        autoConfig = this.getProviderConfig("gmail");
      } else if (emailDomain.includes("emailight.com")) {
        autoConfig = this.getProviderConfig("emailight");
      } else if (emailDomain.includes("yahoo.")) {
        autoConfig = this.getProviderConfig("yahoo");
      }

      // Fusionner avec la config auto si disponible
      if (autoConfig && !smtpConfig.smtp.host) {
        smtpConfig.smtp = { ...autoConfig.smtp, ...smtpConfig.smtp };
        if (!smtpConfig.imap && autoConfig.imap) {
          smtpConfig.imap = { ...autoConfig.imap };
        }
      }

      // 3. Tests de connexion
      this.logger?.info("Configuration compte SMTP en cours", {
        email: smtpConfig.email,
        smtpHost: smtpConfig.smtp.host,
        imapConfigured: !!smtpConfig.imap,
      });

      const smtpTest = await this.testSmtpConnection(smtpConfig);
      const imapTest = await this.testImapConnection(smtpConfig);

      const testResults = {
        smtp: smtpTest,
        imap: imapTest,
        overallSuccess:
          smtpTest.success && (imapTest.skipped || imapTest.success),
      };

      // 4. Sauvegarder si les tests sont OK
      if (!testResults.overallSuccess) {
        throw new AuthError(
          "Tests de connexion échoués",
          "SMTP_CONNECTION_TESTS_FAILED",
          { testResults }
        );
      }

      const result = await this.saveSmtpAccount(
        userId,
        smtpConfig,
        testResults
      );

      return result;
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur configuration compte SMTP", error, {
        action: "smtp_account_configuration_failed",
        userId: userId?.toString(),
        email: smtpConfig?.email,
      });

      throw new SystemError(
        "Erreur lors de la configuration du compte SMTP",
        error
      );
    }
  }

  /**
   * 🧪 Tester une connexion SMTP existante
   */
  static async testExistingSmtpAccount(emailAccount) {
    try {
      if (!emailAccount.accessToken) {
        throw new AuthError(
          "Credentials SMTP manquants",
          "SMTP_CREDENTIALS_MISSING"
        );
      }

      // Déchiffrer et parser les credentials
      const credentialsJson = emailAccount.decryptToken(
        emailAccount.accessToken
      );
      const credentials = JSON.parse(credentialsJson);

      // Reconstituer la config SMTP
      const smtpConfig = {
        email: emailAccount.email,
        username: credentials.username,
        password: credentials.password,
        smtp: credentials.smtp,
        imap: credentials.imap,
      };

      // Tester les connexions
      const smtpTest = await this.testSmtpConnection(smtpConfig);
      const imapTest = await this.testImapConnection(smtpConfig);

      // Mettre à jour les résultats de test dans les settings
      emailAccount.settings.testResults = {
        smtp: smtpTest,
        imap: imapTest,
        testedAt: new Date(),
      };

      if (smtpTest.success) {
        await emailAccount.clearErrors();
      } else {
        await emailAccount.recordError(new Error("Test SMTP échoué"));
      }

      await emailAccount.save();

      return {
        connectionTest: true,
        status: smtpTest.success ? "healthy" : "failed",
        email: emailAccount.email,
        smtp: smtpTest,
        imap: imapTest,
        lastTested: new Date(),
      };
    } catch (error) {
      await emailAccount.recordError(error);

      if (error.isOperational) {
        throw error;
      }

      this.logger?.error("Erreur test connexion SMTP existante", error, {
        action: "existing_smtp_test_failed",
        accountId: emailAccount._id?.toString(),
        email: emailAccount.email,
      });

      throw new SystemError("Erreur lors du test de connexion SMTP", error);
    }
  }

  /**
   * 📊 Obtenir la configuration d'un provider
   */
  static getProviderConfigurations() {
    return {
      gmail: this.getProviderConfig("gmail"),
      emailight: this.getProviderConfig("emailight"),
      yahoo: this.getProviderConfig("yahoo"),
      other: this.getProviderConfig("other"),
    };
  }

  /**
   * 🔍 Détecter automatiquement la configuration basée sur l'email
   */
  static detectProviderFromEmail(email) {
    const domain = email.split("@")[1]?.toLowerCase();

    if (!domain) return null;

    if (domain.includes("gmail.com")) {
      return { provider: "gmail", config: this.getProviderConfig("gmail") };
    }

    if (domain.includes("emailight.com")) {
      return {
        provider: "emailight",
        config: this.getProviderConfig("emailight"),
      };
    }

    if (domain.includes("yahoo.")) {
      return { provider: "yahoo", config: this.getProviderConfig("yahoo") };
    }

    return { provider: "other", config: this.getProviderConfig("other") };
  }
}

export default SmtpConnectionService;
