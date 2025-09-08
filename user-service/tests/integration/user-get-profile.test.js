import { makeRequest, generateTestEmail } from "../utils/test-helpers.js";
import {
  validateSuccessResponse,
  validateErrorResponse,
} from "../utils/validation-helpers.js";

describe("GET /users/me - Tests de validation complets", () => {
  jest.setTimeout(30000); // 30 secondes pour les tests lents
  let accessToken;

  beforeAll(async () => {
    // Créer un utilisateur de test
    const email = generateTestEmail("get-profile-test");
    const registerResponse = await makeRequest("POST", "/auth/register", {
      name: "Get Profile Test User",
      email: email,
      password: "TestPassword123!",
    });

    accessToken = registerResponse.body.data.accessToken;
  });

  describe("✅ Scénarios de succès", () => {
    test("✅ Récupération profil utilisateur (FR)", async () => {
      const response = await makeRequest("GET", "/users/me", null, {
        Authorization: `Bearer ${accessToken}`,
        "Accept-Language": "fr-FR",
      });

      validateSuccessResponse(response, 200, "FR");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data).toHaveProperty("name");
      expect(response.body.data).toHaveProperty("email");
      expect(response.body.data).toHaveProperty("profilePictureUrl");
      expect(response.body.data).toHaveProperty("subscriptionStatus");
      expect(response.body.data).toHaveProperty("isActive");
      expect(response.body.data).toHaveProperty("isEmailVerified");
    });

    test("✅ Récupération profil utilisateur (EN)", async () => {
      const response = await makeRequest("GET", "/users/me", null, {
        Authorization: `Bearer ${accessToken}`,
        "Accept-Language": "en-US",
      });

      validateSuccessResponse(response, 200, "EN");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data).toHaveProperty("name");
      expect(response.body.data).toHaveProperty("email");
      expect(response.body.data).toHaveProperty("profilePictureUrl");
      expect(response.body.data).toHaveProperty("subscriptionStatus");
      expect(response.body.data).toHaveProperty("isActive");
      expect(response.body.data).toHaveProperty("isEmailVerified");
    });
  });

  describe("❌ Scénarios d'erreur - Authentification", () => {
    test("❌ Token manquant (FR)", async () => {
      const response = await makeRequest("GET", "/users/me", null, {
        "Accept-Language": "fr-FR",
      });

      validateErrorResponse(response, 401, "MISSING_TOKEN", null, "FR");
    });

    test("❌ Token manquant (EN)", async () => {
      const response = await makeRequest("GET", "/users/me", null, {
        "Accept-Language": "en-US",
      });

      validateErrorResponse(response, 401, "MISSING_TOKEN", null, "EN");
    });

    test("❌ Token invalide (FR)", async () => {
      const response = await makeRequest("GET", "/users/me", null, {
        Authorization: "Bearer abc123",
        "Accept-Language": "fr-FR",
      });

      validateErrorResponse(response, 401, "INVALID_TOKEN", null, "FR");
    });

    test("❌ Token invalide (EN)", async () => {
      const response = await makeRequest("GET", "/users/me", null, {
        Authorization: "Bearer abc123",
        "Accept-Language": "en-US",
      });

      validateErrorResponse(response, 401, "INVALID_TOKEN", null, "EN");
    });

    test("❌ Token expiré (FR)", async () => {
      const response = await makeRequest("GET", "/users/me", null, {
        Authorization: "Bearer expired_token_placeholder",
        "Accept-Language": "fr-FR",
      });

      expect(response.statusCode).toBe(401);
    });

    test("❌ Token expiré (EN)", async () => {
      const response = await makeRequest("GET", "/users/me", null, {
        Authorization: "Bearer expired_token_placeholder",
        "Accept-Language": "en-US",
      });

      expect(response.statusCode).toBe(401);
    });

    test("❌ Token blacklisté (FR)", async () => {
      // Créer un utilisateur et le logout pour blacklister le token
      const email = generateTestEmail("blacklist-get-profile-test");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Blacklist Get Profile Test User",
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
      const response = await makeRequest("GET", "/users/me", null, {
        Authorization: `Bearer ${blacklistedToken}`,
        "Accept-Language": "fr-FR",
      });

      validateErrorResponse(response, 401, "TOKEN_REVOKED", null, "FR");
    });

    test("❌ Token blacklisté (EN)", async () => {
      const email = generateTestEmail("blacklist-get-profile-test-en");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Blacklist Get Profile Test User",
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

      const response = await makeRequest("GET", "/users/me", null, {
        Authorization: `Bearer ${blacklistedToken}`,
        "Accept-Language": "en-US",
      });

      validateErrorResponse(response, 401, "TOKEN_REVOKED", null, "EN");
    });

    test("❌ Utilisateur supprimé (FR)", async () => {
      // Créer un utilisateur, le supprimer, puis tenter de récupérer le profil
      const email = generateTestEmail("deleted-get-profile-test");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Deleted Get Profile Test",
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

      // Tenter de récupérer le profil avec le token d'un utilisateur supprimé
      const response = await makeRequest("GET", "/users/me", null, {
        Authorization: `Bearer ${deletedUserToken}`,
        "Accept-Language": "fr-FR",
      });

      validateErrorResponse(response, 401, "USER_NOT_FOUND", null, "FR");
    });

    test("❌ Utilisateur supprimé (EN)", async () => {
      const email = generateTestEmail("deleted-get-profile-test-en");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Deleted Get Profile Test",
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

      const response = await makeRequest("GET", "/users/me", null, {
        Authorization: `Bearer ${deletedUserToken}`,
        "Accept-Language": "en-US",
      });

      validateErrorResponse(response, 401, "USER_NOT_FOUND", null, "EN");
    });
  });
});
