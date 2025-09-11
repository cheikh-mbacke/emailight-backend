/**
 * Configuration globale des tests
 */

// Configuration des variables d'environnement pour les tests
process.env.NODE_ENV = "test";
process.env.JWT_SECRET =
  process.env.JWT_SECRET || "test-jwt-secret-key-for-testing-only";

// URI MongoDB avec gestion des credentials pour CI/CD
if (process.env.CI) {
  // En CI/CD, utiliser les credentials du service MongoDB
  process.env.MONGODB_URI =
    process.env.MONGODB_URI ||
    "mongodb://test_user:test_password@localhost:27017/emailight_test";
} else {
  // En local, utiliser sans authentification
  process.env.MONGODB_URI =
    process.env.MONGODB_URI || "mongodb://localhost:27017/emailight_test";
}

process.env.REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379/1";
process.env.RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX || "10000";
process.env.RATE_LIMIT_WINDOW = process.env.RATE_LIMIT_WINDOW || "60000";

// Timeout global pour les tests
jest.setTimeout(30000);

// Mock des logs pour éviter le bruit dans les tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  log: jest.fn(),
};

// Nettoyage après chaque test
afterEach(() => {
  jest.clearAllMocks();
});

// Nettoyage global avant tous les tests
beforeAll(async () => {
  try {
    const mongoose = require("mongoose");

    // Se connecter avec la bonne URI (avec ou sans credentials)
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // Nettoyer spécifiquement les données de test
    const collections = ["users", "emailaccounts"];
    for (const collection of collections) {
      try {
        await mongoose.connection.db.collection(collection).deleteMany({
          email: { $regex: /@emailight\.com$/ },
        });
      } catch (error) {
        console.log(`Impossible de nettoyer ${collection}: ${error.message}`);
      }
    }

    console.log("Base de données de test nettoyée");
  } catch (error) {
    console.log(`Nettoyage impossible: ${error.message}`);
  }
});

// Nettoyage global après tous les tests
afterAll(async () => {
  if (global.testServer) {
    await global.testServer.close();
  }

  // Fermer la connexion mongoose
  try {
    const mongoose = require("mongoose");
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  } catch (error) {
    // Ignorer les erreurs de fermeture
  }
});
