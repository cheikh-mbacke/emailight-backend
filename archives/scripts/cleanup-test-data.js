#!/usr/bin/env node

// ============================================================================
// 📁 scripts/cleanup-test-data.js - Nettoyage des données de test
// ============================================================================

import mongoose from "mongoose";
import config from "../src/config/env.js";

/**
 * 🎨 Utilitaires d'affichage coloré
 */
const log = {
  success: (msg) => console.log(`\x1b[32m✅ ${msg}\x1b[0m`),
  error: (msg) => console.log(`\x1b[31m❌ ${msg}\x1b[0m`),
  warning: (msg) => console.log(`\x1b[33m⚠️  ${msg}\x1b[0m`),
  info: (msg) => console.log(`\x1b[34mℹ️  ${msg}\x1b[0m`),
  title: (msg) => console.log(`\x1b[1m\x1b[36m🧹 ${msg}\x1b[0m\n`),
};

/**
 * 🗑️ Nettoie les données de test
 */
async function cleanupTestData() {
  try {
    log.title("Nettoyage des données de test");

    // Connexion à MongoDB
    log.info("Connexion à MongoDB...");
    await mongoose.connect(config.MONGODB_URI);
    log.success("Connexion MongoDB établie");

    // Supprimer les utilisateurs de test
    const testEmailPatterns = [
      /test-.*@emailight\.com/,
      /existing-.*@emailight\.com/,
      /short-pass-.*@emailight\.com/,
      /short-name-.*@emailight\.com/,
      /no-name-.*@emailight\.com/,
      /no-pass-.*@emailight\.com/,
      /login-test-.*@emailight\.com/,
    ];

    let totalDeleted = 0;

    for (const pattern of testEmailPatterns) {
      const result = await mongoose.connection.db
        .collection("users")
        .deleteMany({
          email: { $regex: pattern },
        });
      totalDeleted += result.deletedCount;

      if (result.deletedCount > 0) {
        log.info(
          `Supprimé ${result.deletedCount} utilisateurs avec pattern: ${pattern}`
        );
      }
    }

    // Supprimer également les comptes email liés aux utilisateurs de test
    for (const pattern of testEmailPatterns) {
      const result = await mongoose.connection.db
        .collection("emailaccounts")
        .deleteMany({
          userEmail: { $regex: pattern },
        });

      if (result.deletedCount > 0) {
        log.info(`Supprimé ${result.deletedCount} comptes email de test`);
      }
    }

    log.success(
      `Nettoyage terminé - ${totalDeleted} utilisateurs de test supprimés`
    );
  } catch (error) {
    log.error(`Erreur lors du nettoyage : ${error.message}`);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    log.info("Connexion MongoDB fermée");
  }
}

/**
 * 🎯 Point d'entrée principal
 */
async function main() {
  try {
    await cleanupTestData();
    log.success("Nettoyage des données de test terminé avec succès");
    process.exit(0);
  } catch (error) {
    log.error(`Erreur fatale : ${error.message}`);
    process.exit(1);
  }
}

// Lancement du script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default cleanupTestData;
