/**
 * ✅ Validateurs pour les réponses API
 *
 * Ces helpers valident les réponses de l'API selon le rapport de test API.
 *
 * IMPORTANT : Validation conditionnelle des messages d'erreur
 * - Si expectedMessage = null : ne valide que l'errorName (pour gérer les cas où le même errorName a des messages différents selon le contexte)
 * - Si expectedMessage ≠ null : valide le message spécifique
 *
 * Exemple : INVALID_CREDENTIALS
 * - LOGIN : "Identifiants invalides" / "Invalid credentials"
 * - PASSWORD CHANGE : "Le mot de passe actuel est incorrect" / "Current password is incorrect"
 *
 * La validation conditionnelle permet de gérer ce cas sans trahir les retours réels de l'API.
 */

/**
 * Valide une réponse de succès
 */
export function validateSuccessResponse(
  response,
  expectedMessage,
  lang = "FR"
) {
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
 * Valide une réponse de succès pour refresh-token
 */
export function validateRefreshTokenSuccessResponse(
  response,
  expectedMessage,
  lang = "FR"
) {
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
 * Valide une réponse de succès pour logout
 */
export function validateLogoutSuccessResponse(
  response,
  expectedMessage,
  lang = "FR"
) {
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
    throw new Error("Le champ 'data' ne devrait pas être présent pour logout");
  }

  return true;
}

/**
 * Valide une réponse d'erreur
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
      new_password_min_length: {
        FR: "Le nouveau mot de passe doit contenir au moins 6 caractères",
        EN: "New password must be at least 6 characters long",
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
    // INVALID_CREDENTIALS : utilisé pour LOGIN avec "Identifiants invalides"
    // Pour PASSWORD CHANGE, l'API retourne aussi INVALID_CREDENTIALS mais avec "Le mot de passe actuel est incorrect"
    // La validation conditionnelle (expectedMessage = null) permet de gérer ce cas
    INVALID_CREDENTIALS: {
      FR: "Identifiants invalides",
      EN: "Invalid credentials",
    },
    INVALID_CURRENT_PASSWORD: {
      FR: "Le mot de passe actuel est incorrect",
      EN: "Current password is incorrect",
    },
    UNAUTHORIZED: {
      FR: "Le mot de passe actuel est incorrect",
      EN: "Current password is incorrect",
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
    TOKEN_REVOKED: {
      FR: "Token révoqué",
      EN: "Token revoked",
    },
    USER_NOT_FOUND: {
      FR: "Utilisateur introuvable",
      EN: "User not found",
    },
  };

  // Validation conditionnelle du message d'erreur
  // Permet de valider ou non le message spécifique selon le contexte
  // - Si expectedMessage = null : ne valide que l'errorName (pour INVALID_CREDENTIALS avec messages différents)
  // - Si expectedMessage ≠ null : valide le message spécifique
  if (expectedMessage !== null) {
    const expected =
      expectedMessages[expectedErrorName]?.[expectedMessage]?.[lang] ||
      expectedMessages[expectedErrorName]?.[lang];

    if (expected && body.errorMessage !== expected) {
      throw new Error(
        `Expected message '${expected}', got '${body.errorMessage}'`
      );
    }
  }

  return true;
}
