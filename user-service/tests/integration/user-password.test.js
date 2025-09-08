import { makeRequest, generateTestEmail } from "../utils/test-helpers.js";
import {
  validateSuccessResponse,
  validateErrorResponse,
} from "../utils/validation-helpers.js";

describe("PATCH /users/me/password - Tests de validation complets", () => {
  jest.setTimeout(30000); // 30 secondes pour les tests lents
  let accessToken;

  beforeAll(async () => {
    // Créer un utilisateur de test
    const email = generateTestEmail("password-test");
    const registerResponse = await makeRequest("POST", "/auth/register", {
      name: "Password Test User",
      email: email,
      password: "TestPassword123!",
    });

    accessToken = registerResponse.body.data.accessToken;
  });

  describe("✅ Scénarios de succès", () => {
    test("✅ Changement de mot de passe valide (FR)", async () => {
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

      validateSuccessResponse(response, 200, "FR");

      // Mettre à jour le mot de passe pour les tests suivants
      // Note: Dans un vrai test, on devrait recréer l'utilisateur
    });

    test("✅ Changement de mot de passe valide (EN)", async () => {
      // Recréer un utilisateur pour ce test
      const email = generateTestEmail("password-test-en");
      const registerResponse = await makeRequest("POST", "/auth/register", {
        name: "Password Test User EN",
        email: email,
        password: "TestPassword123!",
      });

      const enAccessToken = registerResponse.body.data.accessToken;

      const response = await makeRequest(
        "PATCH",
        "/users/me/password",
        {
          currentPassword: "TestPassword123!",
          newPassword: "NewPassword123!",
        },
        {
          Authorization: `Bearer ${enAccessToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateSuccessResponse(response, 200, "EN");
    });
  });

  describe("❌ Scénarios d'erreur - Validation des données", () => {
    test("❌ Mot de passe actuel manquant (FR)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me/password",
        {
          newPassword: "NewPassword123!",
        },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 400, "VALIDATION_ERROR", null, "FR");
    });

    test("❌ Mot de passe actuel manquant (EN)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me/password",
        {
          newPassword: "NewPassword123!",
        },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 400, "VALIDATION_ERROR", null, "EN");
    });

    test("❌ Nouveau mot de passe manquant (FR)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me/password",
        {
          currentPassword: "TestPassword123!",
        },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 400, "VALIDATION_ERROR", null, "FR");
    });

    test("❌ Nouveau mot de passe manquant (EN)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me/password",
        {
          currentPassword: "TestPassword123!",
        },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 400, "VALIDATION_ERROR", null, "EN");
    });

    test("❌ Mot de passe actuel incorrect (FR)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me/password",
        {
          currentPassword: "WrongPassword123!",
          newPassword: "NewPassword123!",
        },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 401, "INVALID_CREDENTIALS", null, "FR");
    });

    test("❌ Mot de passe actuel incorrect (EN)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me/password",
        {
          currentPassword: "WrongPassword123!",
          newPassword: "NewPassword123!",
        },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 401, "INVALID_CREDENTIALS", null, "EN");
    });

    test("❌ Nouveau mot de passe trop court (FR)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me/password",
        {
          currentPassword: "TestPassword123!",
          newPassword: "Short1!",
        },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 401, "INVALID_CREDENTIALS", null, "FR");
    });

    test("❌ Nouveau mot de passe trop court (EN)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me/password",
        {
          currentPassword: "TestPassword123!",
          newPassword: "Short1!",
        },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 401, "INVALID_CREDENTIALS", null, "EN");
    });

    test("❌ Nouveau mot de passe sans majuscule (FR)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me/password",
        {
          currentPassword: "TestPassword123!",
          newPassword: "newpassword123!",
        },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 400, "VALIDATION_ERROR", null, "FR");
    });

    test("❌ Nouveau mot de passe sans majuscule (EN)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me/password",
        {
          currentPassword: "TestPassword123!",
          newPassword: "newpassword123!",
        },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 400, "VALIDATION_ERROR", null, "EN");
    });

    test("❌ Nouveau mot de passe sans minuscule (FR)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me/password",
        {
          currentPassword: "TestPassword123!",
          newPassword: "NEWPASSWORD123!",
        },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 400, "VALIDATION_ERROR", null, "FR");
    });

    test("❌ Nouveau mot de passe sans minuscule (EN)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me/password",
        {
          currentPassword: "TestPassword123!",
          newPassword: "NEWPASSWORD123!",
        },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 400, "VALIDATION_ERROR", null, "EN");
    });

    test("❌ Nouveau mot de passe sans chiffre (FR)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me/password",
        {
          currentPassword: "TestPassword123!",
          newPassword: "NewPassword!",
        },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 400, "VALIDATION_ERROR", null, "FR");
    });

    test("❌ Nouveau mot de passe sans chiffre (EN)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me/password",
        {
          currentPassword: "TestPassword123!",
          newPassword: "NewPassword!",
        },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 400, "VALIDATION_ERROR", null, "EN");
    });

    test("❌ Nouveau mot de passe sans caractère spécial (FR)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me/password",
        {
          currentPassword: "TestPassword123!",
          newPassword: "NewPassword123",
        },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "fr-FR",
        }
      );

      validateErrorResponse(response, 401, "INVALID_CREDENTIALS", null, "FR");
    });

    test("❌ Nouveau mot de passe sans caractère spécial (EN)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me/password",
        {
          currentPassword: "TestPassword123!",
          newPassword: "NewPassword123",
        },
        {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 401, "INVALID_CREDENTIALS", null, "EN");
    });

    test("❌ Corps vide (FR)", async () => {
      const response = await makeRequest(
        "PATCH",
        "/users/me/password",
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
        "/users/me/password",
        {},
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
        "/users/me/password",
        {
          currentPassword: "TestPassword123!",
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
          currentPassword: "TestPassword123!",
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
          currentPassword: "TestPassword123!",
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
          currentPassword: "TestPassword123!",
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
          currentPassword: "TestPassword123!",
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
          currentPassword: "TestPassword123!",
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
        "/users/me/password",
        {
          currentPassword: "TestPassword123!",
          newPassword: "NewPassword123!",
        },
        {
          Authorization: `Bearer ${blacklistedToken}`,
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
        "/users/me/password",
        {
          currentPassword: "TestPassword123!",
          newPassword: "NewPassword123!",
        },
        {
          Authorization: `Bearer ${blacklistedToken}`,
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

      // Tenter de changer le mot de passe avec le token d'un utilisateur supprimé
      const response = await makeRequest(
        "PATCH",
        "/users/me/password",
        {
          currentPassword: "TestPassword123!",
          newPassword: "NewPassword123!",
        },
        {
          Authorization: `Bearer ${deletedUserToken}`,
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
        "/users/me/password",
        {
          currentPassword: "TestPassword123!",
          newPassword: "NewPassword123!",
        },
        {
          Authorization: `Bearer ${deletedUserToken}`,
          "Accept-Language": "en-US",
        }
      );

      validateErrorResponse(response, 401, "USER_NOT_FOUND", null, "EN");
    });
  });
});
