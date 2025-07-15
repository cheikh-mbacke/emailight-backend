// ============================================================================
// 📁 src/controllers/smtpController.js - Controller SMTP/IMAP COMPLET
// ============================================================================

import SmtpConnectionService from "../services/smtpConnectionService.js";
import EmailAccount from "../models/EmailAccount.js";

/**
 * 📧 SMTP Controller
 */
class SmtpController {
  static logger = null;

  /**
   * ✅ Injection du logger
   */
  static setLogger(injectedLogger) {
    this.logger = injectedLogger;
    // Injecter aussi dans le service SMTP
    SmtpConnectionService.setLogger(injectedLogger);
  }

  /**
   * 📧 Configurer un compte SMTP
   */
  static async configureSmtpAccount(request, reply) {
    try {
      const userId = request.user._id;
      const smtpConfig = request.body;

      // Ajouter les recommandations de sécurité si disponibles
      if (request.smtpSecurityRecommendations) {
        smtpConfig._securityRecommendations =
          request.smtpSecurityRecommendations;
      }

      const result = await SmtpConnectionService.configureSmtpAccount(
        userId,
        smtpConfig
      );

      this.logger?.user(
        "Compte SMTP configuré avec succès",
        {
          email: smtpConfig.email,
          provider: result.account.provider,
          smtpHost: smtpConfig.smtp.host,
          hasImap: !!smtpConfig.imap,
          testResults: result.testResults.overallSuccess,
        },
        {
          userId: userId.toString(),
          email: smtpConfig.email,
          action: "smtp_account_configured",
        }
      );

      return reply
        .code(201)
        .success(result, "Compte SMTP configuré avec succès");
    } catch (error) {
      // 🎯 Erreurs métier (4xx) : gestion locale
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "SMTP_ACCOUNT_CREATION_ERROR",
          details: error.details || null,
        });
      }

      // 🚨 Erreurs système (5xx) : laisser remonter au gestionnaire centralisé
      throw error;
    }
  }

  /**
   * 🧪 Tester une configuration SMTP
   */
  static async testSmtpConnection(request, reply) {
    try {
      const smtpConfig = request.body;

      // Validation
      const validation = SmtpConnectionService.validateSmtpConfig(smtpConfig);
      if (!validation.isValid) {
        return reply.code(400).send({
          error: "Configuration SMTP invalide",
          details: validation.errors,
          code: "INVALID_SMTP_CONFIG",
        });
      }

      // Tests de connexion
      const smtpTest =
        await SmtpConnectionService.testSmtpConnection(smtpConfig);
      const imapTest =
        await SmtpConnectionService.testImapConnection(smtpConfig);

      const result = {
        smtp: smtpTest,
        imap: imapTest,
        overallSuccess:
          smtpTest.success && (imapTest.skipped || imapTest.success),
        recommendations: [],
        warnings: request.smtpWarnings || [],
      };

      // Ajouter des recommandations
      if (!smtpTest.success) {
        result.recommendations.push(
          "Vérifiez vos credentials SMTP et les paramètres du serveur"
        );
      }
      if (imapTest.success === false) {
        result.recommendations.push(
          "IMAP échoué - vérifiez la configuration ou désactivez IMAP"
        );
      }
      if (request.smtpWarnings?.length > 0) {
        result.recommendations.push(
          "Consultez les avertissements pour optimiser la configuration"
        );
      }

      this.logger?.info(
        "Test de connexion SMTP effectué",
        {
          email: smtpConfig.email,
          smtpSuccess: smtpTest.success,
          imapSuccess: imapTest.success || imapTest.skipped,
          overallSuccess: result.overallSuccess,
          warningsCount: result.warnings.length,
        },
        {
          userId: request.user._id.toString(),
          action: "smtp_connection_tested",
        }
      );

      const message = result.overallSuccess
        ? "Tests de connexion réussis"
        : "Certains tests ont échoué";

      return reply.success(result, message);
    } catch (error) {
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "SMTP_TEST_ERROR",
          details: error.details || null,
        });
      }
      throw error;
    }
  }

  /**
   * 🔧 Obtenir les configurations des providers
   */
  static async getProviderConfigurations(request, reply) {
    try {
      const providers = SmtpConnectionService.getProviderConfigurations();

      // Ajouter des informations utiles
      const enrichedProviders = {};

      Object.keys(providers).forEach((providerKey) => {
        const provider = providers[providerKey];
        enrichedProviders[providerKey] = {
          ...provider,
          description: this.getProviderDescription(providerKey),
          setupInstructions: this.getProviderInstructions(providerKey),
          securityNotes: this.getProviderSecurityNotes(providerKey),
        };
      });

      this.logger?.debug(
        "Configurations SMTP providers récupérées",
        {
          providersCount: Object.keys(enrichedProviders).length,
          providers: Object.keys(enrichedProviders),
        },
        {
          userId: request.user._id.toString(),
          action: "smtp_providers_retrieved",
        }
      );

      return reply.success(
        { providers: enrichedProviders },
        "Configurations SMTP/IMAP récupérées"
      );
    } catch (error) {
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "GET_SMTP_PROVIDERS_ERROR",
        });
      }
      throw error;
    }
  }

  /**
   * 🔧 Mettre à jour un compte SMTP existant
   */
  static async updateSmtpAccount(request, reply) {
    try {
      const userId = request.user._id;
      const { accountId } = request.params;
      const updates = request.body;

      // Vérifier que le compte existe et appartient à l'utilisateur
      const emailAccount = await EmailAccount.findOne({
        _id: accountId,
        userId: userId,
        provider: { $in: ["smtp", "gmail", "outlook", "yahoo", "other"] },
      });

      if (!emailAccount) {
        return reply.code(404).send({
          error: "Compte SMTP introuvable",
          message: "Ce compte SMTP n'existe pas ou ne vous appartient pas",
          code: "SMTP_ACCOUNT_NOT_FOUND",
        });
      }

      // Décrypter et parser les credentials actuels
      let currentCredentials = {};
      try {
        const credentialsJson = emailAccount.decryptToken(
          emailAccount.accessToken
        );
        currentCredentials = JSON.parse(credentialsJson);
      } catch (error) {
        return reply.code(500).send({
          error: "Erreur de déchiffrement",
          message: "Impossible de lire les credentials SMTP actuels",
          code: "SMTP_DECRYPT_ERROR",
        });
      }

      // Construire la nouvelle configuration
      const newConfig = {
        email: emailAccount.email,
        username: updates.username || currentCredentials.username,
        password: updates.password || currentCredentials.password,
        displayName: updates.displayName || emailAccount.displayName,
        smtp: {
          ...currentCredentials.smtp,
          ...updates.smtp,
        },
        imap: updates.imap
          ? {
              ...currentCredentials.imap,
              ...updates.imap,
            }
          : currentCredentials.imap,
      };

      // Valider la nouvelle configuration
      const validation = SmtpConnectionService.validateSmtpConfig(newConfig);
      if (!validation.isValid) {
        return reply.code(400).send({
          error: "Configuration SMTP mise à jour invalide",
          details: validation.errors,
          code: "INVALID_SMTP_UPDATE",
        });
      }

      // Tester la nouvelle configuration
      const smtpTest =
        await SmtpConnectionService.testSmtpConnection(newConfig);
      const imapTest =
        await SmtpConnectionService.testImapConnection(newConfig);

      const testResults = {
        smtp: smtpTest,
        imap: imapTest,
        overallSuccess:
          smtpTest.success && (imapTest.skipped || imapTest.success),
      };

      if (!testResults.overallSuccess) {
        return reply.code(400).send({
          error: "Tests de connexion échoués",
          message: "La nouvelle configuration SMTP ne fonctionne pas",
          testResults,
          code: "SMTP_UPDATE_TEST_FAILED",
        });
      }

      // Mettre à jour le compte en base
      const newCredentials = {
        username: newConfig.username,
        password: newConfig.password,
        smtp: newConfig.smtp,
        imap: newConfig.imap,
      };

      await EmailAccount.findByIdAndUpdate(accountId, {
        $set: {
          displayName: newConfig.displayName,
          accessToken: JSON.stringify(newCredentials), // Sera chiffré automatiquement
          "settings.testResults": {
            smtp: smtpTest,
            imap: imapTest,
            testedAt: new Date(),
          },
        },
      });

      // Récupérer le compte mis à jour
      const updatedAccount = await EmailAccount.findById(accountId);

      this.logger?.user(
        "Compte SMTP mis à jour",
        {
          accountId: accountId.toString(),
          email: emailAccount.email,
          updatedFields: Object.keys(updates),
          testSuccess: testResults.overallSuccess,
        },
        {
          userId: userId.toString(),
          email: emailAccount.email,
          action: "smtp_account_updated",
        }
      );

      return reply.success(
        {
          account: updatedAccount.secureInfo,
          testResults,
          updatedFields: Object.keys(updates),
          updatedAt: new Date(),
        },
        "Compte SMTP mis à jour avec succès"
      );
    } catch (error) {
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "SMTP_UPDATE_ERROR",
          details: error.details || null,
        });
      }
      throw error;
    }
  }

  /**
   * 🧪 Tester un compte SMTP existant
   */
  static async testExistingSmtpAccount(request, reply) {
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

      // Vérifier que c'est un compte SMTP
      if (
        !emailAccount.accessToken ||
        !emailAccount.settings?.connectionType === "smtp"
      ) {
        return reply.code(400).send({
          error: "Compte non SMTP",
          message: "Ce compte n'est pas configuré en SMTP",
          code: "NOT_SMTP_ACCOUNT",
        });
      }

      // Tester la connexion via le service
      const result =
        await SmtpConnectionService.testExistingSmtpAccount(emailAccount);

      this.logger?.user(
        "Test connexion SMTP existant",
        {
          accountId: accountId.toString(),
          email: emailAccount.email,
          testStatus: result.status,
          smtpSuccess: result.smtp?.success,
          imapSuccess: result.imap?.success || result.imap?.skipped,
        },
        {
          userId: userId.toString(),
          email: emailAccount.email,
          action: "existing_smtp_account_tested",
        }
      );

      return reply.success(result, "Test de connexion SMTP effectué");
    } catch (error) {
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "SMTP_TEST_EXISTING_ERROR",
          details: error.details || null,
        });
      }
      throw error;
    }
  }

  /**
   * 🔍 Obtenir la description d'un provider
   */
  static getProviderDescription(providerKey) {
    const descriptions = {
      gmail:
        "Gmail - Service email de Google avec authentification OAuth2 recommandée",
      outlook:
        "Outlook - Service email de Microsoft avec support OAuth2 et SMTP",
      yahoo:
        "Yahoo Mail - Service email avec support SMTP et mots de passe d'application",
      other:
        "Serveur personnalisé - Configuration manuelle pour tout autre provider SMTP",
    };
    return descriptions[providerKey] || "Provider SMTP personnalisé";
  }

  /**
   * 📋 Obtenir les instructions de configuration d'un provider
   */
  static getProviderInstructions(providerKey) {
    const instructions = {
      gmail: [
        "1. Activez l'authentification à deux facteurs sur votre compte Google",
        "2. Générez un mot de passe d'application dans les paramètres de sécurité",
        "3. Utilisez votre adresse Gmail complète comme nom d'utilisateur",
        "4. Utilisez le mot de passe d'application généré",
      ],
      outlook: [
        "1. Activez l'authentification à deux facteurs sur votre compte Microsoft",
        "2. Activez l'accès SMTP dans les paramètres Outlook",
        "3. Utilisez votre adresse email complète comme nom d'utilisateur",
        "4. Utilisez votre mot de passe habituel ou un mot de passe d'application",
      ],
      yahoo: [
        "1. Activez l'authentification à deux facteurs",
        "2. Générez un mot de passe d'application dans les paramètres de sécurité",
        "3. Utilisez votre adresse Yahoo complète comme nom d'utilisateur",
        "4. Utilisez le mot de passe d'application généré (16 caractères)",
      ],
      other: [
        "1. Contactez votre provider pour obtenir les paramètres SMTP",
        "2. Vérifiez si SSL/TLS est requis",
        "3. Confirmez le port à utiliser (587, 465, ou 25)",
        "4. Testez la configuration avant de sauvegarder",
      ],
    };
    return instructions[providerKey] || [];
  }

  /**
   * 🔒 Obtenir les notes de sécurité d'un provider
   */
  static getProviderSecurityNotes(providerKey) {
    const securityNotes = {
      gmail: [
        "⚠️ N'utilisez jamais votre mot de passe principal",
        "✅ Utilisez toujours un mot de passe d'application",
        "🔒 Port 587 avec STARTTLS recommandé",
      ],
      outlook: [
        "⚠️ Activez l'authentification moderne si disponible",
        "✅ Utilisez l'authentification à deux facteurs",
        "🔒 Port 587 avec STARTTLS recommandé",
      ],
      yahoo: [
        "⚠️ Les mots de passe d'application sont obligatoires",
        "✅ Vérifiez que l'accès SMTP est activé",
        "🔒 Port 587 ou 465 recommandé",
      ],
      other: [
        "⚠️ Vérifiez la réputation du serveur SMTP",
        "✅ Utilisez toujours une connexion chiffrée",
        "🔒 Évitez le port 25 (souvent bloqué)",
      ],
    };
    return securityNotes[providerKey] || [];
  }

  /**
   * 🔍 Détecter automatiquement la configuration basée sur l'email
   */
  static async detectProviderFromEmail(request, reply) {
    try {
      const { email } = request.query;

      if (!email) {
        return reply.code(400).send({
          error: "Email requis",
          message: "L'adresse email est nécessaire pour la détection",
          code: "EMAIL_REQUIRED_FOR_DETECTION",
        });
      }

      const detection = SmtpConnectionService.detectProviderFromEmail(email);

      this.logger?.debug(
        "Détection automatique provider SMTP",
        {
          email,
          detectedProvider: detection?.provider,
          hasConfig: !!detection?.config,
        },
        {
          userId: request.user._id.toString(),
          action: "smtp_provider_detected",
        }
      );

      return reply.success(
        {
          email,
          detection: detection || {
            provider: "other",
            config: SmtpConnectionService.getProviderConfig("other"),
            message: "Provider non reconnu, configuration manuelle requise",
          },
          recommendations: this.getProviderInstructions(
            detection?.provider || "other"
          ),
        },
        "Détection de provider effectuée"
      );
    } catch (error) {
      if (error.statusCode && error.statusCode < 500 && error.isOperational) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code || "PROVIDER_DETECTION_ERROR",
        });
      }
      throw error;
    }
  }
}

export default SmtpController;
