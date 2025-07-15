// ============================================================================
// 📁 src/models/schemas/securityMetricsSchema.js - Security metrics schema
// ============================================================================

import mongoose from "mongoose";
import {
  EMAIL_LIMITS,
  SECURITY,
  SUBSCRIPTION_STATUS,
} from "../../constants/enums.js";

/**
 * 🛡️ Security metrics and abuse tracking schema
 * Handles authentication attempts, usage metrics, and security tracking
 */
const securityMetricsSchema = new mongoose.Schema(
  {
    // 🚫 Authentication attempts
    failedLoginAttempts: {
      type: Number,
      default: 0,
      min: [0, "Failed login attempts cannot be negative"],
      max: [
        SECURITY.MAX_LOGIN_ATTEMPTS * 2,
        "Failed login attempts exceeded maximum",
      ],
    },
    lastFailedLogin: {
      type: Date,
      validate: {
        validator: function (date) {
          return !date || date <= new Date();
        },
        message: "Last failed login cannot be in the future",
      },
    },
    accountLockedUntil: {
      type: Date,
      validate: {
        validator: function (date) {
          return !date || date > new Date();
        },
        message: "Account lock expiry must be in the future",
      },
    },

    // 📊 Usage metrics
    lastLoginIP: {
      type: String,
      validate: {
        validator: function (ip) {
          if (!ip) return true;
          // Basic IP validation (IPv4 and IPv6)
          const ipv4Regex =
            /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
          const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
          return ipv4Regex.test(ip) || ipv6Regex.test(ip);
        },
        message: "Invalid IP address format",
      },
    },
    lastLoginUserAgent: {
      type: String,
      maxlength: [500, "User agent cannot exceed 500 characters"],
    },

    // ⚠️ Reports and abuse
    reportCount: {
      type: Number,
      default: 0,
      min: [0, "Report count cannot be negative"],
    },
    lastReportDate: {
      type: Date,
      validate: {
        validator: function (date) {
          return !date || date <= new Date();
        },
        message: "Last report date cannot be in the future",
      },
    },

    // 🔒 Security tracking
    passwordChangedAt: {
      type: Date,
      default: Date.now,
      validate: {
        validator: function (date) {
          return date <= new Date();
        },
        message: "Password change date cannot be in the future",
      },
    },

    // 📧 Email sending limits and tracking
    emailsSentToday: {
      type: Number,
      default: 0,
      min: [0, "Emails sent count cannot be negative"],
      validate: {
        validator: function (count) {
          // Allow some buffer above normal limits for admin accounts
          return count <= Math.max(...Object.values(EMAIL_LIMITS)) * 2;
        },
        message: "Emails sent count exceeds reasonable limits",
      },
    },
    lastEmailSentDate: {
      type: Date,
      validate: {
        validator: function (date) {
          return !date || date <= new Date();
        },
        message: "Last email sent date cannot be in the future",
      },
    },

    // 🆕 Additional security metrics
    lastPasswordResetRequest: {
      type: Date,
      validate: {
        validator: function (date) {
          return !date || date <= new Date();
        },
        message: "Last password reset request cannot be in the future",
      },
    },
    passwordResetAttempts: {
      type: Number,
      default: 0,
      min: [0, "Password reset attempts cannot be negative"],
    },

    // 🔍 Suspicious activity tracking
    suspiciousActivityFlags: [
      {
        type: {
          type: String,
          enum: [
            "unusual_location",
            "rapid_requests",
            "failed_auth",
            "suspicious_email",
          ],
          required: true,
        },
        flaggedAt: {
          type: Date,
          default: Date.now,
        },
        details: {
          type: String,
          maxlength: [200, "Details cannot exceed 200 characters"],
        },
        resolved: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // 📱 Device tracking
    knownDevices: [
      {
        fingerprint: {
          type: String,
          required: true,
        },
        userAgent: String,
        lastSeen: {
          type: Date,
          default: Date.now,
        },
        trusted: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    _id: false,
    timestamps: false,
  }
);

/**
 * 🕰️ Methods for time-based operations
 */
securityMetricsSchema.methods.isAccountLocked = function () {
  return !!(this.accountLockedUntil && this.accountLockedUntil > new Date());
};

securityMetricsSchema.methods.shouldResetDailyEmailCount = function () {
  if (!this.lastEmailSentDate) return true;

  const today = new Date().toDateString();
  const lastSentDate = this.lastEmailSentDate.toDateString();

  return lastSentDate !== today;
};

securityMetricsSchema.methods.canSendEmail = function (
  subscriptionStatus = "free"
) {
  if (this.shouldResetDailyEmailCount()) {
    return true;
  }

  const limit = EMAIL_LIMITS[subscriptionStatus] || EMAIL_LIMITS.free;
  return this.emailsSentToday < limit;
};

securityMetricsSchema.methods.getRemainingEmails = function (
  subscriptionStatus = "free"
) {
  if (this.shouldResetDailyEmailCount()) {
    return EMAIL_LIMITS[subscriptionStatus] || EMAIL_LIMITS.free;
  }

  const limit = EMAIL_LIMITS[subscriptionStatus] || EMAIL_LIMITS.free;
  return Math.max(0, limit - this.emailsSentToday);
};

/**
 * 🚨 Security analysis methods
 */
securityMetricsSchema.methods.getSecurityScore = function () {
  let score = 100;

  // Deduct points for failed login attempts
  score -= this.failedLoginAttempts * 5;

  // Deduct points for being locked
  if (this.isAccountLocked()) score -= 20;

  // Deduct points for reports
  score -= this.reportCount * 10;

  // Deduct points for suspicious activities
  const unresolvedFlags = this.suspiciousActivityFlags.filter(
    (flag) => !flag.resolved
  );
  score -= unresolvedFlags.length * 15;

  // Deduct points for old password
  if (this.passwordChangedAt) {
    const daysSincePasswordChange =
      (Date.now() - this.passwordChangedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePasswordChange > 365) score -= 10; // Password older than 1 year
  }

  return Math.max(0, Math.min(100, score));
};

securityMetricsSchema.methods.needsSecurityReview = function () {
  return (
    this.getSecurityScore() < 70 ||
    this.reportCount >= 3 ||
    this.suspiciousActivityFlags.filter((flag) => !flag.resolved).length > 0
  );
};

securityMetricsSchema.methods.addSuspiciousActivity = function (
  type,
  details = ""
) {
  this.suspiciousActivityFlags.push({
    type,
    details,
    flaggedAt: new Date(),
    resolved: false,
  });

  // Keep only last 10 flags
  if (this.suspiciousActivityFlags.length > 10) {
    this.suspiciousActivityFlags = this.suspiciousActivityFlags.slice(-10);
  }
};

securityMetricsSchema.methods.trustDevice = function (fingerprint, userAgent) {
  const existingDevice = this.knownDevices.find(
    (device) => device.fingerprint === fingerprint
  );

  if (existingDevice) {
    existingDevice.lastSeen = new Date();
    existingDevice.trusted = true;
    if (userAgent) existingDevice.userAgent = userAgent;
  } else {
    this.knownDevices.push({
      fingerprint,
      userAgent,
      lastSeen: new Date(),
      trusted: true,
    });
  }

  // Keep only last 5 devices
  if (this.knownDevices.length > 5) {
    this.knownDevices = this.knownDevices.slice(-5);
  }
};

/**
 * 🎯 Virtual for security summary
 */
securityMetricsSchema.virtual("summary").get(function () {
  return {
    securityScore: this.getSecurityScore(),
    isLocked: this.isAccountLocked(),
    needsReview: this.needsSecurityReview(),
    failedAttempts: this.failedLoginAttempts,
    reportCount: this.reportCount,
    emailsToday: this.emailsSentToday,
    trustedDevices: this.knownDevices.filter((device) => device.trusted).length,
    unresolvedFlags: this.suspiciousActivityFlags.filter(
      (flag) => !flag.resolved
    ).length,
  };
});

export default securityMetricsSchema;
