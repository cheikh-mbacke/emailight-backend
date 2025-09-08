export default {
  // Environnement de test
  testEnvironment: "node",

  // Support des modules ES6
  preset: "node",
  extensionsToTreatAsEsm: [".js"],

  // Configuration pour les modules ES6
  transform: {
    "^.+\\.js$": "babel-jest",
  },

  // Extensions de fichiers supportées
  moduleFileExtensions: ["js", "json"],

  // Racine des tests
  testMatch: ["<rootDir>/tests/**/*.test.js", "<rootDir>/tests/**/*.spec.js"],

  // Répertoires à ignorer
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/build/"],

  // Timeout pour les tests
  testTimeout: 30000,

  // Couverture de code
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/**/*.test.js",
    "!src/**/*.spec.js",
    "!src/index.js",
  ],

  // Variables d'environnement pour les tests
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],

  // Nettoyage automatique
  clearMocks: true,
  restoreMocks: true,

  // Verbose pour les tests
  verbose: true,

  // Force exit après les tests
  forceExit: true,

  // Détecter les handles ouverts
  detectOpenHandles: true,
};
