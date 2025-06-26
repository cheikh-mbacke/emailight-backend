// ============================================================================
// 📁 src/index.js - Central export entry point (optional)
// ============================================================================

// Export services for external use
const AuthService = require("./services/authService");
const UserService = require("./services/userService");
const PreferencesService = require("./services/preferencesService");

// Export controllers
const AuthController = require("./controllers/authController");
const UserController = require("./controllers/userController");
const PreferencesController = require("./controllers/preferencesController");

// Export models
const User = require("./models/User");
const EmailAccount = require("./models/EmailAccount");

// Export utilities
const { logger } = require("./utils/logger");

module.exports = {
  // Services (business logic)
  services: {
    AuthService,
    UserService,
    PreferencesService,
  },

  // Controllers (route handlers)
  controllers: {
    AuthController,
    UserController,
    PreferencesController,
  },

  // Mongoose models (database schema)
  models: {
    User,
    EmailAccount,
  },

  // Utilities (e.g., logging)
  utils: {
    logger,
  },
};
