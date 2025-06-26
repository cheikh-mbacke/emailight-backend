// Script d'initialisation MongoDB pour Emailight
print("🚀 Initialisation de la base de données Emailight...");

// Création de la base de données
db = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE || "emailight");

// Création d'un utilisateur applicatif
print("👤 Création de l'utilisateur applicatif...");
db.createUser({
  user: process.env.MONGO_APP_USERNAME || "emailight_app",
  pwd: process.env.MONGO_APP_PASSWORD || "default_app_password",
  roles: [
    {
      role: "readWrite",
      db: process.env.MONGO_INITDB_DATABASE || "emailight",
    },
  ],
});

print("✅ Initialisation MongoDB terminée !");
print(
  `📦 Base de données créée : ${process.env.MONGO_INITDB_DATABASE || "emailight"}`
);
print(
  `👤 Utilisateur applicatif créé : ${process.env.MONGO_APP_USERNAME || "emailight_app"}`
);
print(
  "🎯 Les microservices se chargeront de créer leurs collections et index selon leurs besoins"
);
