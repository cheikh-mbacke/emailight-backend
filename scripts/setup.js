#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function copyEnvFile() {
  const envExample = path.join(__dirname, "..", "docker", ".env.example");
  const envFile = path.join(__dirname, "..", "docker", ".env");

  try {
    if (fs.existsSync(envFile)) {
      console.log("⚠️  Le fichier docker/.env existe déjà");
      return;
    }

    fs.copyFileSync(envExample, envFile);
    console.log("✅ Fichier docker/.env créé depuis .env.example");
  } catch (error) {
    console.error("❌ Erreur lors de la copie du fichier .env:", error.message);
    process.exit(1);
  }
}

function main() {
  console.log("🚀 Configuration de l'infrastructure Emailight...\n");

  copyEnvFile();

  console.log("\n📝 Prochaines étapes :");
  console.log("1. Éditez docker/.env avec vos configurations");
  console.log("2. Lancez npm run dev pour démarrer l'infrastructure");
  console.log("3. Accédez aux interfaces :");
  console.log("   - MongoDB: http://localhost:8082 (admin/admin)");
  console.log("   - Redis: http://localhost:8081");
  console.log("\n✨ Configuration terminée !");
}

main();
