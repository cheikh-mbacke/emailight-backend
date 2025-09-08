/**
 * 🔧 Tests unitaires - Validateurs
 */

import { describe, test, expect } from "@jest/globals";
import {
  validateSuccessResponse,
  validateErrorResponse,
  validateRefreshTokenSuccessResponse,
  validateLogoutSuccessResponse,
} from "../utils/validators.js";

describe("🔧 Tests unitaires - Validateurs", () => {
  describe("validateSuccessResponse", () => {
    test("✅ Valide une réponse de succès pour register", () => {
      const response = {
        statusCode: 201,
        body: {
          status: "success",
          message: "Compte créé avec succès",
          data: {
            accessToken: "valid-token",
            refreshToken: "valid-refresh-token",
            expiresIn: "24h",
          },
        },
      };

      expect(() => {
        validateSuccessResponse(response, "account_created", "FR");
      }).not.toThrow();
    });

    test("✅ Valide une réponse de succès pour login", () => {
      const response = {
        statusCode: 200,
        body: {
          status: "success",
          message: "Connexion réussie",
          data: {
            accessToken: "valid-token",
            refreshToken: "valid-refresh-token",
            expiresIn: "24h",
          },
        },
      };

      expect(() => {
        validateSuccessResponse(response, "login_success", "FR");
      }).not.toThrow();
    });

    test("❌ Rejette un mauvais status code", () => {
      const response = {
        statusCode: 400,
        body: {
          status: "success",
          message: "Compte créé avec succès",
          data: {
            accessToken: "valid-token",
            refreshToken: "valid-refresh-token",
            expiresIn: "24h",
          },
        },
      };

      expect(() => {
        validateSuccessResponse(response, "account_created", "FR");
      }).toThrow("Expected status 200 or 201, got 400");
    });

    test("❌ Rejette un mauvais status", () => {
      const response = {
        statusCode: 201,
        body: {
          status: "failed",
          message: "Compte créé avec succès",
          data: {
            accessToken: "valid-token",
            refreshToken: "valid-refresh-token",
            expiresIn: "24h",
          },
        },
      };

      expect(() => {
        validateSuccessResponse(response, "account_created", "FR");
      }).toThrow("Expected status 'success', got 'failed'");
    });
  });

  describe("validateErrorResponse", () => {
    test("✅ Valide une erreur de validation", () => {
      const response = {
        statusCode: 400,
        body: {
          status: "failed",
          errorCode: "400",
          errorName: "VALIDATION_ERROR",
          errorMessage: "Le mot de passe doit contenir au moins 6 caractères",
        },
      };

      expect(() => {
        validateErrorResponse(
          response,
          400,
          "VALIDATION_ERROR",
          "password_min",
          "FR"
        );
      }).not.toThrow();
    });

    test("✅ Valide une erreur d'authentification", () => {
      const response = {
        statusCode: 401,
        body: {
          status: "failed",
          errorCode: "401",
          errorName: "MISSING_TOKEN",
          errorMessage: "Token d'accès requis",
        },
      };

      expect(() => {
        validateErrorResponse(response, 401, "MISSING_TOKEN", null, "FR");
      }).not.toThrow();
    });

    test("❌ Rejette un mauvais status code", () => {
      const response = {
        statusCode: 500,
        body: {
          status: "failed",
          errorCode: "500",
          errorName: "VALIDATION_ERROR",
          errorMessage: "Le mot de passe doit contenir au moins 6 caractères",
        },
      };

      expect(() => {
        validateErrorResponse(
          response,
          400,
          "VALIDATION_ERROR",
          "password_min",
          "FR"
        );
      }).toThrow("Expected status 400, got 500");
    });
  });

  describe("validateRefreshTokenSuccessResponse", () => {
    test("✅ Valide une réponse de refresh token", () => {
      const response = {
        statusCode: 200,
        body: {
          status: "success",
          message: "Token rafraîchi avec succès",
          data: {
            accessToken: "new-valid-token",
            expiresIn: "24h",
          },
        },
      };

      expect(() => {
        validateRefreshTokenSuccessResponse(response, "token_refreshed", "FR");
      }).not.toThrow();
    });
  });

  describe("validateLogoutSuccessResponse", () => {
    test("✅ Valide une réponse de logout", () => {
      const response = {
        statusCode: 200,
        body: {
          status: "success",
          message: "Déconnexion réussie",
        },
      };

      expect(() => {
        validateLogoutSuccessResponse(response, "logout_success", "FR");
      }).not.toThrow();
    });

    test("❌ Rejette une réponse avec data", () => {
      const response = {
        statusCode: 200,
        body: {
          status: "success",
          message: "Déconnexion réussie",
          data: { someField: "value" },
        },
      };

      expect(() => {
        validateLogoutSuccessResponse(response, "logout_success", "FR");
      }).toThrow("Le champ 'data' ne devrait pas être présent pour logout");
    });
  });
});
