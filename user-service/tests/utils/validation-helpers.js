/**
 * ✅ Validateurs pour les réponses API - Version adaptée
 */

/**
 * Valide une réponse de succès générique (pour les endpoints non-auth)
 */
export function validateSuccessResponse(
  response,
  expectedStatus = 200,
  lang = "FR"
) {
  const { statusCode, body } = response;

  if (statusCode !== expectedStatus) {
    throw new Error(`Expected status ${expectedStatus}, got ${statusCode}`);
  }

  if (!body || body.status !== "success") {
    throw new Error(`Expected status 'success', got '${body?.status}'`);
  }

  return true;
}

/**
 * Valide une réponse d'erreur générique
 */
export function validateErrorResponse(
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

  if (body.errorName !== expectedErrorName) {
    throw new Error(
      `Expected errorName '${expectedErrorName}', got '${body.errorName}'`
    );
  }

  // Vérifier le message d'erreur traduit si fourni
  if (expectedMessage) {
    const expectedMessages = {
      MISSING_TOKEN: {
        FR: "Token d'accès requis",
        EN: "Access token required",
      },
      INVALID_TOKEN: {
        FR: "Token invalide",
        EN: "Invalid token",
      },
      TOKEN_REVOKED: {
        FR: "Token révoqué",
        EN: "Token revoked",
      },
      USER_NOT_FOUND: {
        FR: "Utilisateur introuvable",
        EN: "User not found",
      },
      MISSING_AVATAR: {
        FR: "Fichier avatar requis",
        EN: "Avatar file required",
      },
      INVALID_FILE_TYPE: {
        FR: "Type de fichier non supporté",
        EN: "Unsupported file type",
      },
      FILE_TOO_LARGE: {
        FR: "Fichier trop volumineux",
        EN: "File too large",
      },
      INVALID_IMAGE: {
        FR: "Image corrompue ou invalide",
        EN: "Corrupted or invalid image",
      },
      MISSING_CURRENT_PASSWORD: {
        FR: "Mot de passe actuel requis",
        EN: "Current password required",
      },
      MISSING_NEW_PASSWORD: {
        FR: "Nouveau mot de passe requis",
        EN: "New password required",
      },
      INVALID_CURRENT_PASSWORD: {
        FR: "Mot de passe actuel incorrect",
        EN: "Current password is incorrect",
      },
      PASSWORD_TOO_SHORT: {
        FR: "Mot de passe trop court",
        EN: "Password too short",
      },
      PASSWORD_MISSING_UPPERCASE: {
        FR: "Le mot de passe doit contenir au moins une majuscule",
        EN: "Password must contain at least one uppercase letter",
      },
      PASSWORD_MISSING_LOWERCASE: {
        FR: "Le mot de passe doit contenir au moins une minuscule",
        EN: "Password must contain at least one lowercase letter",
      },
      PASSWORD_MISSING_NUMBER: {
        FR: "Le mot de passe doit contenir au moins un chiffre",
        EN: "Password must contain at least one number",
      },
      PASSWORD_MISSING_SPECIAL_CHAR: {
        FR: "Le mot de passe doit contenir au moins un caractère spécial",
        EN: "Password must contain at least one special character",
      },
      MISSING_PASSWORD: {
        FR: "Mot de passe requis",
        EN: "Password required",
      },
      INVALID_PASSWORD: {
        FR: "Mot de passe incorrect",
        EN: "Incorrect password",
      },
      NAME_TOO_SHORT: {
        FR: "Le nom doit contenir au moins 2 caractères",
        EN: "Name must be at least 2 characters long",
      },
      NAME_TOO_LONG: {
        FR: "Le nom ne peut pas dépasser 100 caractères",
        EN: "Name cannot exceed 100 characters",
      },
      INVALID_NAME_FORMAT: {
        FR: "Format de nom invalide",
        EN: "Invalid name format",
      },
      INVALID_EMAIL: {
        FR: "Format d'email invalide",
        EN: "Invalid email format",
      },
      EMAIL_ALREADY_EXISTS: {
        FR: "Cette adresse email est déjà utilisée",
        EN: "This email address is already in use",
      },
      EMPTY_BODY: {
        FR: "Corps de requête vide",
        EN: "Empty request body",
      },
      INVALID_DATA: {
        FR: "Données invalides",
        EN: "Invalid data",
      },
    };

    const expected = expectedMessages[expectedErrorName]?.[lang];
    if (expected && body.errorMessage !== expected) {
      throw new Error(
        `Expected message '${expected}', got '${body.errorMessage}'`
      );
    }
  }

  return true;
}
