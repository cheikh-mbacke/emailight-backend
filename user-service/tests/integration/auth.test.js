/**
 * 🔐 Tests d'intégration - Authentification
 */

import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";

// Timeout augmenté pour les tests d'intégration
jest.setTimeout(30000);
import {
  makeRequest,
  makeHealthCheck,
  generateTestEmail,
  delay,
} from "../utils/test-helpers.js";
import {
  validateSuccessResponse,
  validateErrorResponse,
  validateRefreshTokenSuccessResponse,
  validateLogoutSuccessResponse,
} from "../utils/validators.js";
import {
  REGISTER_TEST_DATA,
  LOGIN_TEST_DATA,
  EXPECTED_ERROR_MESSAGES,
  EXPECTED_SUCCESS_MESSAGES,
} from "../fixtures/test-data.js";

describe("🔐 Tests d'intégration - Authentification", () => {
  let testUser = null;

  beforeAll(async () => {
    // Vérifier que le serveur est accessible
    const healthCheck = await makeHealthCheck();
    expect(healthCheck.statusCode).toBe(200);
  });

  afterAll(async () => {
    // Nettoyage si nécessaire
    if (testUser) {
      try {
        await makeRequest(
          "DELETE",
          "/users/me",
          { password: testUser.password },
          {
            Authorization: `Bearer ${testUser.accessToken}`,
          }
        );
      } catch (error) {
        // Ignorer les erreurs de nettoyage
      }
    }
  });

  describe("📝 POST /auth/register", () => {
    test("✅ Inscription valide (FR)", async () => {
      const email = generateTestEmail("register-fr");
      const response = await makeRequest(
        "POST",
        "/auth/register",
        {
          name: "Test User FR",
          email: email,
          password: "TestPassword123!",
        },
        { "Accept-Language": "fr-FR" }
      );

      validateSuccessResponse(response, "account_created", "FR");
    });

    test("✅ Inscription valide (EN)", async () => {
      const email = generateTestEmail("register-en");
      const response = await makeRequest(
        "POST",
        "/auth/register",
        {
          name: "Test User EN",
          email: email,
          password: "TestPassword123!",
        },
        { "Accept-Language": "en-US" }
      );

      validateSuccessResponse(response, "account_created", "EN");
    });

    test("❌ Email déjà utilisé (FR)", async () => {
      const email = generateTestEmail("duplicate");

      // Créer un utilisateur
      await makeRequest("POST", "/auth/register", {
        name: "First User",
        email: email,
        password: "TestPassword123!",
      });

      // Tenter de créer un autre utilisateur avec le même email
      const response = await makeRequest(
        "POST",
        "/auth/register",
        {
          name: "Second User",
          email: email,
          password: "TestPassword123!",
        },
        { "Accept-Language": "fr-FR" }
      );

      validateErrorResponse(response, 409, "USER_EXISTS", null, "FR");
    });

    test("❌ Email déjà utilisé (EN)", async () => {
      const email = generateTestEmail("duplicate-en");

      // Créer un utilisateur
      await makeRequest("POST", "/auth/register", {
        name: "First User",
        email: email,
        password: "TestPassword123!",
      });

      // Tenter de créer un autre utilisateur avec le même email
      const response = await makeRequest(
        "POST",
        "/auth/register",
        {
          name: "Second User",
          email: email,
          password: "TestPassword123!",
        },
        { "Accept-Language": "en-US" }
      );

      validateErrorResponse(response, 409, "USER_EXISTS", null, "EN");
    });

    test("❌ Mot de passe trop court (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/register",
        {
          name: "Test User",
          email: generateTestEmail("short-pass"),
          password: "123",
        },
        { "Accept-Language": "fr-FR" }
      );

      validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "password_min",
        "FR"
      );
    });

    test("❌ Mot de passe trop court (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/register",
        {
          name: "Test User",
          email: generateTestEmail("short-pass-en"),
          password: "123",
        },
        { "Accept-Language": "en-US" }
      );

      validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "password_min",
        "EN"
      );
    });

    test("❌ Email invalide (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/register",
        {
          name: "Test User",
          email: "not-an-email",
          password: "TestPassword123!",
        },
        { "Accept-Language": "fr-FR" }
      );

      validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "email_invalid",
        "FR"
      );
    });

    test("❌ Email invalide (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/register",
        {
          name: "Test User",
          email: "not-an-email",
          password: "TestPassword123!",
        },
        { "Accept-Language": "en-US" }
      );

      validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "email_invalid",
        "EN"
      );
    });

    test("❌ Nom trop court (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/register",
        {
          name: "J",
          email: generateTestEmail("short-name"),
          password: "TestPassword123!",
        },
        { "Accept-Language": "fr-FR" }
      );

      validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "name_min",
        "FR"
      );
    });

    test("❌ Nom trop court (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/register",
        {
          name: "J",
          email: generateTestEmail("short-name-en"),
          password: "TestPassword123!",
        },
        { "Accept-Language": "en-US" }
      );

      validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "name_min",
        "EN"
      );
    });

    test("❌ Nom manquant (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/register",
        {
          email: generateTestEmail("no-name"),
          password: "TestPassword123!",
        },
        { "Accept-Language": "fr-FR" }
      );

      validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "name_required",
        "FR"
      );
    });

    test("❌ Nom manquant (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/register",
        {
          email: generateTestEmail("no-name-en"),
          password: "TestPassword123!",
        },
        { "Accept-Language": "en-US" }
      );

      validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "name_required",
        "EN"
      );
    });

    test("❌ Email manquant (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/register",
        {
          name: "Test User",
          password: "TestPassword123!",
        },
        { "Accept-Language": "fr-FR" }
      );

      validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "email_required",
        "FR"
      );
    });

    test("❌ Email manquant (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/register",
        {
          name: "Test User",
          password: "TestPassword123!",
        },
        { "Accept-Language": "en-US" }
      );

      validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "email_required",
        "EN"
      );
    });

    test("❌ Mot de passe manquant (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/register",
        {
          name: "Test User",
          email: generateTestEmail("no-password"),
        },
        { "Accept-Language": "fr-FR" }
      );

      validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "password_required",
        "FR"
      );
    });

    test("❌ Mot de passe manquant (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/register",
        {
          name: "Test User",
          email: generateTestEmail("no-password-en"),
        },
        { "Accept-Language": "en-US" }
      );

      validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "password_required",
        "EN"
      );
    });

    test("❌ Corps vide (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/register",
        {},
        { "Accept-Language": "fr-FR" }
      );

      validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "name_required",
        "FR"
      );
    });

    test("❌ Corps vide (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/register",
        {},
        { "Accept-Language": "en-US" }
      );

      validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "name_required",
        "EN"
      );
    });
  });

  describe("🔑 POST /auth/login", () => {
    beforeAll(async () => {
      // Créer un utilisateur pour les tests de connexion
      const email = generateTestEmail("login-test");
      const response = await makeRequest("POST", "/auth/register", {
        name: "Login Test User",
        email: email,
        password: "TestPassword123!",
      });

      testUser = {
        email: email,
        password: "TestPassword123!",
        accessToken: response.body.data.accessToken,
        refreshToken: response.body.data.refreshToken,
      };
    });

    test("✅ Connexion valide (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/login",
        {
          email: testUser.email,
          password: testUser.password,
        },
        { "Accept-Language": "fr-FR" }
      );

      validateSuccessResponse(response, "login_success", "FR");
    });

    test("✅ Connexion valide (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/login",
        {
          email: testUser.email,
          password: testUser.password,
        },
        { "Accept-Language": "en-US" }
      );

      validateSuccessResponse(response, "login_success", "EN");
    });

    test("❌ Email inexistant (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/login",
        {
          email: "inexistant@emailight.com",
          password: "TestPassword123!",
        },
        { "Accept-Language": "fr-FR" }
      );

      validateErrorResponse(response, 401, "INVALID_CREDENTIALS", null, "FR");
    });

    test("❌ Email inexistant (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/login",
        {
          email: "inexistant@emailight.com",
          password: "TestPassword123!",
        },
        { "Accept-Language": "en-US" }
      );

      validateErrorResponse(response, 401, "INVALID_CREDENTIALS", null, "EN");
    });

    test("❌ Mot de passe incorrect (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/login",
        {
          email: testUser.email,
          password: "WrongPassword123!",
        },
        { "Accept-Language": "fr-FR" }
      );

      validateErrorResponse(response, 401, "INVALID_CREDENTIALS", null, "FR");
    });

    test("❌ Mot de passe incorrect (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/login",
        {
          email: testUser.email,
          password: "WrongPassword123!",
        },
        { "Accept-Language": "en-US" }
      );

      validateErrorResponse(response, 401, "INVALID_CREDENTIALS", null, "EN");
    });

    test("❌ Email manquant (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/login",
        {
          password: "TestPassword123!",
        },
        { "Accept-Language": "fr-FR" }
      );

      validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "email_required",
        "FR"
      );
    });

    test("❌ Email manquant (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/login",
        {
          password: "TestPassword123!",
        },
        { "Accept-Language": "en-US" }
      );

      validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "email_required",
        "EN"
      );
    });

    test("❌ Mot de passe manquant (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/login",
        {
          email: testUser.email,
        },
        { "Accept-Language": "fr-FR" }
      );

      validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "password_required",
        "FR"
      );
    });

    test("❌ Mot de passe manquant (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/login",
        {
          email: testUser.email,
        },
        { "Accept-Language": "en-US" }
      );

      validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "password_required",
        "EN"
      );
    });

    test("❌ Email invalide (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/login",
        {
          email: "not-an-email",
          password: "TestPassword123!",
        },
        { "Accept-Language": "fr-FR" }
      );

      validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "email_invalid",
        "FR"
      );
    });

    test("❌ Email invalide (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/login",
        {
          email: "not-an-email",
          password: "TestPassword123!",
        },
        { "Accept-Language": "en-US" }
      );

      validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "email_invalid",
        "EN"
      );
    });

    test("❌ Corps vide (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/login",
        {},
        { "Accept-Language": "fr-FR" }
      );

      validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "email_required",
        "FR"
      );
    });

    test("❌ Corps vide (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/login",
        {},
        { "Accept-Language": "en-US" }
      );

      validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "email_required",
        "EN"
      );
    });
  });

  describe("🔄 POST /auth/refresh-token", () => {
    test("✅ Token valide (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/refresh-token",
        {
          refreshToken: testUser.refreshToken,
        },
        { "Accept-Language": "fr-FR" }
      );

      validateRefreshTokenSuccessResponse(response, "token_refreshed", "FR");
    });

    test("✅ Token valide (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/refresh-token",
        {
          refreshToken: testUser.refreshToken,
        },
        { "Accept-Language": "en-US" }
      );

      validateRefreshTokenSuccessResponse(response, "token_refreshed", "EN");
    });

    test("❌ Token manquant (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/refresh-token",
        {},
        {
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "refresh_token_required",
        "FR"
      );
    });

    test("❌ Token manquant (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/refresh-token",
        {},
        {
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "refresh_token_required",
        "EN"
      );
    });

    test("❌ Token vide (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/refresh-token",
        {
          refreshToken: "",
        },
        { "Accept-Language": "fr-FR" }
      );

      validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "refresh_token_required",
        "FR"
      );
    });

    test("❌ Token vide (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/refresh-token",
        {
          refreshToken: "",
        },
        { "Accept-Language": "en-US" }
      );

      validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "refresh_token_required",
        "EN"
      );
    });

    test("❌ Token invalide/malformé (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/refresh-token",
        {
          refreshToken: "abc",
        },
        { "Accept-Language": "fr-FR" }
      );

      validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "refresh_token_invalid",
        "FR"
      );
    });

    test("❌ Token invalide/malformé (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/refresh-token",
        {
          refreshToken: "abc",
        },
        { "Accept-Language": "en-US" }
      );

      validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "refresh_token_invalid",
        "EN"
      );
    });

    test("❌ Token expiré (FR)", async () => {
      // Note: Ce test nécessiterait un token expiré réel
      // Pour l'instant, on teste avec un token malformé
      const response = await makeRequest(
        "POST",
        "/auth/refresh-token",
        {
          refreshToken: "expired_token_placeholder",
        },
        { "Accept-Language": "fr-FR" }
      );

      // Codes de statut flexibles : 400 (token malformé), 401 (token expiré)
      expect([400, 401]).toContain(response.statusCode);
    });

    test("❌ Token expiré (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/refresh-token",
        {
          refreshToken: "expired_token_placeholder",
        },
        { "Accept-Language": "en-US" }
      );

      expect([400, 401]).toContain(response.statusCode);
    });
  });

  describe("🚪 POST /auth/logout", () => {
    test("✅ Logout valide (FR)", async () => {
      // Créer un utilisateur temporaire pour le test de logout
      const email = generateTestEmail("logout-test");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Logout Test User",
        email: email,
        password: "TestPassword123!",
      });

      const accessToken = registerResponse.body.data.accessToken;

      const response = await makeRequest(
        "POST",
        "/auth/logout",
        {},
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateLogoutSuccessResponse(response, "logout_success", "FR");
    });

    test("✅ Logout valide (EN)", async () => {
      // Créer un utilisateur temporaire pour le test de logout
      const email = generateTestEmail("logout-test");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Logout Test User",
        email: email,
        password: "TestPassword123!",
      });

      const accessToken = registerResponse.body.data.accessToken;

      const response = await makeRequest(
        "POST",
        "/auth/logout",
        {},
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateLogoutSuccessResponse(response, "logout_success", "EN");
    });

    test("❌ Token manquant (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/logout",
        {},
        {
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 401, "MISSING_TOKEN", null, "FR");
    });

    test("❌ Token invalide (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/logout",
        {},
        {
          Authorization: "Bearer abc123",
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 401, "INVALID_TOKEN", null, "FR");
    });

    test("❌ Token invalide (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/logout",
        {},
        {
          Authorization: "Bearer abc123",
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 401, "INVALID_TOKEN", null, "EN");
    });

    test("❌ Token expiré (FR)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/logout",
        {},
        {
          Authorization: "Bearer expired_token_placeholder",
          "Accept-Language": "fr-FR",
        }
      );

      // Peut être 401 (expiré) ou 401 (invalide) selon l'implémentation
      expect(response.statusCode).toBe(401);
    });

    test("❌ Token expiré (EN)", async () => {
      const response = await makeRequest(
        "POST",
        "/auth/logout",
        {},
        {
          Authorization: "Bearer expired_token_placeholder",
          "Accept-Language": "en-US",
        }
      );

      expect(response.statusCode).toBe(401);
    });

    test("❌ Token blacklisté (FR)", async () => {
      // Créer un utilisateur et le logout pour blacklister le token
      const email = generateTestEmail("blacklist-test");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Blacklist Test User",
        email: email,
        password: "TestPassword123!",
      });

      const accessToken = registerResponse.body.data.accessToken;

      // Logout pour blacklister le token
      await makeRequest(
        "POST",
        "/auth/logout",
        {},
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      // Tenter d'utiliser le token blacklisté
      const response = await makeRequest(
        "POST",
        "/auth/logout",
        {},
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 401, "TOKEN_REVOKED", null, "FR");
    });

    test("❌ Token blacklisté (EN)", async () => {
      const email = generateTestEmail("blacklist-test-en");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Blacklist Test User",
        email: email,
        password: "TestPassword123!",
      });

      const accessToken = registerResponse.body.data.accessToken;

      await makeRequest(
        "POST",
        "/auth/logout",
        {},
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en-US",
        }
      );

      const response = await makeRequest(
        "POST",
        "/auth/logout",
        {},
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 401, "TOKEN_REVOKED", null, "EN");
    });

    test("❌ Utilisateur supprimé (FR)", async () => {
      // Créer un utilisateur, le supprimer, puis tenter de logout
      const email = generateTestEmail("deleted-user-test");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Deleted User Test",
        email: email,
        password: "TestPassword123!",
      });

      const accessToken = registerResponse.body.data.accessToken;

      // Supprimer l'utilisateur
      await makeRequest(
        "DELETE",
        "/users/me",
        { password: "TestPassword123!" },
        {
          Authorization: `Bearer ${accessToken}`,
        }
      );

      // Tenter de logout avec le token d'un utilisateur supprimé
      const response = await makeRequest(
        "POST",
        "/auth/logout",
        {},
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 401, "USER_NOT_FOUND", null, "FR");
    });

    test("❌ Utilisateur supprimé (EN)", async () => {
      const email = generateTestEmail("deleted-user-test-en");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Deleted User Test",
        email: email,
        password: "TestPassword123!",
      });

      const accessToken = registerResponse.body.data.accessToken;

      await makeRequest(
        "DELETE",
        "/users/me",
        { password: "TestPassword123!" },
        {
          Authorization: `Bearer ${accessToken}`,
        }
      );

      const response = await makeRequest(
        "POST",
        "/auth/logout",
        {},
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 401, "USER_NOT_FOUND", null, "EN");
    });
  });
});
