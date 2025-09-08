/**
 * 📊 Données de test réutilisables
 */

/**
 * Utilisateur de test par défaut
 */
export const DEFAULT_TEST_USER = {
  name: "Test User",
  email: "test@emailight.com",
  password: "TestPassword123!",
};

/**
 * Utilisateur admin de test
 */
export const ADMIN_TEST_USER = {
  name: "Admin User",
  email: "admin@emailight.com",
  password: "AdminPassword123!",
};

/**
 * Données de test pour l'inscription
 */
export const REGISTER_TEST_DATA = {
  valid: {
    name: "John Doe",
    email: "john.doe@emailight.com",
    password: "SecurePassword123!",
  },
  invalid: {
    shortName: {
      name: "J",
      email: "short.name@emailight.com",
      password: "SecurePassword123!",
    },
    invalidEmail: {
      name: "John Doe",
      email: "not-an-email",
      password: "SecurePassword123!",
    },
    shortPassword: {
      name: "John Doe",
      email: "short.pass@emailight.com",
      password: "123",
    },
    missingName: {
      email: "no.name@emailight.com",
      password: "SecurePassword123!",
    },
    missingEmail: {
      name: "John Doe",
      password: "SecurePassword123!",
    },
    missingPassword: {
      name: "John Doe",
      email: "no.pass@emailight.com",
    },
  },
};

/**
 * Données de test pour la connexion
 */
export const LOGIN_TEST_DATA = {
  valid: {
    email: "john.doe@emailight.com",
    password: "SecurePassword123!",
  },
  invalid: {
    wrongEmail: {
      email: "wrong@emailight.com",
      password: "SecurePassword123!",
    },
    wrongPassword: {
      email: "john.doe@emailight.com",
      password: "WrongPassword123!",
    },
    missingEmail: {
      password: "SecurePassword123!",
    },
    missingPassword: {
      email: "john.doe@emailight.com",
    },
    invalidEmail: {
      email: "not-an-email",
      password: "SecurePassword123!",
    },
  },
};

/**
 * Données de test pour la mise à jour de profil
 */
export const PROFILE_UPDATE_TEST_DATA = {
  valid: {
    name: "John Updated",
    email: "john.updated@emailight.com",
  },
  invalid: {
    shortName: {
      name: "J",
    },
    longName: {
      name: "A".repeat(101),
    },
    invalidEmail: {
      email: "not-an-email",
    },
    longEmail: {
      email: "a".repeat(250) + "@emailight.com",
    },
    emptyName: {
      name: "",
    },
    emptyEmail: {
      email: "",
    },
    spacesOnlyName: {
      name: "   ",
    },
    emailWithSpaces: {
      email: "john doe@emailight.com",
    },
  },
};

/**
 * Données de test pour le changement de mot de passe
 */
export const PASSWORD_CHANGE_TEST_DATA = {
  valid: {
    currentPassword: "OldPassword123!",
    newPassword: "NewPassword123!",
  },
  invalid: {
    wrongCurrentPassword: {
      currentPassword: "WrongPassword123!",
      newPassword: "NewPassword123!",
    },
    shortNewPassword: {
      currentPassword: "OldPassword123!",
      newPassword: "123",
    },
    weakNewPassword: {
      currentPassword: "OldPassword123!",
      newPassword: "weakpassword",
    },
    missingCurrentPassword: {
      newPassword: "NewPassword123!",
    },
    missingNewPassword: {
      currentPassword: "OldPassword123!",
    },
  },
};

/**
 * Données de test pour la suppression de compte
 */
export const ACCOUNT_DELETE_TEST_DATA = {
  valid: {
    password: "TestPassword123!",
  },
  invalid: {
    wrongPassword: {
      password: "WrongPassword123!",
    },
    missingPassword: {},
  },
};

/**
 * Messages d'erreur attendus
 */
export const EXPECTED_ERROR_MESSAGES = {
  FR: {
    USER_EXISTS: "Un compte avec cette adresse email existe déjà",
    VALIDATION_ERROR: {
      password_min: "Le mot de passe doit contenir au moins 6 caractères",
      email_invalid: "Format d'email invalide",
      name_min: "Le nom doit contenir au moins 2 caractères",
      name_required: "Le nom est requis",
      email_required: "L'email est requis",
      password_required: "Le mot de passe est requis",
      refresh_token_required: "Le token de rafraîchissement est requis",
      refresh_token_invalid: "Format du token de rafraîchissement invalide",
    },
    INVALID_CREDENTIALS: "Identifiants invalides",
    TOKEN_EXPIRED: "Token expiré",
    TOKEN_EXPIRED_REFRESH: "Token de rafraîchissement expiré",
    MISSING_TOKEN: "Token d'accès requis",
    INVALID_TOKEN: "Token invalide",
    TOKEN_REVOKED: "Token révoqué",
    USER_NOT_FOUND: "Utilisateur introuvable",
  },
  EN: {
    USER_EXISTS: "An account with this email address already exists",
    VALIDATION_ERROR: {
      password_min: "Password must be at least 6 characters long",
      email_invalid: "Invalid email format",
      name_min: "Name must be at least 2 characters long",
      name_required: "Name is required",
      email_required: "Email is required",
      password_required: "Password is required",
      refresh_token_required: "Refresh token is required",
      refresh_token_invalid: "Invalid refresh token format",
    },
    INVALID_CREDENTIALS: "Invalid credentials",
    TOKEN_EXPIRED: "Token expired",
    TOKEN_EXPIRED_REFRESH: "Refresh token expired",
    MISSING_TOKEN: "Access token required",
    INVALID_TOKEN: "Invalid token",
    TOKEN_REVOKED: "Token revoked",
    USER_NOT_FOUND: "User not found",
  },
};

/**
 * Messages de succès attendus
 */
export const EXPECTED_SUCCESS_MESSAGES = {
  FR: {
    account_created: "Compte créé avec succès",
    login_success: "Connexion réussie",
    token_refreshed: "Token rafraîchi avec succès",
    logout_success: "Déconnexion réussie",
    profile_updated: "Profil mis à jour avec succès",
    password_changed: "Mot de passe modifié avec succès",
    account_deleted: "Compte utilisateur supprimé définitivement",
    avatar_uploaded: "Avatar mis à jour avec succès",
    avatar_deleted: "Avatar supprimé avec succès",
  },
  EN: {
    account_created: "Account created successfully",
    login_success: "Login successful",
    token_refreshed: "Token refreshed successfully",
    logout_success: "Logout successful",
    profile_updated: "Profile updated successfully",
    password_changed: "Password changed successfully",
    account_deleted: "User account permanently deleted",
    avatar_uploaded: "Avatar updated successfully",
    avatar_deleted: "Avatar deleted successfully",
  },
};
