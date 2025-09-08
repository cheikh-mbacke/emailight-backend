#!/usr/bin/env node

// ============================================================================
// 🔍 Script de diagnostic pour les tests d'authentification
// ============================================================================

import http from "http";
import { randomBytes } from "crypto";

/**
 * 🌐 Effectue une requête HTTP
 */
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;

    const options = {
      hostname: "localhost",
      port: 3001,
      path: `/api/v1${path}`,
      method: method,
      headers: {
        "User-Agent": "Emailight-Debug-Tester/1.0",
        "X-Test-Environment": "Docker-Container",
        ...headers,
      },
      timeout: 10000,
    };

    if (postData) {
      options.headers["Content-Type"] = "application/json";
      options.headers["Content-Length"] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let body = "";

      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null,
          };
          resolve(response);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            parseError: error.message,
          });
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    if (postData) {
      req.write(postData);
    }

    req.end();
  });
}

/**
 * 🔍 Test de diagnostic pour DELETE /users/me
 */
async function debugDeleteAccountAuth() {
  console.log("🔍 [DEBUG] Test de diagnostic pour DELETE /users/me\n");

  // 1. Créer un utilisateur de test
  const testEmail = `debug-test-${randomBytes(4).toString("hex")}@example.com`;
  const testPassword = "DebugTest123";

  console.log(`📝 Création utilisateur: ${testEmail}`);
  const registerResponse = await makeRequest("POST", "/auth/register", {
    name: "Debug Test User",
    email: testEmail,
    password: testPassword,
  });

  console.log(`📝 Réponse register:`, registerResponse.statusCode);
  if (registerResponse.statusCode !== 201) {
    console.log("❌ Échec création utilisateur:", registerResponse.body);
    return;
  }

  const authToken = registerResponse.body.data.accessToken;
  console.log("✅ Utilisateur créé avec succès\n");

  // 2. Test Token manquant
  console.log("🔍 Test 1: Token manquant");
  const response1 = await makeRequest(
    "DELETE",
    "/users/me",
    { password: testPassword },
    {
      "Accept-Language": "fr-FR",
    }
  );
  console.log(`   Status: ${response1.statusCode}`);
  console.log(`   Body:`, JSON.stringify(response1.body, null, 2));
  console.log();

  // 3. Test Token invalide
  console.log("🔍 Test 2: Token invalide");
  const response2 = await makeRequest(
    "DELETE",
    "/users/me",
    { password: testPassword },
    {
      Authorization: "Bearer abc123",
      "Accept-Language": "fr-FR",
    }
  );
  console.log(`   Status: ${response2.statusCode}`);
  console.log(`   Body:`, JSON.stringify(response2.body, null, 2));
  console.log();

  // 4. Test Token valide mais mot de passe incorrect
  console.log("🔍 Test 3: Token valide, mot de passe incorrect");
  const response3 = await makeRequest(
    "DELETE",
    "/users/me",
    { password: "WrongPassword123" },
    {
      Authorization: `Bearer ${authToken}`,
      "Accept-Language": "fr-FR",
    }
  );
  console.log(`   Status: ${response3.statusCode}`);
  console.log(`   Body:`, JSON.stringify(response3.body, null, 2));
  console.log();

  // 5. Test Token valide et mot de passe correct
  console.log("🔍 Test 4: Token valide, mot de passe correct");
  const response4 = await makeRequest(
    "DELETE",
    "/users/me",
    { password: testPassword },
    {
      Authorization: `Bearer ${authToken}`,
      "Accept-Language": "fr-FR",
    }
  );
  console.log(`   Status: ${response4.statusCode}`);
  console.log(`   Body:`, JSON.stringify(response4.body, null, 2));
  console.log();

  // 6. Test avec utilisateur supprimé
  console.log("🔍 Test 5: Token d'utilisateur supprimé");
  const response5 = await makeRequest(
    "DELETE",
    "/users/me",
    { password: testPassword },
    {
      Authorization: `Bearer ${authToken}`,
      "Accept-Language": "fr-FR",
    }
  );
  console.log(`   Status: ${response5.statusCode}`);
  console.log(`   Body:`, JSON.stringify(response5.body, null, 2));
  console.log();
}

/**
 * 🔍 Test de diagnostic pour la création d'utilisateurs multiples
 */
async function debugMultipleUserCreation() {
  console.log("🔍 [DEBUG] Test de création d'utilisateurs multiples\n");

  for (let i = 1; i <= 5; i++) {
    const testEmail = `debug-multi-${i}-${randomBytes(4).toString(
      "hex"
    )}@example.com`;
    const testPassword = "DebugTest123";

    console.log(`📝 Création utilisateur ${i}: ${testEmail}`);
    const registerResponse = await makeRequest("POST", "/auth/register", {
      name: `Debug Multi User ${i}`,
      email: testEmail,
      password: testPassword,
    });

    console.log(`📝 Réponse register ${i}:`, registerResponse.statusCode);
    if (registerResponse.statusCode !== 201) {
      console.log(`❌ Échec création utilisateur ${i}:`, registerResponse.body);
    } else {
      console.log(`✅ Utilisateur ${i} créé avec succès`);
    }
    console.log();
  }
}

/**
 * 🎯 Point d'entrée principal
 */
async function main() {
  try {
    console.log("🔥 Démarrage des tests de diagnostic\n");

    await debugDeleteAccountAuth();
    await debugMultipleUserCreation();

    console.log("✅ Tests de diagnostic terminés");
  } catch (error) {
    console.error("❌ Erreur lors des tests de diagnostic:", error.message);
    process.exit(1);
  }
}

// Lancement du script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`Erreur lors de l'exécution : ${error.message}`);
    process.exit(1);
  });
}
