import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import config from "../config/env.js";

/**
 * User preferences schema
 */
const preferencesSchema = new mongoose.Schema(
  {
    // 🎨 Interface preferences
    theme: {
      type: String,
      enum: ["light", "dark", "auto"],
      default: "auto",
    },
    language: {
      type: String,
      enum: ["FR", "EN", "ES", "DE", "IT", "PT", "NL", "RU", "ZH", "JA"],
      default: "FR",
    },

    // 📧 Default email preferences
    defaultTone: {
      type: String,
      enum: [
        "Accueillant",
        "Amical",
        "Apaisant",
        "Assertif",
        "Autoritaire",
        "Bienveillant",
        "Candide",
        "Chaleureux",
        "Clairvoyant",
        "Collaboratif",
        "Confidentiel",
        "Confiant",
        "Constructif",
        "Courtois",
        "Décidé",
        "Délicat",
        "Diplomatique",
        "Direct",
        "Drôle",
        "Empathique",
        "Encourageant",
        "Enthousiaste",
        "Excusant",
        "Ferme",
        "Formel",
        "Humble",
        "Informatif",
        "Inspirant",
        "Ironique",
        "Lucide",
        "Motivant",
        "Neutre",
        "Optimiste",
        "Persuasif",
        "Positif",
        "Professionnel",
        "Prudent",
        "Rassurant",
        "Reconnaissant",
        "Sincère",
        "Solennel",
        "Urgent",
      ],
      default: "Professionnel",
    },
    defaultLength: {
      type: String,
      enum: ["Court", "Moyen", "Long"],
      default: "Moyen",
    },
    defaultEmoji: {
      type: Boolean,
      default: false,
    },

    // 🔔 Notifications
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    marketingEmails: {
      type: Boolean,
      default: false,
    },

    // 💾 Auto-save drafts
    autoSaveDrafts: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

/**
 * Abuse/security metrics schema
 */
const securityMetricsSchema = new mongoose.Schema(
  {
    // 🚫 Authentication attempts
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lastFailedLogin: Date,
    accountLockedUntil: Date,

    // 📊 Usage metrics
    lastLoginIP: String,
    lastLoginUserAgent: String,

    // ⚠️ Reports and abuse
    reportCount: {
      type: Number,
      default: 0,
    },
    lastReportDate: Date,

    // 🔒 Security
    passwordChangedAt: {
      type: Date,
      default: Date.now,
    },

    // 📧 Email sending limits
    emailsSentToday: {
      type: Number,
      default: 0,
    },
    lastEmailSentDate: Date,
  },
  { _id: false }
);

/**
 * Main User schema
 */
const userSchema = new mongoose.Schema(
  {
    // 👤 Basic info
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
      minlength: [2, "Name must be at least 2 characters long"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Invalid email format",
      ],
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters long"],
      select: false, // Do not include in queries by default
      // 🆕 Password optionnel pour les comptes OAuth
      required: function () {
        return this.authProvider === "email";
      },
    },

    // 🆕 OAuth provider information
    authProvider: {
      type: String,
      enum: ["email", "google"],
      default: "email",
      required: true,
    },
    googleId: {
      type: String,
      sparse: true, // Index partiel pour les valeurs non nulles uniquement
      unique: true,
    },
    profilePictureUrl: {
      type: String,
      validate: {
        validator: function (url) {
          if (!url) return true; // null/undefined autorisé

          // URL complète http/https
          const httpRegex = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;

          // URL relative locale /uploads/
          const localRegex = /^\/uploads\/.+\.(jpg|jpeg|png|gif|webp)$/i;

          return httpRegex.test(url) || localRegex.test(url);
        },
        message: "Invalid profile picture URL format",
      },
    },

    // ✅ Account status
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

    // 🔄 Password reset
    passwordResetToken: String,
    passwordResetExpires: Date,

    // 💳 Subscription (external service reference)
    subscriptionId: {
      type: String,
      default: null,
    },
    subscriptionStatus: {
      type: String,
      enum: ["free", "premium", "enterprise", "suspended"],
      default: "free",
    },
    subscriptionEndsAt: Date,

    // ⚙️ User preferences
    preferences: {
      type: preferencesSchema,
      default: () => ({}),
    },

    // 📊 Security and abuse metrics
    security: {
      type: securityMetricsSchema,
      default: () => ({}),
    },

    // 📧 Connected email accounts (reference)
    connectedEmailAccounts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "EmailAccount",
      },
    ],

    // 🕐 Activity tracking
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
        delete ret.googleId; // 🆕 Ne pas exposer l'ID Google
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

/**
 * 📍 Indexes for performance
 */
userSchema.index({ subscriptionStatus: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ "security.accountLockedUntil": 1 });
userSchema.index({ createdAt: -1 });
// 🆕 Index pour les recherches OAuth
userSchema.index({ authProvider: 1 });
userSchema.index({ googleId: 1 }, { sparse: true });

/**
 * 🔒 Pre-save middleware: hash password if modified
 */
userSchema.pre("save", async function (next) {
  // 🆕 Skip password hashing for OAuth users without password
  if (!this.password || !this.isModified("password")) return next();

  try {
    this.password = await bcrypt.hash(this.password, config.BCRYPT_ROUNDS);
    this.security.passwordChangedAt = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * 🔑 Method: Compare password
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    // 🆕 Handle OAuth users without password
    if (!this.password) {
      throw new Error("This account uses external authentication");
    }

    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Error while verifying password");
  }
};

/**
 * 🔒 Method: Check if account is locked
 */
userSchema.methods.isAccountLocked = function () {
  return !!(
    this.security.accountLockedUntil &&
    this.security.accountLockedUntil > Date.now()
  );
};

/**
 * 🚫 Method: Increment failed login attempts
 */
userSchema.methods.incLoginAttempts = async function () {
  if (
    this.security.accountLockedUntil &&
    this.security.accountLockedUntil < Date.now()
  ) {
    return this.updateOne({
      $unset: {
        "security.accountLockedUntil": 1,
        "security.failedLoginAttempts": 1,
      },
    });
  }

  const updates = {
    $inc: { "security.failedLoginAttempts": 1 },
    $set: { "security.lastFailedLogin": Date.now() },
  };

  if (this.security.failedLoginAttempts + 1 >= 5 && !this.isAccountLocked()) {
    updates.$set["security.accountLockedUntil"] =
      Date.now() + 2 * 60 * 60 * 1000; // 2 hours
  }

  return this.updateOne(updates);
};

/**
 * ✅ Method: Reset login attempts after successful login
 */
userSchema.methods.resetLoginAttempts = async function () {
  return this.updateOne({
    $unset: {
      "security.failedLoginAttempts": 1,
      "security.accountLockedUntil": 1,
    },
  });
};

/**
 * 🕐 Method: Update last active timestamp and session info
 */
userSchema.methods.updateLastActive = async function (ip, userAgent) {
  return this.updateOne({
    $set: {
      lastActiveAt: new Date(),
      "security.lastLoginIP": ip,
      "security.lastLoginUserAgent": userAgent,
    },
  });
};

/**
 * 📧 Method: Check if user can send an email
 */
userSchema.methods.canSendEmail = function () {
  const today = new Date().toDateString();
  const lastSentDate = this.security.lastEmailSentDate
    ? this.security.lastEmailSentDate.toDateString()
    : null;

  if (lastSentDate !== today) {
    this.security.emailsSentToday = 0;
  }

  const limits = {
    free: 50,
    premium: 500,
    enterprise: 5000,
  };

  return (
    this.security.emailsSentToday <
    (limits[this.subscriptionStatus] || limits.free)
  );
};

/**
 * 📊 Method: Increment sent email count
 */
userSchema.methods.incrementEmailsSent = async function () {
  const today = new Date().toDateString();
  const lastSentDate = this.security.lastEmailSentDate
    ? this.security.lastEmailSentDate.toDateString()
    : null;

  const updates = {
    $set: { "security.lastEmailSentDate": new Date() },
  };

  if (lastSentDate === today) {
    updates.$inc = { "security.emailsSentToday": 1 };
  } else {
    updates.$set["security.emailsSentToday"] = 1;
  }

  return this.updateOne(updates);
};

/**
 * 🆕 Method: Check if user is OAuth-based
 */
userSchema.methods.isOAuthUser = function () {
  return this.authProvider !== "email";
};

/**
 * 🆕 Method: Check if user can change password
 */
userSchema.methods.canChangePassword = function () {
  return this.authProvider === "email" && this.password;
};

/**
 * 🎯 Virtual: Public profile info
 */
userSchema.virtual("profile").get(function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    authProvider: this.authProvider, // 🆕 Exposer le provider
    profilePictureUrl: this.profilePictureUrl, // 🆕 Photo de profil
    subscriptionStatus: this.subscriptionStatus,
    isEmailVerified: this.isEmailVerified,
    createdAt: this.createdAt,
    lastActiveAt: this.lastActiveAt,
    canChangePassword: this.canChangePassword(), // 🆕 Capacité à changer le mot de passe
  };
});

/**
 * 📊 Virtual: Security stats (for admin usage)
 */
userSchema.virtual("securityStats").get(function () {
  return {
    isLocked: this.isAccountLocked(),
    failedAttempts: this.security.failedLoginAttempts,
    lastLogin: this.security.lastFailedLogin,
    emailsSentToday: this.security.emailsSentToday,
    canSendEmail: this.canSendEmail(),
    authProvider: this.authProvider, // 🆕 Provider d'auth
    isOAuthUser: this.isOAuthUser(), // 🆕 Utilisateur OAuth
  };
});

/**
 * 🆕 Static method: Find user by Google ID
 */
userSchema.statics.findByGoogleId = function (googleId) {
  return this.findOne({ googleId, isActive: true });
};

/**
 * 🆕 Static method: Find user by email for OAuth linking
 */
userSchema.statics.findForOAuthLinking = function (email) {
  return this.findOne({
    email: email.toLowerCase(),
    isActive: true,
  });
};

export default mongoose.model("User", userSchema);
