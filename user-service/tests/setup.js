/**
 * 🧪 Configuration globale des tests
 * Ce fichier est exécuté avant tous les tests
 */

// Configuration des variables d'environnement pour les tests
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-only";
process.env.MONGODB_URI = "mongodb://localhost:27017/emailight-test";
process.env.REDIS_URL = "redis://localhost:6379/1";
process.env.RATE_LIMIT_MAX = "10000";
process.env.RATE_LIMIT_WINDOW = "60000";

// Timeout global pour les tests
jest.setTimeout(30000);

// Mock des logs pour éviter le bruit dans les tests
global.console = {
  ...console,
  // Garder les erreurs et warnings
  error: jest.fn(),
  warn: jest.fn(),
  // Supprimer les logs info et debug
  info: jest.fn(),
  debug: jest.fn(),
  log: jest.fn(),
};

// Nettoyage après chaque test
afterEach(() => {
  jest.clearAllMocks();
});

// Nettoyage global après tous les tests
afterAll(async () => {
  // Fermer les connexions si nécessaire
  if (global.testServer) {
    await global.testServer.close();
  }
});
