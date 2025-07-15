import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import config from "../config/env.js";
import preferencesSchema from "./schemas/preferencesSchema.js";
import securityMetricsSchema from "./schemas/securityMetricsSchema.js";
import I18nService from "../services/i18nService.js";
import { getValidationMessage } from "../constants/validationMessages.js";
import { VALIDATION_RULES } from "../constants/validationRules.js";
import {
  getEnumValues,
  SUPPORTED_LANGUAGES,
  AUTH_PROVIDERS,
  SUBSCRIPTION_STATUS,
} from "../constants/enums.js";

/**
 * Main User schema
 */
const userSchema = new mongoose.Schema(
  {
    // Basic info
    name: {
      type: String,
      required: [true, getValidationMessage("name", "required")],
      trim: true,
      maxlength: [
        VALIDATION_RULES.NAME.MAX_LENGTH,
        getValidationMessage("name", "maxLength"),
      ],
      minlength: [
        VALIDATION_RULES.NAME.MIN_LENGTH,
        getValidationMessage("name", "minLength"),
      ],
    },
    email: {
      type: String,
      required: [true, getValidationMessage("email", "required")],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        VALIDATION_RULES.EMAIL.PATTERN,
        getValidationMessage("email", "invalid"),
      ],
    },
    password: {
      type: String,
      minlength: [
        VALIDATION_RULES.PASSWORD.MIN_LENGTH,
        getValidationMessage("password", "minLength"),
      ],
      select: false, // Do not include in queries by default
      // Password optional for OAuth accounts
      required: function () {
        return this.authProvider === AUTH_PROVIDERS.EMAIL;
      },
      validate: {
        validator: function (password) {
          // Only validate if authProvider is email and password is provided
          if (this.authProvider === AUTH_PROVIDERS.EMAIL && !password) {
            return false;
          }
          return true;
        },
        message: getValidationMessage("password", "authProviderRequired"),
      },
    },

    // OAuth provider information
    authProvider: {
      type: String,
      enum: getEnumValues.authProviders(),
      default: AUTH_PROVIDERS.EMAIL,
      required: true,
    },
    googleId: {
      type: String,
      sparse: true, // Partial index for non-null values only
      unique: true,
      index: true, // Explicit index to avoid duplicate index warning
    },
    profilePictureUrl: {
      type: String,
      validate: {
        validator: function (url) {
          if (!url) return true; // null/undefined allowed

          // Use centralized validation rules
          return (
            VALIDATION_RULES.PROFILE_PICTURE.URL_PATTERN.test(url) ||
            VALIDATION_RULES.PROFILE_PICTURE.LOCAL_PATTERN.test(url)
          );
        },
        message: getValidationMessage("profilePicture", "invalid"),
      },
    },

    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,

    // Password reset
    passwordResetToken: String,
    passwordResetExpires: Date,

    // Subscription (external service reference)
    subscriptionId: {
      type: String,
      default: null,
    },
    subscriptionStatus: {
      type: String,
      enum: getEnumValues.subscriptionStatuses(),
      default: SUBSCRIPTION_STATUS.FREE,
    },
    subscriptionEndsAt: Date,

    // User preferences
    preferences: {
      type: preferencesSchema,
      default: function () {
        return {
          theme: "auto",
          language: SUPPORTED_LANGUAGES.FR,
          defaultTone: "Professionnel",
          defaultLength: "Moyen",
          defaultEmoji: false,
          emailNotifications: true,
          marketingEmails: false,
          autoSaveDrafts: true,
          timezone: "Europe/Paris",
          compactMode: false,
          showTutorials: true,
        };
      },
    },

    // Security and abuse metrics
    security: {
      type: securityMetricsSchema,
      default: function () {
        return {
          failedLoginAttempts: 0,
          reportCount: 0,
          passwordChangedAt: new Date(),
          emailsSentToday: 0,
          passwordResetAttempts: 0,
          suspiciousActivityFlags: [],
          knownDevices: [],
        };
      },
    },

    // Connected email accounts (reference)
    connectedEmailAccounts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "EmailAccount",
      },
    ],

    // Activity tracking
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.passwordResetToken;
        delete ret.emailVerificationToken;
        delete ret.googleId; // Don't expose Google ID
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for performance
 */
// Basic indexes
// Note: email index is automatically created by unique: true constraint
userSchema.index({ subscriptionStatus: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Composite indexes for common queries
userSchema.index({ email: 1, isActive: 1 }); // Login queries
userSchema.index({ subscriptionStatus: 1, isActive: 1 }); // Subscription analytics
userSchema.index({ isActive: 1, createdAt: -1 }); // User listing

// Security indexes
userSchema.index({ "security.accountLockedUntil": 1 }); // Unlock accounts job
userSchema.index({ "security.failedLoginAttempts": 1, isActive: 1 }); // Security monitoring
userSchema.index({ "security.lastEmailSentDate": 1 }); // Email quota reset

// OAuth indexes
userSchema.index({ authProvider: 1 });
// Note: googleId index is automatically created by unique: true constraint
userSchema.index({ authProvider: 1, isActive: 1 }); // OAuth user queries

// Admin and analytics indexes
userSchema.index({ lastActiveAt: -1 }); // Activity monitoring
userSchema.index({ subscriptionEndsAt: 1 }, { sparse: true }); // Subscription expiry job
userSchema.index({ emailVerificationExpires: 1 }, { sparse: true }); // Cleanup expired tokens
userSchema.index({ passwordResetExpires: 1 }, { sparse: true }); // Cleanup expired reset tokens

/**
 * Pre-save middleware: hash password, validate email uniqueness, cleanup
 */
userSchema.pre("save", async function (next) {
  try {
    // 1. Hash password if modified
    if (this.password && this.isModified("password")) {
      this.password = await bcrypt.hash(this.password, config.BCRYPT_ROUNDS);
      this.security.passwordChangedAt = new Date();
    }

    // 2. Normalize email
    if (this.isModified("email")) {
      this.email = this.email.toLowerCase().trim();
    }

    // 3. Clean up expired tokens
    const now = new Date();
    if (this.emailVerificationExpires && this.emailVerificationExpires < now) {
      this.emailVerificationToken = undefined;
      this.emailVerificationExpires = undefined;
    }
    if (this.passwordResetExpires && this.passwordResetExpires < now) {
      this.passwordResetToken = undefined;
      this.passwordResetExpires = undefined;
    }

    // 4. Reset daily email count if new day
    if (this.security.lastEmailSentDate) {
      const today = new Date().toDateString();
      const lastSentDate = this.security.lastEmailSentDate.toDateString();
      if (lastSentDate !== today) {
        this.security.emailsSentToday = 0;
      }
    }

    // 5. Audit trail for important changes
    if (
      this.isModified("email") ||
      this.isModified("isActive") ||
      this.isModified("subscriptionStatus")
    ) {
      // You can emit events here for audit logging
      // EventEmitter.emit('user.important.change', { userId: this._id, changes: this.modifiedPaths() });
    }

    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Pre-validate middleware: additional business logic validations
 */
userSchema.pre("validate", function (next) {
  try {
    // Ensure OAuth users don't have password requirements
    if (this.authProvider !== AUTH_PROVIDERS.EMAIL && this.password) {
      // Allow but warn - OAuth users might have passwords from before conversion
      // Note: Logger not available in model context, consider moving to service
    }

    // Ensure email verification makes sense
    if (this.authProvider === AUTH_PROVIDERS.GOOGLE && !this.isEmailVerified) {
      // Google users should be automatically verified
      this.isEmailVerified = true;
    }

    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Method: Compare password
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    // Handle OAuth users without password
    if (!this.password) {
      const language = I18nService.getUserLanguage(this);
      const error = new Error(
        I18nService.getMessage("auth.externalAuth", language)
      );
      error.code = "EXTERNAL_AUTH_ACCOUNT";
      throw error;
    }

    // Validate input
    if (!candidatePassword || typeof candidatePassword !== "string") {
      const language = I18nService.getUserLanguage(this);
      const error = new Error(
        I18nService.getMessage("auth.invalidCredentials", language)
      );
      error.code = "INVALID_INPUT";
      throw error;
    }

    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
  } catch (error) {
    // Don't mask bcrypt errors for debugging, but provide user-friendly messages
    if (
      error.code === "EXTERNAL_AUTH_ACCOUNT" ||
      error.code === "INVALID_INPUT"
    ) {
      throw error; // Re-throw our custom errors
    }

    // Log bcrypt errors for debugging but throw user-friendly message
    // Note: Logger not available in model context, consider moving to service

    const language = I18nService.getUserLanguage(this);
    const userError = new Error(
      I18nService.getMessage("auth.passwordError", language)
    );
    userError.code = "PASSWORD_COMPARISON_FAILED";
    userError.originalError = error; // Keep original for debugging
    throw userError;
  }
};

// Note: Business logic methods have been moved to UserService to avoid circular dependencies
// Use UserService.methodName(user) instead of user.methodName()

/**
 * Virtual: Public profile info
 */
userSchema.virtual("profile").get(function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    authProvider: this.authProvider,
    profilePictureUrl: this.profilePictureUrl,
    subscriptionStatus: this.subscriptionStatus,
    isEmailVerified: this.isEmailVerified,
    createdAt: this.createdAt,
    lastActiveAt: this.lastActiveAt,
    // Note: Use UserService.canChangePassword(user) in your controllers
    canChangePassword:
      this.authProvider === AUTH_PROVIDERS.EMAIL && this.password,
  };
});

/**
 * Virtual: Security stats (for admin usage)
 */
userSchema.virtual("securityStats").get(function () {
  const isLocked = !!(
    this.security.accountLockedUntil &&
    this.security.accountLockedUntil > Date.now()
  );
  const securityScore = this.security.getSecurityScore
    ? this.security.getSecurityScore()
    : 100;

  return {
    isLocked,
    failedAttempts: this.security.failedLoginAttempts,
    lastLogin: this.security.lastFailedLogin,
    emailsSentToday: this.security.emailsSentToday,
    // Note: Use UserService.canSendEmail(user) in your controllers for accurate results
    canSendEmail: true, // Simplified - use service method for accurate calculation
    authProvider: this.authProvider,
    isOAuthUser: this.authProvider !== AUTH_PROVIDERS.EMAIL,
    securityScore,
  };
});

/**
 * Static method: Find user by Google ID
 */
userSchema.statics.findByGoogleId = function (googleId) {
  return this.findOne({ googleId, isActive: true });
};

/**
 * Static method: Find user by email for OAuth linking
 */
userSchema.statics.findForOAuthLinking = function (email) {
  return this.findOne({
    email: email.toLowerCase(),
    isActive: true,
  });
};

export default mongoose.model("User", userSchema);
