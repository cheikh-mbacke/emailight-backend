import { makeRequest, generateTestEmail } from "../utils/test-helpers.js";
import {
  validateSuccessResponse,
  validateErrorResponse,
} from "../utils/validation-helpers.js";

describe("PATCH /users/me - Tests de validation complets", () => {
  jest.setTimeout(30000); // 30 secondes pour les tests lents
  let accessToken;

  beforeAll(async () => {
    // Créer un utilisateur de test
    const email = generateTestEmail("profile-test");
    const registerResponse = await makeRequest("POST", "/auth/register", {
      name: "Profile Test User",
      email: email,
      password: "TestPassword123!",
    });

    accessToken = registerResponse.body.data.accessToken;
  });

  describe("✅ Scénarios de succès", () => {
    test("✅ Mise à jour nom valide (FR)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me",
        { name: "Nouveau Nom" },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateSuccessResponse(response, 200, "FR");
      expect(response.body.data).toHaveProperty("name");
      expect(response.body.data.name).toBe("Nouveau Nom");
    });

    test("✅ Mise à jour nom valide (EN)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me",
        { name: "New Name" },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateSuccessResponse(response, 200, "EN");
      expect(response.body.data).toHaveProperty("name");
      expect(response.body.data.name).toBe("New Name");
    });

    test("✅ Mise à jour email valide (FR)", async () => {
      const newEmail = generateTestEmail("profile-update-email");
      const response = await makeRequest(
        "PATCH",
        "/users/me",
        { email: newEmail },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateSuccessResponse(response, 200, "FR");
      expect(response.body.data).toHaveProperty("email");
      expect(response.body.data.email).toBe(newEmail);
    });

    test("✅ Mise à jour email valide (EN)", async () => {
      const newEmail = generateTestEmail("profile-update-email-en");
      const response = await makeRequest(
        "PATCH",
        "/users/me",
        { email: newEmail },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateSuccessResponse(response, 200, "EN");
      expect(response.body.data).toHaveProperty("email");
      expect(response.body.data.email).toBe(newEmail);
    });

    test("✅ Mise à jour nom et email valides (FR)", async () => {
      const newEmail = generateTestEmail("profile-update-both");
      const response = await makeRequest(
        "PATCH",
        "/users/me",
        { name: "Nom et Email", email: newEmail },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateSuccessResponse(response, 200, "FR");
      expect(response.body.data).toHaveProperty("name");
      expect(response.body.data.name).toBe("Nom et Email");
      expect(response.body.data.email).toBe(newEmail);
    });

    test("✅ Mise à jour nom et email valides (EN)", async () => {
      const newEmail = generateTestEmail("profile-update-both-en");
      const response = await makeRequest(
        "PATCH",
        "/users/me",
        { name: "Name and Email", email: newEmail },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateSuccessResponse(response, 200, "EN");
      expect(response.body.data).toHaveProperty("name");
      expect(response.body.data.name).toBe("Name and Email");
      expect(response.body.data.email).toBe(newEmail);
    });
  });

  describe("❌ Scénarios d'erreur - Validation des données", () => {
    test("❌ Nom trop court (FR)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me",
        { name: "A" },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 400, "VALIDATION_ERROR", null, "FR");
    });

    test("❌ Nom trop court (EN)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me",
        { name: "A" },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 400, "VALIDATION_ERROR", null, "EN");
    });

    test("❌ Nom trop long (FR)", async () => {
      const longName = "A".repeat(101); // Supposons une limite de 100 caractères
      const response = await makeRequest(
        "PATCH",
        "/users/me",
        { name: longName },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 400, "VALIDATION_ERROR", null, "FR");
    });

    test("❌ Nom trop long (EN)", async () => {
      const longName = "A".repeat(101);
      const response = await makeRequest(
        "PATCH",
        "/users/me",
        { name: longName },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 400, "VALIDATION_ERROR", null, "EN");
    });

    test("❌ Nom avec caractères invalides (FR)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me",
        { name: "Nom@#$%Invalid" },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 400, "VALIDATION_ERROR", null, "FR");
    });

    test("❌ Nom avec caractères invalides (EN)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me",
        { name: "Name@#$%Invalid" },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 400, "VALIDATION_ERROR", null, "EN");
    });

    test("❌ Email invalide (FR)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me",
        { email: "invalid-email" },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 400, "VALIDATION_ERROR", null, "FR");
    });

    test("❌ Email invalide (EN)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me",
        { email: "invalid-email" },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 400, "VALIDATION_ERROR", null, "EN");
    });

    test("❌ Email déjà utilisé (FR)", async () => {
      // Créer un autre utilisateur avec un email
      const existingEmail = generateTestEmail("existing-user");
      await makeRequest("POST", "/auth/register", {
        name: "Existing User",
        email: existingEmail,
        password: "TestPassword123!",
      });

      // Tenter d'utiliser le même email
      const response = await makeRequest(
        "PATCH",
        "/users/me",
        { email: existingEmail },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 409, "CONFLICT", null, "FR");
    });

    test("❌ Email déjà utilisé (EN)", async () => {
      const existingEmail = generateTestEmail("existing-user-en");
      await makeRequest("POST", "/auth/register", {
        name: "Existing User",
        email: existingEmail,
        password: "TestPassword123!",
      });

      const response = await makeRequest(
        "PATCH",
        "/users/me",
        { email: existingEmail },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 409, "CONFLICT", null, "EN");
    });

    test("❌ Corps vide (FR)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me",
        {},
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 400, "VALIDATION_ERROR", null, "FR");
    });

    test("❌ Corps vide (EN)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me",
        {},
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 400, "VALIDATION_ERROR", null, "EN");
    });

    test("❌ Données invalides (FR)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me",
        { invalidField: "invalid" },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 400, "VALIDATION_ERROR", null, "FR");
    });

    test("❌ Données invalides (EN)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me",
        { invalidField: "invalid" },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 400, "VALIDATION_ERROR", null, "EN");
    });
  });

  describe("❌ Scénarios d'erreur - Authentification", () => {
    test("❌ Token manquant (FR)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me",
        { name: "Test Name" },
        {
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 401, "MISSING_TOKEN", null, "FR");
    });

    test("❌ Token manquant (EN)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me",
        { name: "Test Name" },
        {
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 401, "MISSING_TOKEN", null, "EN");
    });

    test("❌ Token invalide (FR)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me",
        { name: "Test Name" },
        {
          Authorization: "Bearer abc123",
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 401, "INVALID_TOKEN", null, "FR");
    });

    test("❌ Token invalide (EN)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me",
        { name: "Test Name" },
        {
          Authorization: "Bearer abc123",
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 401, "INVALID_TOKEN", null, "EN");
    });

    test("❌ Token expiré (FR)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me",
        { name: "Test Name" },
        {
          Authorization: "Bearer expired_token_placeholder",
          "Accept-Language": "fr-FR",
        }
      );

      expect(response.statusCode).toBe(401);
    });

    test("❌ Token expiré (EN)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me",
        { name: "Test Name" },
        {
          Authorization: "Bearer expired_token_placeholder",
          "Accept-Language": "en-US",
        }
      );

      expect(response.statusCode).toBe(401);
    });

    test("❌ Token blacklisté (FR)", async () => {
      // Créer un utilisateur et le logout pour blacklister le token
      const email = generateTestEmail("blacklist-profile-test");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Blacklist Profile Test User",
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
        "PATCH",
        "/users/me",
        { name: "Test Name" },
        {
          Authorization: `Bearer ${blacklistedToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 401, "TOKEN_REVOKED", null, "FR");
    });

    test("❌ Token blacklisté (EN)", async () => {
      const email = generateTestEmail("blacklist-profile-test-en");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Blacklist Profile Test User",
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
        "PATCH",
        "/users/me",
        { name: "Test Name" },
        {
          Authorization: `Bearer ${blacklistedToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 401, "TOKEN_REVOKED", null, "EN");
    });

    test("❌ Utilisateur supprimé (FR)", async () => {
      // Créer un utilisateur, le supprimer, puis tenter de mettre à jour le profil
      const email = generateTestEmail("deleted-profile-test");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Deleted Profile Test",
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

      // Tenter de mettre à jour le profil avec le token d'un utilisateur supprimé
      const response = await makeRequest(
        "PATCH",
        "/users/me",
        { name: "Test Name" },
        {
          Authorization: `Bearer ${deletedUserToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 401, "USER_NOT_FOUND", null, "FR");
    });

    test("❌ Utilisateur supprimé (EN)", async () => {
      const email = generateTestEmail("deleted-profile-test-en");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Deleted Profile Test",
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
        "PATCH",
        "/users/me",
        { name: "Test Name" },
        {
          Authorization: `Bearer ${deletedUserToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 401, "USER_NOT_FOUND", null, "EN");
    });
  });
});
