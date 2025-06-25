// Script d'initialisation MongoDB pour Emailight
print("🚀 Initialisation de la base de données Emailight...");

// Création de la base de données
db = db.getSiblingDB("emailight_prod");

// Création d'un utilisateur applicatif
db.createUser({
  user: process.env.MONGO_APP_USERNAME || "emailight_app",
  pwd: process.env.MONGO_APP_PASSWORD || "default_app_password",
  roles: [
    {
      role: "readWrite",
      db: process.env.MONGO_INITDB_DATABASE || "emailight_dev",
    },
  ],
});

// Création des collections avec validation
print("📊 Création des collections...");

// Collection users avec validation de schéma
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "authProvider"],
      properties: {
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$",
        },
        authProvider: {
          bsonType: "string",
          enum: ["email", "google"],
        },
        subscription: {
          bsonType: "object",
          properties: {
            status: {
              bsonType: "string",
              enum: ["trial", "active", "canceled", "past_due"],
            },
            plan: {
              bsonType: "string",
              enum: ["trial", "perso_monthly", "perso_yearly"],
            },
          },
        },
      },
    },
  },
});

// Collection emailAccounts
db.createCollection("emailAccounts", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "provider", "email"],
      properties: {
        provider: {
          bsonType: "string",
          enum: ["gmail", "outlook", "yahoo", "smtp"],
        },
        authType: {
          bsonType: "string",
          enum: ["oauth", "smtp"],
        },
      },
    },
  },
});

// Création des index pour optimiser les performances
print("🔍 Création des index...");

// Index sur users
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ "subscription.stripeCustomerId": 1 });
db.users.createIndex({ createdAt: 1 });
db.users.createIndex({ "subscription.status": 1 });

// Index sur emailAccounts
db.emailAccounts.createIndex({ userId: 1 });
db.emailAccounts.createIndex({ email: 1 });
db.emailAccounts.createIndex({ provider: 1 });

// Index composé pour requêtes fréquentes
db.emailAccounts.createIndex({ userId: 1, isActive: 1 });

print("✅ Initialisation MongoDB terminée !");
print("📋 Collections créées : users, emailAccounts");
print("🔑 Index créés pour optimiser les performances");
print("👤 Utilisateur applicatif créé : emailight_app");
