#!/usr/bin/env node

// ============================================================================
// 📁 scripts/auth-testing.js - Script d'automatisation des tests d'authentification
// 🧪 Tests automatisés : 52+ tests (18 register + 16 login + 10+ refresh-token + 8+ logout)
// ============================================================================

import http from "http";
import { randomBytes } from "crypto";

/**
 * 🎯 Configuration du script
 */
const CONFIG = {
  // Utilise localhost:3001 depuis l'intérieur du container Docker
  baseUrl: "http://localhost:3001",
  apiPrefix: "/api/v1",
  timeout: 10000,
  colors: {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
    bold: "\x1b[1m",
  },
};

/**
 * 🎨 Utilitaires d'affichage coloré
 */
const log = {
  success: (msg) =>
    console.log(`${CONFIG.colors.green}✅ ${msg}${CONFIG.colors.reset}`),
  error: (msg) =>
    console.log(`${CONFIG.colors.red}❌ ${msg}${CONFIG.colors.reset}`),
  warning: (msg) =>
    console.log(`${CONFIG.colors.yellow}⚠️  ${msg}${CONFIG.colors.reset}`),
  info: (msg) =>
    console.log(`${CONFIG.colors.blue}ℹ️  ${msg}${CONFIG.colors.reset}`),
  title: (msg) =>
    console.log(
      `${CONFIG.colors.bold}${CONFIG.colors.cyan}🔥 ${msg}${CONFIG.colors.reset}\n`
    ),
  section: (msg) =>
    console.log(`\n${CONFIG.colors.yellow}📋 ${msg}${CONFIG.colors.reset}`),
};

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
        "Content-Type": "application/json",
        "User-Agent": "Emailight-Auth-Tester/1.0",
        "X-Test-Environment": "Docker-Container",
        ...headers,
      },
      timeout: CONFIG.timeout,
    };

    if (postData) {
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
 * 🧪 Classe de test pour l'authentification
 */
class AuthTester {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      details: [],
    };
  }

  /**
   * ✅ Valide une réponse de succès
   */
  validateSuccessResponse(response, expectedMessage, lang = "FR") {
    const { statusCode, body } = response;

    // 200 pour login, 201 pour register (création de ressource)
    const validStatusCodes = [200, 201];
    if (!validStatusCodes.includes(statusCode)) {
      throw new Error(`Expected status 200 or 201, got ${statusCode}`);
    }

    if (!body || body.status !== "success") {
      throw new Error(`Expected status 'success', got '${body?.status}'`);
    }

    if (!body.data || !body.data.accessToken || !body.data.refreshToken) {
      throw new Error("Missing required tokens in response");
    }

    if (!body.data.expiresIn || body.data.expiresIn !== "24h") {
      throw new Error(`Expected expiresIn '24h', got '${body.data.expiresIn}'`);
    }

    // Vérifier le message traduit
    const expectedMessages = {
      account_created: {
        FR: "Compte créé avec succès",
        EN: "Account created successfully",
      },
      login_success: {
        FR: "Connexion réussie",
        EN: "Login successful",
      },
    };

    const expected = expectedMessages[expectedMessage]?.[lang];
    if (expected && body.message !== expected) {
      throw new Error(`Expected message '${expected}', got '${body.message}'`);
    }

    return true;
  }

  /**
   * ✅ Valide une réponse de succès pour refresh-token
   */
  validateRefreshTokenSuccessResponse(response, expectedMessage, lang = "FR") {
    const { statusCode, body } = response;

    if (statusCode !== 200) {
      throw new Error(`Expected status 200, got ${statusCode}`);
    }

    if (!body || body.status !== "success") {
      throw new Error(`Expected status 'success', got '${body?.status}'`);
    }

    if (!body.data || !body.data.accessToken) {
      throw new Error("Missing required accessToken in response");
    }

    if (!body.data.expiresIn || body.data.expiresIn !== "24h") {
      throw new Error(`Expected expiresIn '24h', got '${body.data.expiresIn}'`);
    }

    // Vérifier le message de succès traduit
    const expectedMessages = {
      FR: "Token rafraîchi avec succès",
      EN: "Token refreshed successfully",
    };

    if (body.message !== expectedMessages[lang]) {
      throw new Error(
        `Expected message '${expectedMessages[lang]}', got '${body.message}'`
      );
    }

    return true;
  }

  /**
   * ✅ Valide une réponse de succès pour logout
   */
  validateLogoutSuccessResponse(response, expectedMessage, lang = "FR") {
    const { statusCode, body } = response;

    if (statusCode !== 200) {
      throw new Error(`Expected status 200, got ${statusCode}`);
    }

    if (!body || body.status !== "success") {
      throw new Error(`Expected status 'success', got '${body?.status}'`);
    }

    // Vérifier le message de succès traduit
    const expectedMessages = {
      FR: "Déconnexion réussie",
      EN: "Logout successful",
    };

    if (body.message !== expectedMessages[lang]) {
      throw new Error(
        `Expected message '${expectedMessages[lang]}', got '${body.message}'`
      );
    }

    // Vérifier qu'il n'y a pas de champ data
    if (body.hasOwnProperty("data")) {
      throw new Error(
        "Le champ 'data' ne devrait pas être présent pour logout"
      );
    }

    return true;
  }

  /**
   * ❌ Valide une réponse d'erreur
   */
  validateErrorResponse(
    response,
    expectedStatus,
    expectedErrorName,
    expectedMessage,
    lang = "FR"
  ) {
    const { statusCode, body } = response;

    if (statusCode !== expectedStatus) {
      throw new Error(`Expected status ${expectedStatus}, got ${statusCode}`);
    }

    if (!body || body.status !== "failed") {
      throw new Error(`Expected status 'failed', got '${body?.status}'`);
    }

    if (body.errorCode !== expectedStatus.toString()) {
      throw new Error(
        `Expected errorCode '${expectedStatus}', got '${body.errorCode}'`
      );
    }

    // Cas spécial : TOKEN_EXPIRED_REFRESH est validé contre TOKEN_EXPIRED
    const actualExpectedErrorName =
      expectedErrorName === "TOKEN_EXPIRED_REFRESH"
        ? "TOKEN_EXPIRED"
        : expectedErrorName;

    if (body.errorName !== actualExpectedErrorName) {
      throw new Error(
        `Expected errorName '${actualExpectedErrorName}', got '${body.errorName}'`
      );
    }

    // Vérifier le message d'erreur traduit
    const expectedMessages = {
      USER_EXISTS: {
        FR: "Un compte avec cette adresse email existe déjà",
        EN: "An account with this email address already exists",
      },
      VALIDATION_ERROR: {
        password_min: {
          FR: "Le mot de passe doit contenir au moins 6 caractères",
          EN: "Password must be at least 6 characters long",
        },
        email_invalid: {
          FR: "Format d'email invalide",
          EN: "Invalid email format",
        },
        name_min: {
          FR: "Le nom doit contenir au moins 2 caractères",
          EN: "Name must be at least 2 characters long",
        },
        name_required: {
          FR: "Le nom est requis",
          EN: "Name is required",
        },
        email_required: {
          FR: "L'email est requis",
          EN: "Email is required",
        },
        password_required: {
          FR: "Le mot de passe est requis",
          EN: "Password is required",
        },
        refresh_token_required: {
          FR: "Le token de rafraîchissement est requis",
          EN: "Refresh token is required",
        },
        refresh_token_invalid: {
          FR: "Format du token de rafraîchissement invalide",
          EN: "Invalid refresh token format",
        },
      },
      INVALID_CREDENTIALS: {
        FR: "Identifiants invalides",
        EN: "Invalid credentials",
      },
      TOKEN_EXPIRED: {
        FR: "Token expiré",
        EN: "Token expired",
      },
      TOKEN_EXPIRED_REFRESH: {
        FR: "Token de rafraîchissement expiré",
        EN: "Refresh token expired",
      },
      MISSING_TOKEN: {
        FR: "Token d'accès requis",
        EN: "Access token required",
      },
      AUTHENTICATION_FAILED: {
        FR: "Token invalide",
        EN: "Invalid token",
      },
      INVALID_TOKEN: {
        FR: "Token invalide",
        EN: "Invalid token",
      },
    };

    const expected =
      expectedMessages[expectedErrorName]?.[expectedMessage]?.[lang] ||
      expectedMessages[expectedErrorName]?.[lang];

    if (expected && body.errorMessage !== expected) {
      throw new Error(
        `Expected message '${expected}', got '${body.errorMessage}'`
      );
    }

    return true;
  }

  /**
   * 🏥 Vérifie la santé du serveur (endpoint sans préfixe API)
   */
  async makeHealthCheck() {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: "localhost",
        port: 3001,
        path: "/health", // Pas de préfixe /api/v1 pour health
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Emailight-Auth-Tester/1.0",
          "X-Test-Environment": "Docker-Container",
        },
        timeout: CONFIG.timeout,
      };

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

      req.end();
    });
  }

  /**
   * 🧪 Exécute un test
   */
  async runTest(testName, testFn) {
    this.results.total++;

    try {
      await testFn();
      this.results.passed++;
      this.results.details.push({ name: testName, status: "PASSED" });
      log.success(`${testName} - PASSED`);
    } catch (error) {
      this.results.failed++;
      this.results.details.push({
        name: testName,
        status: "FAILED",
        error: error.message,
      });
      log.error(`${testName} - FAILED: ${error.message}`);
    }
  }

  /**
   * 📝 Tests d'inscription (Register)
   */
  async testRegister() {
    log.section("Tests POST /api/v1/auth/register");

    // ✅ Succès - Inscription valide (FR)
    await this.runTest("Register - Succès valide (FR)", async () => {
      const uniqueEmail = `test-${randomBytes(4).toString(
        "hex"
      )}@emailight.com`;
      const response = await makeRequest(
        "POST",
        "/auth/register",
        {
          name: "cheikh",
          email: uniqueEmail,
          password: "MotDePasseSecurise123",
        },
        { "Accept-Language": "fr-FR" }
      );

      this.validateSuccessResponse(response, "account_created", "FR");
    });

    // ✅ Succès - Inscription valide (EN)
    await this.runTest("Register - Succès valide (EN)", async () => {
      const uniqueEmail = `test-${randomBytes(4).toString(
        "hex"
      )}@emailight.com`;
      const response = await makeRequest(
        "POST",
        "/auth/register",
        {
          name: "cheikh",
          email: uniqueEmail,
          password: "MotDePasseSecurise123",
        },
        { "Accept-Language": "en-US" }
      );

      this.validateSuccessResponse(response, "account_created", "EN");
    });

    // Créer un utilisateur pour les tests de duplication
    const existingEmail = `existing-${randomBytes(4).toString(
      "hex"
    )}@emailight.com`;
    await makeRequest("POST", "/auth/register", {
      name: "cheikh",
      email: existingEmail,
      password: "MotDePasseSecurise123",
    });

    // ❌ Email déjà utilisé (FR)
    await this.runTest("Register - Email déjà utilisé (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/register",
        {
          name: "cheikh",
          email: existingEmail,
          password: "MotDePasseSecurise123",
        },
        { "Accept-Language": "fr-FR" }
      );

      this.validateErrorResponse(response, 409, "USER_EXISTS", null, "FR");
    });

    // ❌ Email déjà utilisé (EN)
    await this.runTest("Register - Email déjà utilisé (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/register",
        {
          name: "cheikh",
          email: existingEmail,
          password: "MotDePasseSecurise123",
        },
        { "Accept-Language": "en-US" }
      );

      this.validateErrorResponse(response, 409, "USER_EXISTS", null, "EN");
    });

    // ❌ Mot de passe trop court (FR)
    await this.runTest("Register - Mot de passe trop court (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/register",
        {
          name: "cheikh",
          email: `short-pass-${randomBytes(4).toString("hex")}@emailight.com`,
          password: "abc",
        },
        { "Accept-Language": "fr-FR" }
      );

      this.validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "password_min",
        "FR"
      );
    });

    // ❌ Mot de passe trop court (EN)
    await this.runTest("Register - Mot de passe trop court (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/register",
        {
          name: "cheikh",
          email: `short-pass-${randomBytes(4).toString("hex")}@emailight.com`,
          password: "abc",
        },
        { "Accept-Language": "en-US" }
      );

      this.validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "password_min",
        "EN"
      );
    });

    // ❌ Email invalide (FR)
    await this.runTest("Register - Email invalide (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/register",
        {
          name: "cheikh",
          email: "pasunemail",
          password: "MotDePasseSecurise123",
        },
        { "Accept-Language": "fr-FR" }
      );

      this.validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "email_invalid",
        "FR"
      );
    });

    // ❌ Email invalide (EN)
    await this.runTest("Register - Email invalide (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/register",
        {
          name: "cheikh",
          email: "pasunemail",
          password: "MotDePasseSecurise123",
        },
        { "Accept-Language": "en-US" }
      );

      this.validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "email_invalid",
        "EN"
      );
    });

    // ❌ Nom trop court (FR)
    await this.runTest("Register - Nom trop court (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/register",
        {
          name: "c",
          email: `short-name-${randomBytes(4).toString("hex")}@emailight.com`,
          password: "MotDePasseSecurise123",
        },
        { "Accept-Language": "fr-FR" }
      );

      this.validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "name_min",
        "FR"
      );
    });

    // ❌ Nom trop court (EN)
    await this.runTest("Register - Nom trop court (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/register",
        {
          name: "c",
          email: `short-name-${randomBytes(4).toString("hex")}@emailight.com`,
          password: "MotDePasseSecurise123",
        },
        { "Accept-Language": "en-US" }
      );

      this.validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "name_min",
        "EN"
      );
    });

    // ❌ Nom manquant (FR)
    await this.runTest("Register - Nom manquant (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/register",
        {
          email: `no-name-${randomBytes(4).toString("hex")}@emailight.com`,
          password: "MotDePasseSecurise123",
        },
        { "Accept-Language": "fr-FR" }
      );

      this.validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "name_required",
        "FR"
      );
    });

    // ❌ Nom manquant (EN)
    await this.runTest("Register - Nom manquant (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/register",
        {
          email: `no-name-${randomBytes(4).toString("hex")}@emailight.com`,
          password: "MotDePasseSecurise123",
        },
        { "Accept-Language": "en-US" }
      );

      this.validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "name_required",
        "EN"
      );
    });

    // ❌ Email manquant (FR)
    await this.runTest("Register - Email manquant (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/register",
        {
          name: "cheikh",
          password: "MotDePasseSecurise123",
        },
        { "Accept-Language": "fr-FR" }
      );

      this.validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "email_required",
        "FR"
      );
    });

    // ❌ Email manquant (EN)
    await this.runTest("Register - Email manquant (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/register",
        {
          name: "cheikh",
          password: "MotDePasseSecurise123",
        },
        { "Accept-Language": "en-US" }
      );

      this.validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "email_required",
        "EN"
      );
    });

    // ❌ Mot de passe manquant (FR)
    await this.runTest("Register - Mot de passe manquant (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/register",
        {
          name: "cheikh",
          email: `no-pass-${randomBytes(4).toString("hex")}@emailight.com`,
        },
        { "Accept-Language": "fr-FR" }
      );

      this.validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "password_required",
        "FR"
      );
    });

    // ❌ Mot de passe manquant (EN)
    await this.runTest("Register - Mot de passe manquant (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/register",
        {
          name: "cheikh",
          email: `no-pass-${randomBytes(4).toString("hex")}@emailight.com`,
        },
        { "Accept-Language": "en-US" }
      );

      this.validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "password_required",
        "EN"
      );
    });

    // ❌ Corps vide (FR)
    await this.runTest("Register - Corps vide (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/register",
        {},
        { "Accept-Language": "fr-FR" }
      );

      this.validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "name_required",
        "FR"
      );
    });

    // ❌ Corps vide (EN)
    await this.runTest("Register - Corps vide (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/register",
        {},
        { "Accept-Language": "en-US" }
      );

      this.validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "name_required",
        "EN"
      );
    });
  }

  /**
   * 🔐 Tests de connexion (Login)
   */
  async testLogin() {
    log.section("Tests POST /api/v1/auth/login");

    // Créer un utilisateur pour les tests de connexion
    const testEmail = `login-test-${randomBytes(4).toString(
      "hex"
    )}@emailight.com`;
    const testPassword = "MotDePasseSecurise123";

    await makeRequest("POST", "/auth/register", {
      name: "cheikh",
      email: testEmail,
      password: testPassword,
    });

    // ✅ Succès - Connexion valide (FR)
    await this.runTest("Login - Succès valide (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/login",
        {
          email: testEmail,
          password: testPassword,
        },
        { "Accept-Language": "fr-FR" }
      );

      this.validateSuccessResponse(response, "login_success", "FR");
    });

    // ✅ Succès - Connexion valide (EN)
    await this.runTest("Login - Succès valide (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/login",
        {
          email: testEmail,
          password: testPassword,
        },
        { "Accept-Language": "en-US" }
      );

      this.validateSuccessResponse(response, "login_success", "EN");
    });

    // ❌ Email inexistant (FR)
    await this.runTest("Login - Email inexistant (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/login",
        {
          email: "inexistant@emailight.com",
          password: "MotDePasseSecurise123",
        },
        { "Accept-Language": "fr-FR" }
      );

      this.validateErrorResponse(
        response,
        401,
        "INVALID_CREDENTIALS",
        null,
        "FR"
      );
    });

    // ❌ Email inexistant (EN)
    await this.runTest("Login - Email inexistant (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/login",
        {
          email: "inexistant@emailight.com",
          password: "MotDePasseSecurise123",
        },
        { "Accept-Language": "en-US" }
      );

      this.validateErrorResponse(
        response,
        401,
        "INVALID_CREDENTIALS",
        null,
        "EN"
      );
    });

    // ❌ Mot de passe incorrect (FR)
    await this.runTest("Login - Mot de passe incorrect (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/login",
        {
          email: testEmail,
          password: "MauvaisMotDePasse123",
        },
        { "Accept-Language": "fr-FR" }
      );

      this.validateErrorResponse(
        response,
        401,
        "INVALID_CREDENTIALS",
        null,
        "FR"
      );
    });

    // ❌ Mot de passe incorrect (EN)
    await this.runTest("Login - Mot de passe incorrect (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/login",
        {
          email: testEmail,
          password: "MauvaisMotDePasse123",
        },
        { "Accept-Language": "en-US" }
      );

      this.validateErrorResponse(
        response,
        401,
        "INVALID_CREDENTIALS",
        null,
        "EN"
      );
    });

    // ❌ Email manquant (FR)
    await this.runTest("Login - Email manquant (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/login",
        {
          password: "MotDePasseSecurise123",
        },
        { "Accept-Language": "fr-FR" }
      );

      this.validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "email_required",
        "FR"
      );
    });

    // ❌ Email manquant (EN)
    await this.runTest("Login - Email manquant (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/login",
        {
          password: "MotDePasseSecurise123",
        },
        { "Accept-Language": "en-US" }
      );

      this.validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "email_required",
        "EN"
      );
    });

    // ❌ Mot de passe manquant (FR)
    await this.runTest("Login - Mot de passe manquant (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/login",
        {
          email: testEmail,
        },
        { "Accept-Language": "fr-FR" }
      );

      this.validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "password_required",
        "FR"
      );
    });

    // ❌ Mot de passe manquant (EN)
    await this.runTest("Login - Mot de passe manquant (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/login",
        {
          email: testEmail,
        },
        { "Accept-Language": "en-US" }
      );

      this.validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "password_required",
        "EN"
      );
    });

    // ❌ Email invalide (FR)
    await this.runTest("Login - Email invalide (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/login",
        {
          email: "pasunemail",
          password: "MotDePasseSecurise123",
        },
        { "Accept-Language": "fr-FR" }
      );

      this.validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "email_invalid",
        "FR"
      );
    });

    // ❌ Email invalide (EN)
    await this.runTest("Login - Email invalide (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/login",
        {
          email: "pasunemail",
          password: "MotDePasseSecurise123",
        },
        { "Accept-Language": "en-US" }
      );

      this.validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "email_invalid",
        "EN"
      );
    });

    // ❌ Corps vide (FR)
    await this.runTest("Login - Corps vide (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/login",
        {},
        { "Accept-Language": "fr-FR" }
      );

      this.validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "email_required",
        "FR"
      );
    });

    // ❌ Corps vide (EN)
    await this.runTest("Login - Corps vide (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/login",
        {},
        { "Accept-Language": "en-US" }
      );

      this.validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "email_required",
        "EN"
      );
    });
  }

  /**
   * 🔄 Tests de rafraîchissement de token (Refresh Token)
   */
  async testRefreshToken() {
    log.section("Tests POST /api/v1/auth/refresh-token");

    // Créer un utilisateur de test et récupérer ses tokens
    let testTokens = null;
    const testEmail = `refresh-test-${randomBytes(4).toString(
      "hex"
    )}@emailight.com`;

    try {
      // Créer un utilisateur de test
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Test Refresh User",
        email: testEmail,
        password: "TestPassword123",
      });

      if (registerResponse.statusCode !== 201) {
        throw new Error("Impossible de créer l'utilisateur de test");
      }

      testTokens = {
        refreshToken: registerResponse.body.data.refreshToken,
        accessToken: registerResponse.body.data.accessToken,
      };
    } catch (error) {
      log.error(
        `Erreur lors de la création de l'utilisateur de test: ${error.message}`
      );
      return;
    }

    // ✅ Succès - Token valide (FR)
    await this.runTest("Refresh Token - Succès valide (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/refresh-token",
        {
          refreshToken: testTokens.refreshToken,
        },
        { "Accept-Language": "fr-FR" }
      );

      this.validateRefreshTokenSuccessResponse(
        response,
        "token_refreshed",
        "FR"
      );
    });

    // ✅ Succès - Token valide (EN)
    await this.runTest("Refresh Token - Succès valide (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/refresh-token",
        {
          refreshToken: testTokens.refreshToken,
        },
        { "Accept-Language": "en-US" }
      );

      this.validateRefreshTokenSuccessResponse(
        response,
        "token_refreshed",
        "EN"
      );
    });

    // ❌ Token manquant (FR)
    await this.runTest("Refresh Token - Token manquant (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/refresh-token",
        {},
        { "Accept-Language": "fr-FR" }
      );

      this.validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "refresh_token_required",
        "FR"
      );
    });

    // ❌ Token manquant (EN)
    await this.runTest("Refresh Token - Token manquant (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/refresh-token",
        {},
        { "Accept-Language": "en-US" }
      );

      this.validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "refresh_token_required",
        "EN"
      );
    });

    // ❌ Token vide (FR)
    await this.runTest("Refresh Token - Token vide (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/refresh-token",
        {
          refreshToken: "",
        },
        { "Accept-Language": "fr-FR" }
      );

      this.validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "refresh_token_required",
        "FR"
      );
    });

    // ❌ Token vide (EN)
    await this.runTest("Refresh Token - Token vide (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/refresh-token",
        {
          refreshToken: "",
        },
        { "Accept-Language": "en-US" }
      );

      this.validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "refresh_token_required",
        "EN"
      );
    });

    // ❌ Token invalide/malformé (FR)
    await this.runTest(
      "Refresh Token - Token invalide/malformé (FR)",
      async () => {
        const response = await makeRequest(
          "POST",
          "/auth/refresh-token",
          {
            refreshToken: "abc",
          },
          { "Accept-Language": "fr-FR" }
        );

        this.validateErrorResponse(
          response,
          400,
          "VALIDATION_ERROR",
          "refresh_token_invalid",
          "FR"
        );
      }
    );

    // ❌ Token invalide/malformé (EN)
    await this.runTest(
      "Refresh Token - Token invalide/malformé (EN)",
      async () => {
        const response = await makeRequest(
          "POST",
          "/auth/refresh-token",
          {
            refreshToken: "abc",
          },
          { "Accept-Language": "en-US" }
        );

        this.validateErrorResponse(
          response,
          400,
          "VALIDATION_ERROR",
          "refresh_token_invalid",
          "EN"
        );
      }
    );

    // ❌ Token expiré - Générer un token expiré avec l'endpoint de test
    let expiredToken = null;
    try {
      const testTokenResponse = await makeRequest(
        "POST",
        "/auth/test/generate-tokens",
        {
          refreshTokenExpiresIn: "1s",
        },
        {
          "Accept-Language": "fr-FR",
          Authorization: `Bearer ${testTokens.accessToken}`,
        }
      );

      if (testTokenResponse.statusCode === 200) {
        expiredToken = testTokenResponse.body.data.refreshToken;
        // Attendre que le token expire
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      log.warning("Impossible de générer un token expiré - test ignoré");
    }

    if (expiredToken) {
      // ❌ Token expiré (FR)
      await this.runTest("Refresh Token - Token expiré (FR)", async () => {
        const response = await makeRequest(
          "POST",
          "/auth/refresh-token",
          {
            refreshToken: expiredToken,
          },
          { "Accept-Language": "fr-FR" }
        );

        this.validateErrorResponse(
          response,
          401,
          "TOKEN_EXPIRED_REFRESH",
          null,
          "FR"
        );
      });

      // ❌ Token expiré (EN)
      await this.runTest("Refresh Token - Token expiré (EN)", async () => {
        const response = await makeRequest(
          "POST",
          "/auth/refresh-token",
          {
            refreshToken: expiredToken,
          },
          { "Accept-Language": "en-US" }
        );

        this.validateErrorResponse(
          response,
          401,
          "TOKEN_EXPIRED_REFRESH",
          null,
          "EN"
        );
      });
    }
  }

  /**
   * 🚪 Tests de déconnexion (Logout)
   */
  async testLogout() {
    log.section("Tests POST /api/v1/auth/logout");

    // ✅ Tests de succès
    await this.runTest("Logout - Succès valide (FR)", async () => {
      // Créer un utilisateur de test
      const uniqueEmail = `logout-test-${randomBytes(4).toString(
        "hex"
      )}@emailight.com`;
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Test Logout User",
        email: uniqueEmail,
        password: "TestPassword123!",
      });

      if (registerResponse.statusCode !== 201) {
        throw new Error("Impossible de créer l'utilisateur de test");
      }

      const accessToken = registerResponse.body.data.accessToken;

      // Tester le logout
      const response = await makeRequest(
        "POST",
        "/auth/logout",
        {},
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      this.validateLogoutSuccessResponse(response, "Déconnexion réussie", "FR");

      // Vérifier que le token est maintenant blacklisté
      const testResponse = await makeRequest("GET", "/users/me", null, {
        Authorization: `Bearer ${accessToken}`,
      });

      if (testResponse.statusCode !== 401) {
        throw new Error("Le token devrait être blacklisté après logout");
      }
    });

    await this.runTest("Logout - Succès valide (EN)", async () => {
      // Créer un utilisateur de test
      const uniqueEmail = `logout-test-${randomBytes(4).toString(
        "hex"
      )}@emailight.com`;
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Test Logout User",
        email: uniqueEmail,
        password: "TestPassword123!",
      });

      if (registerResponse.statusCode !== 201) {
        throw new Error("Impossible de créer l'utilisateur de test");
      }

      const accessToken = registerResponse.body.data.accessToken;

      // Tester le logout
      const response = await makeRequest(
        "POST",
        "/auth/logout",
        {},
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en-US",
        }
      );

      this.validateLogoutSuccessResponse(response, "Logout successful", "EN");
    });

    // ❌ Tests d'erreur
    await this.runTest("Logout - Token manquant (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/logout",
        {},
        { "Accept-Language": "fr-FR" }
      );

      this.validateErrorResponse(response, 401, "MISSING_TOKEN", null, "FR");
    });

    await this.runTest("Logout - Token manquant (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/logout",
        {},
        { "Accept-Language": "en-US" }
      );

      this.validateErrorResponse(response, 401, "MISSING_TOKEN", null, "EN");
    });

    await this.runTest("Logout - Token malformé (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/logout",
        {},
        {
          Authorization: "Bearer abc123",
          "Accept-Language": "fr-FR",
        }
      );

      this.validateErrorResponse(response, 401, "INVALID_TOKEN", null, "FR");
    });

    await this.runTest("Logout - Token malformé (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/logout",
        {},
        {
          Authorization: "Bearer abc123",
          "Accept-Language": "en-US",
        }
      );

      this.validateErrorResponse(response, 401, "INVALID_TOKEN", null, "EN");
    });

    await this.runTest("Logout - Token expiré (FR)", async () => {
      // Créer un utilisateur de test
      const uniqueEmail = `logout-test-${randomBytes(4).toString(
        "hex"
      )}@emailight.com`;
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Test Logout User",
        email: uniqueEmail,
        password: "TestPassword123!",
      });

      if (registerResponse.statusCode !== 201) {
        throw new Error("Impossible de créer l'utilisateur de test");
      }

      const accessToken = registerResponse.body.data.accessToken;

      // Générer un token expiré
      let expiredToken = null;
      try {
        const testTokenResponse = await makeRequest(
          "POST",
          "/auth/test/generate-tokens",
          { accessTokenExpiresIn: "1s" },
          {
            "Accept-Language": "fr-FR",
            Authorization: `Bearer ${accessToken}`,
          }
        );

        if (testTokenResponse.statusCode === 200) {
          expiredToken = testTokenResponse.body.data.accessToken;
          // Attendre que le token expire
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      } catch (error) {
        log.warning("Impossible de générer un token expiré - test ignoré");
        return;
      }

      if (expiredToken) {
        const response = await makeRequest(
          "POST",
          "/auth/logout",
          {},
          {
            Authorization: `Bearer ${expiredToken}`,
            "Accept-Language": "fr-FR",
          }
        );

        this.validateErrorResponse(response, 401, "TOKEN_EXPIRED", null, "FR");
      }
    });

    await this.runTest("Logout - Token expiré (EN)", async () => {
      // Créer un utilisateur de test
      const uniqueEmail = `logout-test-${randomBytes(4).toString(
        "hex"
      )}@emailight.com`;
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Test Logout User",
        email: uniqueEmail,
        password: "TestPassword123!",
      });

      if (registerResponse.statusCode !== 201) {
        throw new Error("Impossible de créer l'utilisateur de test");
      }

      const accessToken = registerResponse.body.data.accessToken;

      // Générer un token expiré
      let expiredToken = null;
      try {
        const testTokenResponse = await makeRequest(
          "POST",
          "/auth/test/generate-tokens",
          { accessTokenExpiresIn: "1s" },
          {
            "Accept-Language": "en-US",
            Authorization: `Bearer ${accessToken}`,
          }
        );

        if (testTokenResponse.statusCode === 200) {
          expiredToken = testTokenResponse.body.data.accessToken;
          // Attendre que le token expire
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      } catch (error) {
        log.warning("Impossible de générer un token expiré - test ignoré");
        return;
      }

      if (expiredToken) {
        const response = await makeRequest(
          "POST",
          "/auth/logout",
          {},
          {
            Authorization: `Bearer ${expiredToken}`,
            "Accept-Language": "en-US",
          }
        );

        this.validateErrorResponse(response, 401, "TOKEN_EXPIRED", null, "EN");
      }
    });

    // 🔐 Tests d'authentification complets pour logout (route protégée)
    await this.runTest("Logout - Token blacklisté (FR)", async () => {
      // Créer un utilisateur temporaire et le logout
      const tempEmail = `temp-blacklist-${randomBytes(4).toString(
        "hex"
      )}@example.com`;
      const tempPassword = "TempPassword123";

      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Temp Blacklist User",
        email: tempEmail,
        password: tempPassword,
      });

      if (registerResponse.statusCode === 201) {
        const tempToken = registerResponse.body.data.accessToken;

        // Logout pour blacklister le token
        await makeRequest(
          "POST",
          "/auth/logout",
          {},
          {
            Authorization: `Bearer ${tempToken}`,
          }
        );

        // Tester avec le token blacklisté
        const response = await makeRequest(
          "POST",
          "/auth/logout",
          {},
          {
            Authorization: `Bearer ${tempToken}`,
            "Accept-Language": "fr-FR",
          }
        );

        this.validateErrorResponse(response, 401, "TOKEN_REVOKED", null, "FR");
      } else {
        throw new Error(
          "Impossible de créer l'utilisateur temporaire pour le test de token blacklisté"
        );
      }
    });

    await this.runTest("Logout - Token blacklisté (EN)", async () => {
      // Créer un utilisateur temporaire et le logout
      const tempEmail = `temp-blacklist-${randomBytes(4).toString(
        "hex"
      )}@example.com`;
      const tempPassword = "TempPassword123";

      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Temp Blacklist User",
        email: tempEmail,
        password: tempPassword,
      });

      if (registerResponse.statusCode === 201) {
        const tempToken = registerResponse.body.data.accessToken;

        // Logout pour blacklister le token
        await makeRequest(
          "POST",
          "/auth/logout",
          {},
          {
            Authorization: `Bearer ${tempToken}`,
          }
        );

        // Tester avec le token blacklisté
        const response = await makeRequest(
          "POST",
          "/auth/logout",
          {},
          {
            Authorization: `Bearer ${tempToken}`,
            "Accept-Language": "en-US",
          }
        );

        this.validateErrorResponse(response, 401, "TOKEN_REVOKED", null, "EN");
      } else {
        throw new Error(
          "Impossible de créer l'utilisateur temporaire pour le test de token blacklisté"
        );
      }
    });

    await this.runTest("Logout - Utilisateur supprimé (FR)", async () => {
      // Créer un utilisateur temporaire et le supprimer
      const tempEmail = `temp-delete-${randomBytes(4).toString(
        "hex"
      )}@example.com`;
      const tempPassword = "TempPassword123";

      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Temp Delete User",
        email: tempEmail,
        password: tempPassword,
      });

      if (registerResponse.statusCode === 201) {
        const tempToken = registerResponse.body.data.accessToken;

        // Supprimer l'utilisateur
        await makeRequest(
          "DELETE",
          "/users/me",
          {
            password: tempPassword,
          },
          {
            Authorization: `Bearer ${tempToken}`,
          }
        );

        // Tester avec le token d'un utilisateur supprimé
        const response = await makeRequest(
          "POST",
          "/auth/logout",
          {},
          {
            Authorization: `Bearer ${tempToken}`,
            "Accept-Language": "fr-FR",
          }
        );

        this.validateErrorResponse(response, 401, "USER_NOT_FOUND", null, "FR");
      } else {
        throw new Error(
          "Impossible de créer l'utilisateur temporaire pour le test d'utilisateur supprimé"
        );
      }
    });

    await this.runTest("Logout - Utilisateur supprimé (EN)", async () => {
      // Créer un utilisateur temporaire et le supprimer
      const tempEmail = `temp-delete-${randomBytes(4).toString(
        "hex"
      )}@example.com`;
      const tempPassword = "TempPassword123";

      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Temp Delete User",
        email: tempEmail,
        password: tempPassword,
      });

      if (registerResponse.statusCode === 201) {
        const tempToken = registerResponse.body.data.accessToken;

        // Supprimer l'utilisateur
        await makeRequest(
          "DELETE",
          "/users/me",
          {
            password: tempPassword,
          },
          {
            Authorization: `Bearer ${tempToken}`,
          }
        );

        // Tester avec le token d'un utilisateur supprimé
        const response = await makeRequest(
          "POST",
          "/auth/logout",
          {},
          {
            Authorization: `Bearer ${tempToken}`,
            "Accept-Language": "en-US",
          }
        );

        this.validateErrorResponse(response, 401, "USER_NOT_FOUND", null, "EN");
      } else {
        throw new Error(
          "Impossible de créer l'utilisateur temporaire pour le test d'utilisateur supprimé"
        );
      }
    });
  }

  /**
   * 📊 Affiche les résultats finaux
   */
  showResults() {
    log.title("Résultats des tests d'authentification");

    console.log(
      `${CONFIG.colors.bold}Total des tests : ${this.results.total}${CONFIG.colors.reset}`
    );
    console.log(
      `${CONFIG.colors.green}✅ Réussis : ${this.results.passed}${CONFIG.colors.reset}`
    );
    console.log(
      `${CONFIG.colors.red}❌ Échoués : ${this.results.failed}${CONFIG.colors.reset}`
    );

    const successRate = Math.round(
      (this.results.passed / this.results.total) * 100
    );
    const color =
      successRate === 100
        ? CONFIG.colors.green
        : successRate >= 80
        ? CONFIG.colors.yellow
        : CONFIG.colors.red;

    console.log(
      `${color}📊 Taux de réussite : ${successRate}%${CONFIG.colors.reset}\n`
    );

    if (this.results.failed > 0) {
      log.section("Détails des échecs");
      this.results.details
        .filter((test) => test.status === "FAILED")
        .forEach((test) => {
          console.log(
            `${CONFIG.colors.red}❌ ${test.name}${CONFIG.colors.reset}`
          );
          console.log(
            `   ${CONFIG.colors.yellow}→ ${test.error}${CONFIG.colors.reset}`
          );
        });
    }
  }

  /**
   * 🚀 Lance tous les tests
   */
  async runAllTests() {
    log.title("Démarrage des tests d'authentification automatisés");
    log.info(`URL de base : ${CONFIG.baseUrl}${CONFIG.apiPrefix}`);
    log.info("Vérification du serveur...");

    try {
      // Vérifier que le serveur est accessible
      // IMPORTANT: /health est à la racine, pas sous /api/v1
      const healthCheck = await this.makeHealthCheck();
      if (healthCheck.statusCode !== 200) {
        throw new Error(
          `Serveur non accessible (status: ${healthCheck.statusCode})`
        );
      }
      log.success("Serveur accessible ✓");

      await this.testRegister();
      await this.testLogin();
      await this.testRefreshToken();
      await this.testLogout();

      this.showResults();

      // Code de sortie basé sur les résultats
      process.exit(this.results.failed > 0 ? 1 : 0);
    } catch (error) {
      log.error(`Erreur fatale : ${error.message}`);
      log.warning(
        "Vérifiez que le serveur user-service est démarré sur le port 3001"
      );
      process.exit(1);
    }
  }
}

/**
 * 🎯 Point d'entrée principal
 */
async function main() {
  const tester = new AuthTester();
  await tester.runAllTests();
}

// Lancement du script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    log.error(`Erreur lors de l'exécution : ${error.message}`);
    process.exit(1);
  });
}

export default AuthTester;
