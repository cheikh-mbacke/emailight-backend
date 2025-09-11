/**
 * 🧪 Configuration globale des tests
 * Ce fichier est exécuté avant tous les tests
 */

// Configuration des variables d'environnement pour les tests
process.env.NODE_ENV = "test";
process.env.JWT_SECRET =
  process.env.JWT_SECRET || "test-jwt-secret-key-for-testing-only";

// Configuration MongoDB avec gestion des credentials pour CI/CD
const getMongoUri = () => {
  if (process.env.CI) {
    const timestamp = Date.now();
    return `mongodb://localhost:27017/emailight_test_${timestamp}`;
  }
  return process.env.MONGODB_URI || "mongodb://localhost:27017/emailight_test";
};

process.env.MONGODB_URI = getMongoUri();
process.env.REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379/1";
process.env.RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX || "10000";
process.env.RATE_LIMIT_WINDOW = process.env.RATE_LIMIT_WINDOW || "60000";

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

// Nettoyage global avant tous les tests
beforeAll(async () => {
  console.log("🧹 Démarrage du nettoyage de la base de données de test...");

  try {
    const mongoose = require("mongoose");

    // Se connecter avec la bonne URI (avec ou sans credentials)
    const mongoUri = getMongoUri();
    console.log(
      `📡 Connexion à MongoDB: ${mongoUri.replace(/\/\/.*@/, "//***@")}`
    );

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, {
        // Options pour éviter les warnings
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }

    // Vérifier la connexion
    if (mongoose.connection.readyState === 1) {
      console.log("✅ Connexion MongoDB établie");

      // Méthode 1: Essayer de supprimer toute la base de données (plus propre)
      try {
        await mongoose.connection.db.dropDatabase();
        console.log("🗑️ Base de données de test supprimée complètement");
      } catch (dropError) {
        console.log(
          "⚠️ Impossible de supprimer la base, nettoyage des collections..."
        );

        // Méthode 2: Nettoyer collection par collection
        const collections = ["users", "emailaccounts", "tokens", "sessions"];
        let cleanedCount = 0;

        for (const collectionName of collections) {
          try {
            const collection =
              mongoose.connection.db.collection(collectionName);

            // Supprimer spécifiquement les données de test
            const result = await collection.deleteMany({
              $or: [
                { email: { $regex: /@emailight\.com$/ } },
                { testData: true },
                { environment: "test" },
              ],
            });

            if (result.deletedCount > 0) {
              console.log(
                `🧽 Collection ${collectionName}: ${result.deletedCount} documents supprimés`
              );
              cleanedCount += result.deletedCount;
            }
          } catch (collectionError) {
            console.log(
              `⚠️ Erreur sur ${collectionName}: ${collectionError.message}`
            );
          }
        }

        console.log(
          `✅ Nettoyage terminé: ${cleanedCount} documents supprimés au total`
        );
      }
    } else {
      console.log("❌ Connexion MongoDB impossible");
    }
  } catch (error) {
    console.log(`⚠️ Erreur lors du nettoyage: ${error.message}`);
    console.log(
      "🎯 Les tests utiliseront des identifiants uniques pour éviter les conflits"
    );
  }
});

// Nettoyage global après tous les tests
afterAll(async () => {
  console.log("🔚 Nettoyage final...");

  // Fermer les connexions si nécessaire
  if (global.testServer) {
    try {
      await global.testServer.close();
      console.log("🛑 Serveur de test fermé");
    } catch (error) {
      console.log("⚠️ Erreur fermeture serveur:", error.message);
    }
  }

  // Fermer la connexion mongoose
  try {
    const mongoose = require("mongoose");
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log("🔌 Connexion MongoDB fermée");
    }
  } catch (error) {
    console.log("⚠️ Erreur fermeture MongoDB:", error.message);
  }
});
