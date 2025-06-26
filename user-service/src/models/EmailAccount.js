const mongoose = require("mongoose");
const crypto = require("crypto");

/**
 * Schema for email accounts connected via OAuth
 */
const emailAccountSchema = new mongoose.Schema(
  {
    // 👤 Owner of the account
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },

    // 📧 Email account details
    email: {
      type: String,
      required: [true, "Account email is required"],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Invalid email format",
      ],
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: [100, "Display name cannot exceed 100 characters"],
    },

    // 🔐 OAuth provider
    provider: {
      type: String,
      required: [true, "Provider is required"],
      enum: ["gmail", "outlook", "yahoo", "other"],
      default: "gmail",
    },
    providerId: {
      type: String,
      required: [true, "Provider ID is required"],
    },

    // 🔑 OAuth tokens (encrypted)
    accessToken: {
      type: String,
      required: [true, "Access token is required"],
      select: false,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    tokenExpiry: {
      type: Date,
      required: [true, "Token expiry date is required"],
    },

    // 📊 OAuth scope info
    scopes: [
      {
        type: String,
        enum: [
          "https://www.googleapis.com/auth/gmail.send",
          "https://www.googleapis.com/auth/gmail.readonly",
          "https://www.googleapis.com/auth/gmail.modify",
          "https://mail.google.com/",
          "profile",
          "email",
        ],
      },
    ],

    // ✅ Account status
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    // 📈 Usage metrics
    emailsSent: {
      type: Number,
      default: 0,
    },
    lastUsed: {
      type: Date,
      default: Date.now,
    },
    lastSyncAt: Date,

    // 🚫 Errors and issues
    lastError: {
      message: String,
      code: String,
      occurredAt: Date,
    },
    errorCount: {
      type: Number,
      default: 0,
    },

    // ⚙️ Custom settings
    settings: {
      // Default email signature
      defaultSignature: {
        type: String,
        maxlength: [500, "Signature cannot exceed 500 characters"],
      },

      // Auto-reply settings
      autoReply: {
        enabled: { type: Boolean, default: false },
        message: String,
      },

      // Allowed sender aliases
      allowedAliases: [String],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.accessToken;
        delete ret.refreshToken;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

/**
 * 📍 Composite indexes for performance
 */
emailAccountSchema.index({ userId: 1, email: 1 }, { unique: true });
emailAccountSchema.index({ userId: 1, isActive: 1 });
emailAccountSchema.index({ provider: 1 });
emailAccountSchema.index({ tokenExpiry: 1 });
emailAccountSchema.index({ lastUsed: -1 });

/**
 * 🔐 Encryption key (should be stored in env vars)
 */
const ENCRYPTION_KEY =
  process.env.TOKEN_ENCRYPTION_KEY || "your-32-character-secret-key-here";
const ALGORITHM = "aes-256-gcm";

/**
 * 🔒 Method: Encrypt a token
 */
emailAccountSchema.methods.encryptToken = function (token) {
  if (!token) return null;

  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);

    let encrypted = cipher.update(token, "utf8", "hex");
    encrypted += cipher.final("hex");

    return iv.toString("hex") + ":" + encrypted;
  } catch (error) {
    throw new Error("Error while encrypting token");
  }
};

/**
 * 🔓 Method: Decrypt a token
 */
emailAccountSchema.methods.decryptToken = function (encryptedToken) {
  if (!encryptedToken) return null;

  try {
    const parts = encryptedToken.split(":");
    if (parts.length !== 2) {
      throw new Error("Invalid encrypted token format");
    }

    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];

    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    throw new Error("Error while decrypting token");
  }
};

/**
 * ⏰ Method: Check if the token has expired
 */
emailAccountSchema.methods.isTokenExpired = function () {
  return new Date() >= this.tokenExpiry;
};

/**
 * ✅ Method: Mark account as used
 */
emailAccountSchema.methods.markAsUsed = async function () {
  this.lastUsed = new Date();
  this.emailsSent += 1;
  return this.save();
};

/**
 * 🚫 Method: Log an error
 */
emailAccountSchema.methods.recordError = async function (error) {
  this.lastError = {
    message: error.message,
    code: error.code || "UNKNOWN",
    occurredAt: new Date(),
  };
  this.errorCount += 1;

  // Disable account after 10 consecutive errors
  if (this.errorCount >= 10) {
    this.isActive = false;
  }

  return this.save();
};

/**
 * 🔄 Method: Clear errors after successful use
 */
emailAccountSchema.methods.clearErrors = async function () {
  this.errorCount = 0;
  this.lastError = undefined;
  this.isActive = true;
  return this.save();
};

/**
 * 🎯 Virtual: Account health status
 */
emailAccountSchema.virtual("healthStatus").get(function () {
  if (!this.isActive) return "inactive";
  if (this.isTokenExpired()) return "token_expired";
  if (this.errorCount >= 5) return "errors";
  if (
    !this.lastUsed ||
    Date.now() - this.lastUsed.getTime() > 30 * 24 * 60 * 60 * 1000
  ) {
    return "stale"; // Not used in over 30 days
  }
  return "healthy";
});

/**
 * 📊 Virtual: Security info (tokens excluded)
 */
emailAccountSchema.virtual("secureInfo").get(function () {
  return {
    id: this._id,
    email: this.email,
    displayName: this.displayName,
    provider: this.provider,
    isActive: this.isActive,
    isVerified: this.isVerified,
    healthStatus: this.healthStatus,
    emailsSent: this.emailsSent,
    lastUsed: this.lastUsed,
    tokenExpiry: this.tokenExpiry,
    scopes: this.scopes,
    errorCount: this.errorCount,
  };
});

/**
 * 🔍 Static method: Find accounts by user
 */
emailAccountSchema.statics.findByUser = function (userId, activeOnly = true) {
  const query = { userId };
  if (activeOnly) {
    query.isActive = true;
  }
  return this.find(query).sort({ lastUsed: -1 });
};

/**
 * 🔍 Static method: Find account by user and email
 */
emailAccountSchema.statics.findByUserAndEmail = function (userId, email) {
  return this.findOne({
    userId,
    email: email.toLowerCase(),
    isActive: true,
  });
};

/**
 * 🧹 Static method: Deactivate expired or unused accounts
 */
emailAccountSchema.statics.cleanupExpiredAccounts = async function () {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const result = await this.updateMany(
    {
      $or: [
        { tokenExpiry: { $lt: thirtyDaysAgo } },
        { errorCount: { $gte: 10 } },
        { lastUsed: { $lt: thirtyDaysAgo } },
      ],
    },
    {
      $set: { isActive: false },
    }
  );

  return result;
};

/**
 * 🔒 Pre-save middleware: Encrypt tokens before saving
 */
emailAccountSchema.pre("save", function (next) {
  // Encrypt access token if modified
  if (this.isModified("accessToken") && this.accessToken) {
    if (!this.accessToken.includes(":")) {
      this.accessToken = this.encryptToken(this.accessToken);
    }
  }

  // Encrypt refresh token if modified
  if (this.isModified("refreshToken") && this.refreshToken) {
    if (!this.refreshToken.includes(":")) {
      this.refreshToken = this.encryptToken(this.refreshToken);
    }
  }

  next();
});

module.exports = mongoose.model("EmailAccount", emailAccountSchema);
