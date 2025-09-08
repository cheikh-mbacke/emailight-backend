import { makeRequest, generateTestEmail } from "../utils/test-helpers.js";
import {
  validateSuccessResponse,
  validateErrorResponse,
} from "../utils/validation-helpers.js";

describe("DELETE /users/me - Tests de validation complets", () => {
  jest.setTimeout(30000); // 30 secondes pour les tests lents
  describe("✅ Scénarios de succès", () => {
    test("✅ Suppression compte avec mot de passe correct (FR)", async () => {
      // Créer un utilisateur pour ce test
      const email = generateTestEmail("delete-success-test");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Delete Success Test User",
        email: email,
        password: "TestPassword123!",
      });

      const accessToken = registerResponse.body.data.accessToken;

      const response = await makeRequest(
        "DELETE",
        "/users/me",
        { password: "TestPassword123!" },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateSuccessResponse(response, 200, "FR");
    });

    test("✅ Suppression compte avec mot de passe correct (EN)", async () => {
      // Créer un utilisateur pour ce test
      const email = generateTestEmail("delete-success-test-en");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Delete Success Test User EN",
        email: email,
        password: "TestPassword123!",
      });

      const accessToken = registerResponse.body.data.accessToken;

      const response = await makeRequest(
        "DELETE",
        "/users/me",
        { password: "TestPassword123!" },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateSuccessResponse(response, 200, "EN");
    });
  });

  describe("❌ Scénarios d'erreur - Validation des données", () => {
    test("❌ Mot de passe manquant (FR)", async () => {
      // Créer un utilisateur pour ce test
      const email = generateTestEmail("delete-missing-password-test");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Delete Missing Password Test User",
        email: email,
        password: "TestPassword123!",
      });

      const accessToken = registerResponse.body.data.accessToken;

      const response = await makeRequest(
        "DELETE",
        "/users/me",
        {},
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 400, "BAD_REQUEST", null, "FR");
    });

    test("❌ Mot de passe manquant (EN)", async () => {
      const email = generateTestEmail("delete-missing-password-test-en");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Delete Missing Password Test User",
        email: email,
        password: "TestPassword123!",
      });

      const accessToken = registerResponse.body.data.accessToken;

      const response = await makeRequest(
        "DELETE",
        "/users/me",
        {},
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 400, "BAD_REQUEST", null, "EN");
    });

    test("❌ Mot de passe incorrect (FR)", async () => {
      const email = generateTestEmail("delete-wrong-password-test");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Delete Wrong Password Test User",
        email: email,
        password: "TestPassword123!",
      });

      const accessToken = registerResponse.body.data.accessToken;

      const response = await makeRequest(
        "DELETE",
        "/users/me",
        { password: "WrongPassword123!" },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 401, "UNAUTHORIZED", null, "FR");
    });

    test("❌ Mot de passe incorrect (EN)", async () => {
      const email = generateTestEmail("delete-wrong-password-test-en");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Delete Wrong Password Test User",
        email: email,
        password: "TestPassword123!",
      });

      const accessToken = registerResponse.body.data.accessToken;

      const response = await makeRequest(
        "DELETE",
        "/users/me",
        { password: "WrongPassword123!" },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 401, "UNAUTHORIZED", null, "EN");
    });

    test("❌ Corps vide (FR)", async () => {
      const email = generateTestEmail("delete-empty-body-test");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Delete Empty Body Test User",
        email: email,
        password: "TestPassword123!",
      });

      const accessToken = registerResponse.body.data.accessToken;

      const response = await makeRequest(
        "DELETE",
        "/users/me",
        {},
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 400, "BAD_REQUEST", null, "FR");
    });

    test("❌ Corps vide (EN)", async () => {
      const email = generateTestEmail("delete-empty-body-test-en");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Delete Empty Body Test User",
        email: email,
        password: "TestPassword123!",
      });

      const accessToken = registerResponse.body.data.accessToken;

      const response = await makeRequest(
        "DELETE",
        "/users/me",
        {},
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 400, "BAD_REQUEST", null, "EN");
    });
  });

  describe("❌ Scénarios d'erreur - Authentification", () => {
    test("❌ Token manquant (FR)", async () => {
      const response = await makeRequest(
        "DELETE",
        "/users/me",
        { password: "TestPassword123!" },
        {
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 401, "MISSING_TOKEN", null, "FR");
    });

    test("❌ Token manquant (EN)", async () => {
      const response = await makeRequest(
        "DELETE",
        "/users/me",
        { password: "TestPassword123!" },
        {
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 401, "MISSING_TOKEN", null, "EN");
    });

    test("❌ Token invalide (FR)", async () => {
      const response = await makeRequest(
        "DELETE",
        "/users/me",
        { password: "TestPassword123!" },
        {
          Authorization: "Bearer abc123",
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 401, "INVALID_TOKEN", null, "FR");
    });

    test("❌ Token invalide (EN)", async () => {
      const response = await makeRequest(
        "DELETE",
        "/users/me",
        { password: "TestPassword123!" },
        {
          Authorization: "Bearer abc123",
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 401, "INVALID_TOKEN", null, "EN");
    });

    test("❌ Token expiré (FR)", async () => {
      const response = await makeRequest(
        "DELETE",
        "/users/me",
        { password: "TestPassword123!" },
        {
          Authorization: "Bearer expired_token_placeholder",
          "Accept-Language": "fr-FR",
        }
      );

      expect(response.statusCode).toBe(401);
    });

    test("❌ Token expiré (EN)", async () => {
      const response = await makeRequest(
        "DELETE",
        "/users/me",
        { password: "TestPassword123!" },
        {
          Authorization: "Bearer expired_token_placeholder",
          "Accept-Language": "en-US",
        }
      );

      expect(response.statusCode).toBe(401);
    });

    test("❌ Token blacklisté (FR)", async () => {
      // Créer un utilisateur et le logout pour blacklister le token
      const email = generateTestEmail("blacklist-delete-test");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Blacklist Delete Test User",
        email: email,
        password: "TestPassword123!",
      });

      const blacklistedToken = registerResponse.body.data.accessToken;

      // Logout pour blacklister le token
      await makeRequest(
        "POST",
        "/auth/logout",
        {},
        {
          Authorization: `Bearer ${blacklistedToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      // Tenter d'utiliser le token blacklisté
      const response = await makeRequest(
        "DELETE",
        "/users/me",
        { password: "TestPassword123!" },
        {
          Authorization: `Bearer ${blacklistedToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 401, "TOKEN_REVOKED", null, "FR");
    });

    test("❌ Token blacklisté (EN)", async () => {
      const email = generateTestEmail("blacklist-delete-test-en");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Blacklist Delete Test User",
        email: email,
        password: "TestPassword123!",
      });

      const blacklistedToken = registerResponse.body.data.accessToken;

      await makeRequest(
        "POST",
        "/auth/logout",
        {},
        {
          Authorization: `Bearer ${blacklistedToken}`,
          "Accept-Language": "en-US",
        }
      );

      const response = await makeRequest(
        "DELETE",
        "/users/me",
        { password: "TestPassword123!" },
        {
          Authorization: `Bearer ${blacklistedToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 401, "TOKEN_REVOKED", null, "EN");
    });

    test("❌ Utilisateur supprimé (FR)", async () => {
      // Créer un utilisateur, le supprimer, puis tenter de le supprimer à nouveau
      const email = generateTestEmail("deleted-delete-test");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Deleted Delete Test",
        email: email,
        password: "TestPassword123!",
      });

      const deletedUserToken = registerResponse.body.data.accessToken;

      // Supprimer l'utilisateur
      await makeRequest(
        "DELETE",
        "/users/me",
        { password: "TestPassword123!" },
        {
          Authorization: `Bearer ${deletedUserToken}`,
        }
      );

      // Tenter de supprimer l'utilisateur avec le token d'un utilisateur déjà supprimé
      const response = await makeRequest(
        "DELETE",
        "/users/me",
        { password: "TestPassword123!" },
        {
          Authorization: `Bearer ${deletedUserToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 401, "USER_NOT_FOUND", null, "FR");
    });

    test("❌ Utilisateur supprimé (EN)", async () => {
      const email = generateTestEmail("deleted-delete-test-en");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Deleted Delete Test",
        email: email,
        password: "TestPassword123!",
      });

      const deletedUserToken = registerResponse.body.data.accessToken;

      await makeRequest(
        "DELETE",
        "/users/me",
        { password: "TestPassword123!" },
        {
          Authorization: `Bearer ${deletedUserToken}`,
        }
      );

      const response = await makeRequest(
        "DELETE",
        "/users/me",
        { password: "TestPassword123!" },
        {
          Authorization: `Bearer ${deletedUserToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 401, "USER_NOT_FOUND", null, "EN");
    });
  });
});
