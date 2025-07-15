// ============================================================================
// 📁 src/models/EmailAccount.js - Modèle Email Account avec support SMTP et compte par défaut
// ============================================================================

import mongoose from "mongoose";
import crypto from "crypto";
import config from "../config/env.js";

/**
 * 📧 Email Account Schema - Support OAuth + SMTP + Compte par défaut
 */
const emailAccountSchema = new mongoose.Schema(
  {
    // ============================================================================
    // 👤 INFORMATIONS UTILISATEUR
    // ============================================================================
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    displayName: {
      type: String,
      required: true,
      trim: true,
      maxLength: 100,
    },

    // ============================================================================
    // 🔌 INFORMATIONS PROVIDER
    // ============================================================================
    provider: {
      type: String,
      required: true,
      enum: ["gmail", "outlook", "yahoo", "smtp", "other"],
      index: true,
    },

    providerId: {
      type: String,
      required: false, // Peut être null pour SMTP
      index: true,
    },

    // ============================================================================
    // 🎯 GESTION COMPTE PAR DÉFAUT
    // ============================================================================
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ============================================================================
    // 🔐 TOKENS ET CREDENTIALS (CHIFFRÉS)
    // ============================================================================
    accessToken: {
      type: String,
      required: true, // Contient soit OAuth token soit credentials SMTP chiffrés
    },

    refreshToken: {
      type: String,
      required: false, // Null pour SMTP
    },

    tokenExpiry: {
      type: Date,
      required: false,
      index: true,
    },

    scopes: [
      {
        type: String,
      },
    ],

    // ============================================================================
    // ⚙️ CONFIGURATION ET PARAMÈTRES
    // ============================================================================
    settings: {
      // Type de connexion
      connectionType: {
        type: String,
        enum: ["oauth", "smtp"],
        default: "oauth",
      },

      // Paramètres SMTP (pour les comptes SMTP)
      smtpHost: String,
      smtpPort: Number,
      smtpSecure: Boolean,
      imapHost: String,
      imapPort: Number,
      imapSecure: Boolean,

      // Résultats des tests de connexion
      testResults: {
        smtp: {
          success: Boolean,
          message: String,
          testedAt: Date,
        },
        imap: {
          success: Boolean,
          message: String,
          testedAt: Date,
          skipped: Boolean,
        },
        testedAt: Date,
      },

      // Paramètres utilisateur
      defaultSignature: String,
      autoReply: Boolean,
      allowedAliases: [String],
    },

    // ============================================================================
    // 📊 STATUT ET SANTÉ
    // ============================================================================
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    // Gestion des erreurs
    errorCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastError: {
      message: String,
      code: String,
      timestamp: Date,
    },

    // ============================================================================
    // 📈 STATISTIQUES D'USAGE
    // ============================================================================
    emailsSent: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastUsed: {
      type: Date,
      default: Date.now,
    },

    lastSyncAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================================================
// 🔍 INDEX COMPOSÉS
// ============================================================================
emailAccountSchema.index({ userId: 1, email: 1 }, { unique: true });
emailAccountSchema.index({ userId: 1, provider: 1 });
emailAccountSchema.index({ userId: 1, isActive: 1 });
emailAccountSchema.index({ userId: 1, isDefault: 1 }); // 🆕 Pour compte par défaut
emailAccountSchema.index({ tokenExpiry: 1, isActive: 1 }); // Pour le refresh automatique
emailAccountSchema.index({ errorCount: 1, isActive: 1 }); // Pour le nettoyage

// ============================================================================
// 🔐 CHIFFREMENT DES TOKENS (PRE-SAVE MIDDLEWARE)
// ============================================================================
emailAccountSchema.pre("save", function (next) {
  try {
    // Chiffrer accessToken si modifié
    if (this.isModified("accessToken") && this.accessToken) {
      this.accessToken = this.encryptToken(this.accessToken);
    }

    // Chiffrer refreshToken si modifié
    if (this.isModified("refreshToken") && this.refreshToken) {
      this.refreshToken = this.encryptToken(this.refreshToken);
    }

    next();
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// 🎯 MIDDLEWARE GESTION COMPTE PAR DÉFAUT
// ============================================================================
// Middleware pour s'assurer qu'un seul compte par défaut par utilisateur
emailAccountSchema.pre("save", async function (next) {
  if (this.isModified("isDefault") && this.isDefault) {
    // Si ce compte devient le défaut, retirer le défaut des autres
    await this.constructor.updateMany(
      {
        userId: this.userId,
        _id: { $ne: this._id },
        isDefault: true,
      },
      { $set: { isDefault: false } }
    );
  }
  next();
});

// ============================================================================
// 🔐 MÉTHODES DE CHIFFREMENT/DÉCHIFFREMENT
// ============================================================================

/**
 * 🔒 Chiffrer un token
 */
emailAccountSchema.methods.encryptToken = function (token) {
  if (!token) return null;

  try {
    const algorithm = "aes-256-gcm";
    const key = Buffer.from(config.ENCRYPTION_KEY, "hex");
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipher(algorithm, key);
    cipher.setAAD(Buffer.from(this._id.toString()));

    let encrypted = cipher.update(token, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted;
  } catch (error) {
    throw new Error(`Erreur de chiffrement: ${error.message}`);
  }
};

/**
 * 🔓 Déchiffrer un token
 */
emailAccountSchema.methods.decryptToken = function (encryptedToken) {
  if (!encryptedToken) return null;

  try {
    const algorithm = "aes-256-gcm";
    const key = Buffer.from(config.ENCRYPTION_KEY, "hex");

    const parts = encryptedToken.split(":");
    if (parts.length !== 3) {
      throw new Error("Format de token chiffré invalide");
    }

    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encrypted = parts[2];

    const decipher = crypto.createDecipher(algorithm, key);
    decipher.setAAD(Buffer.from(this._id.toString()));
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    throw new Error(`Erreur de déchiffrement: ${error.message}`);
  }
};

// ============================================================================
// 📊 PROPRIÉTÉS VIRTUELLES
// ============================================================================

/**
 * 🏥 Statut de santé du compte
 */
emailAccountSchema.virtual("healthStatus").get(function () {
  if (!this.isActive) return "inactive";
  if (this.errorCount >= 10) return "critical";
  if (this.errorCount >= 5) return "errors";
  if (this.isTokenExpired()) return "token_expired";
  if (this.errorCount > 0) return "warning";
  return "healthy";
});

/**
 * 📋 Informations sécurisées (sans tokens)
 */
emailAccountSchema.virtual("secureInfo").get(function () {
  return {
    id: this._id,
    email: this.email,
    displayName: this.displayName,
    provider: this.provider,
    connectionType: this.settings?.connectionType || "oauth",
    isActive: this.isActive,
    isVerified: this.isVerified,
    isDefault: this.isDefault, // 🆕 Inclure le statut par défaut
    healthStatus: this.healthStatus,
    errorCount: this.errorCount,
    lastError: this.lastError,
    emailsSent: this.emailsSent,
    lastUsed: this.lastUsed,
    lastSyncAt: this.lastSyncAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    scopes: this.scopes,
    settings: {
      smtpHost: this.settings?.smtpHost,
      smtpPort: this.settings?.smtpPort,
      imapHost: this.settings?.imapHost,
      imapPort: this.settings?.imapPort,
      testResults: this.settings?.testResults,
      defaultSignature: this.settings?.defaultSignature,
      autoReply: this.settings?.autoReply,
    },
  };
});

// ============================================================================
// 🔧 MÉTHODES D'INSTANCE
// ============================================================================

/**
 * ⏰ Vérifier si le token est expiré
 */
emailAccountSchema.methods.isTokenExpired = function () {
  if (!this.tokenExpiry) return false;
  return new Date() > this.tokenExpiry;
};

/**
 * ⏰ Vérifier si le token expire bientôt (dans les X minutes)
 */
emailAccountSchema.methods.isTokenExpiringSoon = function (
  thresholdMinutes = 30
) {
  if (!this.tokenExpiry) return false;
  const threshold = new Date(Date.now() + thresholdMinutes * 60 * 1000);
  return this.tokenExpiry < threshold;
};

/**
 * 📊 Marquer comme utilisé
 */
emailAccountSchema.methods.markAsUsed = function () {
  this.lastUsed = new Date();
  return this.save();
};

/**
 * 📈 Incrémenter le compteur d'emails
 */
emailAccountSchema.methods.incrementEmailCount = function () {
  this.emailsSent += 1;
  this.lastUsed = new Date();
  return this.save();
};

/**
 * 🚨 Enregistrer une erreur
 */
emailAccountSchema.methods.recordError = function (error) {
  this.errorCount += 1;
  this.lastError = {
    message: error.message || "Erreur inconnue",
    code: error.code || "UNKNOWN_ERROR",
    timestamp: new Date(),
  };
  return this.save();
};

/**
 * ✅ Nettoyer les erreurs
 */
emailAccountSchema.methods.clearErrors = function () {
  this.errorCount = 0;
  this.lastError = undefined;
  return this.save();
};

/**
 * 🔄 Mettre à jour les tokens
 */
emailAccountSchema.methods.updateTokens = function (
  accessToken,
  refreshToken = null,
  expiresIn = null
) {
  this.accessToken = accessToken;

  if (refreshToken) {
    this.refreshToken = refreshToken;
  }

  if (expiresIn) {
    this.tokenExpiry = new Date(Date.now() + expiresIn * 1000);
  }

  return this.save();
};

/**
 * 🔄 Synchroniser les métadonnées
 */
emailAccountSchema.methods.syncMetadata = function (metadata = {}) {
  if (metadata.displayName) {
    this.displayName = metadata.displayName;
  }

  if (metadata.isVerified !== undefined) {
    this.isVerified = metadata.isVerified;
  }

  if (metadata.scopes) {
    this.scopes = metadata.scopes;
  }

  this.lastSyncAt = new Date();
  return this.save();
};

// ============================================================================
// 🔧 MÉTHODES STATIQUES
// ============================================================================

/**
 * 🔍 Trouver les comptes avec tokens expirés
 */
emailAccountSchema.statics.findExpiredTokens = function (
  thresholdMinutes = 30
) {
  const threshold = new Date(Date.now() + thresholdMinutes * 60 * 1000);
  return this.find({
    isActive: true,
    tokenExpiry: { $lt: threshold },
    refreshToken: { $exists: true, $ne: null },
  });
};

/**
 * 🧹 Trouver les comptes avec trop d'erreurs
 */
emailAccountSchema.statics.findFailedAccounts = function (maxErrors = 10) {
  return this.find({
    isActive: true,
    errorCount: { $gte: maxErrors },
  });
};

/**
 * 📊 Statistiques par provider
 */
emailAccountSchema.statics.getProviderStats = function (userId = null) {
  const match = userId ? { userId } : {};

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$provider",
        total: { $sum: 1 },
        active: { $sum: { $cond: ["$isActive", 1, 0] } },
        withErrors: { $sum: { $cond: [{ $gt: ["$errorCount", 0] }, 1, 0] } },
        totalEmailsSent: { $sum: "$emailsSent" },
      },
    },
  ]);
};

/**
 * 🔍 Rechercher par email et utilisateur
 */
emailAccountSchema.statics.findByEmailAndUser = function (email, userId) {
  return this.findOne({
    email: email.toLowerCase(),
    userId,
  });
};

// ============================================================================
// 🎯 MÉTHODES STATIQUES - GESTION COMPTE PAR DÉFAUT
// ============================================================================

/**
 * 🎯 Définir un compte comme par défaut
 */
emailAccountSchema.statics.setAsDefault = async function (accountId, userId) {
  // Vérifier que le compte existe et appartient à l'utilisateur
  const account = await this.findOne({
    _id: accountId,
    userId,
    isActive: true,
  });
  if (!account) {
    throw new Error("Compte introuvable ou inactif");
  }

  // Retirer le défaut de tous les autres comptes
  await this.updateMany(
    { userId, _id: { $ne: accountId } },
    { $set: { isDefault: false } }
  );

  // Définir ce compte comme défaut
  await this.findByIdAndUpdate(accountId, { $set: { isDefault: true } });

  return this.findById(accountId);
};

/**
 * 🎯 Obtenir le compte par défaut d'un utilisateur
 */
emailAccountSchema.statics.getDefaultAccount = function (userId) {
  return this.findOne({ userId, isDefault: true, isActive: true });
};

/**
 * 🎯 Obtenir le premier compte actif si pas de défaut
 */
emailAccountSchema.statics.getDefaultOrFirstActive = function (userId) {
  return this.findOne({ userId, isActive: true }).sort({
    isDefault: -1,
    lastUsed: -1,
  }); // Priorité: défaut, puis dernier utilisé
};

/**
 * 🎯 Obtenir tous les comptes avec statut par défaut
 */
emailAccountSchema.statics.getUserAccountsWithDefault = function (userId) {
  return this.find({ userId, isActive: true })
    .sort({ isDefault: -1, lastUsed: -1 })
    .select("-accessToken -refreshToken");
};

/**
 * 🎯 Vérifier si un utilisateur a un compte par défaut
 */
emailAccountSchema.statics.hasDefaultAccount = async function (userId) {
  const count = await this.countDocuments({
    userId,
    isDefault: true,
    isActive: true,
  });
  return count > 0;
};

/**
 * 🎯 Auto-définir le premier compte actif comme défaut si aucun défaut
 */
emailAccountSchema.statics.ensureDefaultAccount = async function (userId) {
  const hasDefault = await this.hasDefaultAccount(userId);

  if (!hasDefault) {
    const firstActive = await this.findOne({ userId, isActive: true }).sort({
      lastUsed: -1,
      createdAt: -1,
    });

    if (firstActive) {
      await this.setAsDefault(firstActive._id, userId);
      return firstActive;
    }
  }

  return this.getDefaultAccount(userId);
};

/**
 * 🎯 Retirer le statut par défaut de tous les comptes d'un utilisateur
 */
emailAccountSchema.statics.unsetAllDefaults = async function (userId) {
  return this.updateMany({ userId }, { $set: { isDefault: false } });
};

/**
 * 🧹 Nettoyage : s'assurer qu'il n'y a qu'un seul compte par défaut par utilisateur
 */
emailAccountSchema.statics.cleanupDuplicateDefaults = async function (
  userId = null
) {
  const match = userId ? { userId } : {};

  const duplicates = await this.aggregate([
    { $match: { ...match, isDefault: true } },
    {
      $group: {
        _id: "$userId",
        accounts: { $push: { id: "$_id", lastUsed: "$lastUsed" } },
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ]);

  for (const duplicate of duplicates) {
    // Garder le compte le plus récemment utilisé comme défaut
    const sortedAccounts = duplicate.accounts.sort(
      (a, b) => new Date(b.lastUsed || 0) - new Date(a.lastUsed || 0)
    );

    const toKeep = sortedAccounts[0].id;
    const toUpdate = sortedAccounts.slice(1).map((acc) => acc.id);

    if (toUpdate.length > 0) {
      await this.updateMany(
        { _id: { $in: toUpdate } },
        { $set: { isDefault: false } }
      );
    }
  }

  return duplicates.length;
};

// ============================================================================
// 🎯 EXPORTS
// ============================================================================
const EmailAccount = mongoose.model("EmailAccount", emailAccountSchema);

export default EmailAccount;
