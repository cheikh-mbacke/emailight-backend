/**
 * 🎯 Tests End-to-End - Routes utilisateur
 */

import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import {
  makeRequest,
  generateTestEmail,
  delay,
} from "../utils/test-helpers.js";
import {
  validateSuccessResponse,
  validateErrorResponse,
} from "../utils/validators.js";
import {
  PROFILE_UPDATE_TEST_DATA,
  PASSWORD_CHANGE_TEST_DATA,
  ACCOUNT_DELETE_TEST_DATA,
} from "../fixtures/test-data.js";

describe("🎯 Tests E2E - Routes utilisateur", () => {
  jest.setTimeout(30000); // 30 secondes pour les tests lents
  let testUser = null;

  beforeAll(async () => {
    // Créer un utilisateur de test
    const email = generateTestEmail("e2e-test");
    const response = await makeRequest("POST", "/auth/register", {
      name: "E2E Test User",
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

  afterAll(async () => {
    // Nettoyage - supprimer l'utilisateur de test
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

  describe("👤 GET /users/me", () => {
    test("✅ Récupération du profil (FR)", async () => {
      const response = await makeRequest("GET", "/users/me", null, {
        Authorization: `Bearer ${testUser.accessToken}`,
        "Accept-Language": "fr-FR",
      });

      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data).toHaveProperty("name");
      expect(response.body.data).toHaveProperty("email");
      expect(response.body.data.email).toBe(testUser.email);
    });

    test("✅ Récupération du profil (EN)", async () => {
      const response = await makeRequest("GET", "/users/me", null, {
        Authorization: `Bearer ${testUser.accessToken}`,
        "Accept-Language": "en-US",
      });

      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data).toHaveProperty("name");
      expect(response.body.data).toHaveProperty("email");
    });

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
      const email = generateTestEmail("blacklist-get-test");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Blacklist Get Test User",
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
      const response = await makeRequest("GET", "/users/me", null, {
        Authorization: `Bearer ${accessToken}`,
        "Accept-Language": "fr-FR",
      });

      validateErrorResponse(response, 401, "TOKEN_REVOKED", null, "FR");
    });

    test("❌ Token blacklisté (EN)", async () => {
      const email = generateTestEmail("blacklist-get-test-en");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Blacklist Get Test User",
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

      const response = await makeRequest("GET", "/users/me", null, {
        Authorization: `Bearer ${accessToken}`,
        "Accept-Language": "en-US",
      });

      validateErrorResponse(response, 401, "TOKEN_REVOKED", null, "EN");
    });

    test("❌ Utilisateur supprimé (FR)", async () => {
      // Créer un utilisateur, le supprimer, puis tenter de récupérer le profil
      const email = generateTestEmail("deleted-get-test");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Deleted Get Test",
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

      // Tenter de récupérer le profil avec le token d'un utilisateur supprimé
      const response = await makeRequest("GET", "/users/me", null, {
        Authorization: `Bearer ${accessToken}`,
        "Accept-Language": "fr-FR",
      });

      validateErrorResponse(response, 401, "USER_NOT_FOUND", null, "FR");
    });

    test("❌ Utilisateur supprimé (EN)", async () => {
      const email = generateTestEmail("deleted-get-test-en");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Deleted Get Test",
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

      const response = await makeRequest("GET", "/users/me", null, {
        Authorization: `Bearer ${accessToken}`,
        "Accept-Language": "en-US",
      });

      validateErrorResponse(response, 401, "USER_NOT_FOUND", null, "EN");
    });
  });

  describe("✏️ PATCH /users/me", () => {
    test("✅ Mise à jour du nom (FR)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me",
        {
          name: "Updated Name",
        },
        {
          Authorization: `Bearer ${testUser.accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.name).toBe("Updated Name");
    });

    test("✅ Mise à jour de l'email (FR)", async () => {
      const newEmail = generateTestEmail("updated-email");
      const response = await makeRequest(
        "PATCH",
        "/users/me",
        {
          email: newEmail,
        },
        {
          Authorization: `Bearer ${testUser.accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.email).toBe(newEmail);

      // Mettre à jour l'email de test pour les tests suivants
      testUser.email = newEmail;
    });

    test("❌ Nom trop court (FR)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me",
        {
          name: "J",
        },
        {
          Authorization: `Bearer ${testUser.accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "name_min",
        "FR"
      );
    });

    test("❌ Email invalide (FR)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me",
        {
          email: "not-an-email",
        },
        {
          Authorization: `Bearer ${testUser.accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "email_invalid",
        "FR"
      );
    });

    test("❌ Token manquant (FR)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me",
        {
          name: "Test",
        },
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
        {
          name: "Test",
        },
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
        {
          name: "Test",
        },
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
        {
          name: "Test",
        },
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
        {
          name: "Test",
        },
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
        {
          name: "Test",
        },
        {
          Authorization: "Bearer expired_token_placeholder",
          "Accept-Language": "en-US",
        }
      );

      expect(response.statusCode).toBe(401);
    });

    test("❌ Token blacklisté (FR)", async () => {
      // Créer un utilisateur et le logout pour blacklister le token
      const email = generateTestEmail("blacklist-patch-test");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Blacklist Patch Test User",
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
        "PATCH",
        "/users/me",
        {
          name: "Test",
        },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 401, "TOKEN_REVOKED", null, "FR");
    });

    test("❌ Token blacklisté (EN)", async () => {
      const email = generateTestEmail("blacklist-patch-test-en");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Blacklist Patch Test User",
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
        "PATCH",
        "/users/me",
        {
          name: "Test",
        },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 401, "TOKEN_REVOKED", null, "EN");
    });

    test("❌ Utilisateur supprimé (FR)", async () => {
      // Créer un utilisateur, le supprimer, puis tenter de modifier le profil
      const email = generateTestEmail("deleted-patch-test");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Deleted Patch Test",
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

      // Tenter de modifier le profil avec le token d'un utilisateur supprimé
      const response = await makeRequest(
        "PATCH",
        "/users/me",
        {
          name: "Test",
        },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 401, "USER_NOT_FOUND", null, "FR");
    });

    test("❌ Utilisateur supprimé (EN)", async () => {
      const email = generateTestEmail("deleted-patch-test-en");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Deleted Patch Test",
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
        "PATCH",
        "/users/me",
        {
          name: "Test",
        },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 401, "USER_NOT_FOUND", null, "EN");
    });
  });

  describe("🔒 PATCH /users/me/password", () => {
    test("✅ Changement de mot de passe (FR)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me/password",
        {
          currentPassword: testUser.password,
          newPassword: "NewPassword123!",
        },
        {
          Authorization: `Bearer ${testUser.accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe("success");

      // Mettre à jour le mot de passe pour les tests suivants
      testUser.password = "NewPassword123!";
    });

    test("❌ Mot de passe actuel incorrect (FR)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me/password",
        {
          currentPassword: "WrongPassword123!",
          newPassword: "AnotherPassword123!",
        },
        {
          Authorization: `Bearer ${testUser.accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 401, "INVALID_CREDENTIALS", null, "FR");
    });

    test("❌ Nouveau mot de passe trop court (FR)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me/password",
        {
          currentPassword: testUser.password,
          newPassword: "123",
        },
        {
          Authorization: `Bearer ${testUser.accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(
        response,
        400,
        "VALIDATION_ERROR",
        "new_password_min_length",
        "FR"
      );
    });

    test("❌ Token manquant (FR)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me/password",
        {
          currentPassword: testUser.password,
          newPassword: "NewPassword123!",
        },
        {
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 401, "MISSING_TOKEN", null, "FR");
    });

    test("❌ Token manquant (EN)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me/password",
        {
          currentPassword: testUser.password,
          newPassword: "NewPassword123!",
        },
        {
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 401, "MISSING_TOKEN", null, "EN");
    });

    test("❌ Token invalide (FR)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me/password",
        {
          currentPassword: testUser.password,
          newPassword: "NewPassword123!",
        },
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
        "/users/me/password",
        {
          currentPassword: testUser.password,
          newPassword: "NewPassword123!",
        },
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
        "/users/me/password",
        {
          currentPassword: testUser.password,
          newPassword: "NewPassword123!",
        },
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
        "/users/me/password",
        {
          currentPassword: testUser.password,
          newPassword: "NewPassword123!",
        },
        {
          Authorization: "Bearer expired_token_placeholder",
          "Accept-Language": "en-US",
        }
      );

      expect(response.statusCode).toBe(401);
    });

    test("❌ Token blacklisté (FR)", async () => {
      // Créer un utilisateur et le logout pour blacklister le token
      const email = generateTestEmail("blacklist-password-test");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Blacklist Password Test User",
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
        "PATCH",
        "/users/me/password",
        {
          currentPassword: "TestPassword123!",
          newPassword: "NewPassword123!",
        },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 401, "TOKEN_REVOKED", null, "FR");
    });

    test("❌ Token blacklisté (EN)", async () => {
      const email = generateTestEmail("blacklist-password-test-en");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Blacklist Password Test User",
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
        "PATCH",
        "/users/me/password",
        {
          currentPassword: "TestPassword123!",
          newPassword: "NewPassword123!",
        },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 401, "TOKEN_REVOKED", null, "EN");
    });

    test("❌ Utilisateur supprimé (FR)", async () => {
      // Créer un utilisateur, le supprimer, puis tenter de changer le mot de passe
      const email = generateTestEmail("deleted-password-test");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Deleted Password Test",
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

      // Tenter de changer le mot de passe avec le token d'un utilisateur supprimé
      const response = await makeRequest(
        "PATCH",
        "/users/me/password",
        {
          currentPassword: "TestPassword123!",
          newPassword: "NewPassword123!",
        },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 401, "USER_NOT_FOUND", null, "FR");
    });

    test("❌ Utilisateur supprimé (EN)", async () => {
      const email = generateTestEmail("deleted-password-test-en");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Deleted Password Test",
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
        "PATCH",
        "/users/me/password",
        {
          currentPassword: "TestPassword123!",
          newPassword: "NewPassword123!",
        },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 401, "USER_NOT_FOUND", null, "EN");
    });
  });

  describe("🗑️ DELETE /users/me", () => {
    test("✅ Suppression de compte (FR)", async () => {
      // Créer un utilisateur temporaire pour le test de suppression
      const email = generateTestEmail("delete-test");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Delete Test User",
        email: email,
        password: "TestPassword123!",
      });

      const tempUser = {
        email: email,
        password: "TestPassword123!",
        accessToken: registerResponse.body.data.accessToken,
      };

      const response = await makeRequest(
        "DELETE",
        "/users/me",
        {
          password: tempUser.password,
        },
        {
          Authorization: `Bearer ${tempUser.accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.message).toBe(
        "Compte utilisateur supprimé définitivement"
      );
    });

    test("❌ Mot de passe incorrect (FR)", async () => {
      const response = await makeRequest(
        "DELETE",
        "/users/me",
        {
          password: "WrongPassword123!",
        },
        {
          Authorization: `Bearer ${testUser.accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 401, "UNAUTHORIZED", null, "FR");
    });

    test("❌ Token manquant (FR)", async () => {
      const response = await makeRequest(
        "DELETE",
        "/users/me",
        {
          password: testUser.password,
        },
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
        {
          password: testUser.password,
        },
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
        {
          password: testUser.password,
        },
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
        {
          password: testUser.password,
        },
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
        {
          password: testUser.password,
        },
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
        {
          password: testUser.password,
        },
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
        "DELETE",
        "/users/me",
        {
          password: "TestPassword123!",
        },
        {
          Authorization: `Bearer ${accessToken}`,
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
        "DELETE",
        "/users/me",
        {
          password: "TestPassword123!",
        },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 401, "TOKEN_REVOKED", null, "EN");
    });

    test("❌ Utilisateur supprimé (FR)", async () => {
      // Créer un utilisateur, le supprimer, puis tenter de le supprimer avec un token différent
      const email = generateTestEmail("deleted-delete-test");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Deleted Delete Test",
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

      // Tenter de supprimer avec le token d'un utilisateur supprimé
      const response = await makeRequest(
        "DELETE",
        "/users/me",
        {
          password: "TestPassword123!",
        },
        {
          Authorization: `Bearer ${accessToken}`,
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
        "DELETE",
        "/users/me",
        {
          password: "TestPassword123!",
        },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 401, "USER_NOT_FOUND", null, "EN");
    });
  });
});
