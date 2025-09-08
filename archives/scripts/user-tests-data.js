// ============================================================================
// 📁 scripts/user-tests-data.js - Données des tests utilisateur
// ============================================================================

/**
 * 📊 Données des tests utilisateur extraites du script user-testing.js
 */
export const USER_TEST_DATA = {
  getProfile: {
    total: 2,
    tests: [
      {
        name: "Get Profile - Succès (FR)",
        method: "GET",
        path: "/api/v1/users/me",
        request: null,
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "fr-FR",
        },
        response: {
          status: 200,
          body: {
            status: "success",
            data: {
              id: "68ba3aed82a4d774c9cc4078",
              name: "Test User",
              email: "test-user@example.com",
              subscriptionStatus: "free",
              isEmailVerified: false,
              isActive: true,
              profilePictureUrl: null,
            },
            message: "Profil récupéré avec succès",
          },
        },
      },
      {
        name: "Get Profile - Succès (EN)",
        method: "GET",
        path: "/api/v1/users/me",
        request: null,
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "en-US",
        },
        response: {
          status: 200,
          body: {
            status: "success",
            data: {
              id: "68ba3aed82a4d774c9cc4078",
              name: "Test User",
              email: "test-user@example.com",
              subscriptionStatus: "free",
              isEmailVerified: false,
              isActive: true,
              profilePictureUrl: null,
            },
            message: "Profile retrieved successfully",
          },
        },
      },
    ],
  },

  updateProfile: {
    total: 30,
    tests: [
      {
        name: "Update Profile - Nom valide (FR)",
        method: "PATCH",
        path: "/api/v1/users/me",
        request: { name: "cheikh" },
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "fr-FR",
        },
        response: {
          status: 200,
          body: {
            status: "success",
            data: {
              id: "68ba3aed82a4d774c9cc4078",
              name: "cheikh",
              email: "test-user@example.com",
            },
            message: "Profil mis à jour avec succès",
          },
        },
      },
      {
        name: "Update Profile - Nom valide (EN)",
        method: "PATCH",
        path: "/api/v1/users/me",
        request: { name: "cheikh" },
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "en-US",
        },
        response: {
          status: 200,
          body: {
            status: "success",
            data: {
              id: "68ba3aed82a4d774c9cc4078",
              name: "cheikh",
              email: "test-user@example.com",
            },
            message: "Profile updated successfully",
          },
        },
      },
      {
        name: "Update Profile - Nom trop court (FR)",
        method: "PATCH",
        path: "/api/v1/users/me",
        request: { name: "A" },
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "fr-FR",
        },
        response: {
          status: 400,
          body: {
            status: "failed",
            errorCode: "400",
            errorName: "VALIDATION_ERROR",
            errorMessage: "Le nom doit contenir au moins 2 caractères",
          },
        },
      },
      {
        name: "Update Profile - Nom trop court (EN)",
        method: "PATCH",
        path: "/api/v1/users/me",
        request: { name: "A" },
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "en-US",
        },
        response: {
          status: 400,
          body: {
            status: "failed",
            errorCode: "400",
            errorName: "VALIDATION_ERROR",
            errorMessage: "Name must be at least 2 characters long",
          },
        },
      },
      {
        name: "Update Profile - Nom trop long (FR)",
        method: "PATCH",
        path: "/api/v1/users/me",
        request: { name: "A".repeat(101) },
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "fr-FR",
        },
        response: {
          status: 400,
          body: {
            status: "failed",
            errorCode: "400",
            errorName: "VALIDATION_ERROR",
            errorMessage: "Le nom ne peut pas dépasser 100 caractères",
          },
        },
      },
      {
        name: "Update Profile - Email invalide (FR)",
        method: "PATCH",
        path: "/api/v1/users/me",
        request: { email: "invalid-email" },
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "fr-FR",
        },
        response: {
          status: 400,
          body: {
            status: "failed",
            errorCode: "400",
            errorName: "VALIDATION_ERROR",
            errorMessage: "Format d'email invalide",
          },
        },
      },
      {
        name: "Update Profile - Aucun champ (FR)",
        method: "PATCH",
        path: "/api/v1/users/me",
        request: {},
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "fr-FR",
        },
        response: {
          status: 400,
          body: {
            status: "failed",
            errorCode: "400",
            errorName: "VALIDATION_ERROR",
            errorMessage:
              "Au moins un champ doit être fourni pour la mise à jour",
          },
        },
      },
      {
        name: "Update Profile - Nom vide (FR)",
        method: "PATCH",
        path: "/api/v1/users/me",
        request: { name: "" },
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "fr-FR",
        },
        response: {
          status: 400,
          body: {
            status: "failed",
            errorCode: "400",
            errorName: "VALIDATION_ERROR",
            errorMessage: "Le nom ne peut pas être vide",
          },
        },
      },
      {
        name: "Update Profile - Email vide (FR)",
        method: "PATCH",
        path: "/api/v1/users/me",
        request: { email: "" },
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "fr-FR",
        },
        response: {
          status: 400,
          body: {
            status: "failed",
            errorCode: "400",
            errorName: "VALIDATION_ERROR",
            errorMessage: "L'email ne peut pas être vide",
          },
        },
      },
      {
        name: "Update Profile - Nom avec chiffres (FR)",
        method: "PATCH",
        path: "/api/v1/users/me",
        request: { name: "Cheikh123" },
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "fr-FR",
        },
        response: {
          status: 200,
          body: {
            status: "success",
            data: {
              id: "68ba3aed82a4d774c9cc4078",
              name: "Cheikh123",
              email: "test-user@example.com",
            },
            message: "Profil mis à jour avec succès",
          },
        },
      },
      {
        name: "Update Profile - Nom avec caractères spéciaux (FR)",
        method: "PATCH",
        path: "/api/v1/users/me",
        request: { name: "Cheikh-O'Connor" },
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "fr-FR",
        },
        response: {
          status: 200,
          body: {
            status: "success",
            data: {
              id: "68ba3aed82a4d774c9cc4078",
              name: "Cheikh-O'Connor",
              email: "test-user@example.com",
            },
            message: "Profil mis à jour avec succès",
          },
        },
      },
      {
        name: "Update Profile - Nom avec espaces seulement (FR)",
        method: "PATCH",
        path: "/api/v1/users/me",
        request: { name: "   " },
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "fr-FR",
        },
        response: {
          status: 400,
          body: {
            status: "failed",
            errorCode: "400",
            errorName: "VALIDATION_ERROR",
            errorMessage: "Le nom ne peut pas être vide",
          },
        },
      },
      {
        name: "Update Profile - Email trop long (FR)",
        method: "PATCH",
        path: "/api/v1/users/me",
        request: { email: "a".repeat(250) + "@example.com" },
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "fr-FR",
        },
        response: {
          status: 400,
          body: {
            status: "failed",
            errorCode: "400",
            errorName: "VALIDATION_ERROR",
            errorMessage: "Format d'email invalide",
          },
        },
      },
      {
        name: "Update Profile - Email avec espaces (FR)",
        method: "PATCH",
        path: "/api/v1/users/me",
        request: { email: "  user@example.com  " },
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "fr-FR",
        },
        response: {
          status: 200,
          body: {
            status: "success",
            data: {
              id: "68ba3aed82a4d774c9cc4078",
              name: "Test User",
              email: "user@example.com",
            },
            message: "Profil mis à jour avec succès",
          },
        },
      },
      {
        name: "Update Profile - Champs vides (FR)",
        method: "PATCH",
        path: "/api/v1/users/me",
        request: { name: "", email: "" },
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "fr-FR",
        },
        response: {
          status: 400,
          body: {
            status: "failed",
            errorCode: "400",
            errorName: "VALIDATION_ERROR",
            errorMessage: "Le nom ne peut pas être vide",
          },
        },
      },
      {
        name: "Update Profile - Email valide (FR)",
        method: "PATCH",
        path: "/api/v1/users/me",
        request: { email: "test-valid@example.com" },
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "fr-FR",
        },
        response: {
          status: 200,
          body: {
            status: "success",
            data: {
              id: "68ba3aed82a4d774c9cc4078",
              name: "Test User",
              email: "test-valid@example.com",
            },
            message: "Profil mis à jour avec succès",
          },
        },
      },
      {
        name: "Update Profile - Nom avec chiffres (EN)",
        method: "PATCH",
        path: "/api/v1/users/me",
        request: { name: "Cheikh123" },
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "en-US",
        },
        response: {
          status: 200,
          body: {
            status: "success",
            data: {
              id: "68ba3aed82a4d774c9cc4078",
              name: "Cheikh123",
              email: "test-user@example.com",
            },
            message: "Profile updated successfully",
          },
        },
      },
      {
        name: "Update Profile - Nom avec caractères spéciaux (EN)",
        method: "PATCH",
        path: "/api/v1/users/me",
        request: { name: "Cheikh-O'Connor" },
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "en-US",
        },
        response: {
          status: 200,
          body: {
            status: "success",
            data: {
              id: "68ba3aed82a4d774c9cc4078",
              name: "Cheikh-O'Connor",
              email: "test-user@example.com",
            },
            message: "Profile updated successfully",
          },
        },
      },
      {
        name: "Update Profile - Email déjà existant (FR)",
        method: "PATCH",
        path: "/api/v1/users/me",
        request: { email: "admin@example.com" },
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "fr-FR",
        },
        response: {
          status: 409,
          body: {
            status: "failed",
            errorCode: "409",
            errorName: "CONFLICT",
            errorMessage: "Un compte avec cette adresse email existe déjà",
          },
        },
      },
    ],
  },

  uploadAvatar: {
    total: 14,
    tests: [
      {
        name: "Upload Avatar - Succès (FR)",
        method: "POST",
        path: "/api/v1/users/me/avatar",
        request: "multipart/form-data avec fichier image",
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "fr-FR",
          "Content-Type": "multipart/form-data",
        },
        response: {
          status: 200,
          body: {
            status: "success",
            data: {
              fileName:
                "avatar_68ba3aed82a4d774c9cc4078_1751374774367_a5acc6b790b0c284.jpg",
              avatarUrl:
                "/uploads/avatars/avatar_68ba3aed82a4d774c9cc4078_1751374774367_a5acc6b790b0c284.jpg",
            },
            message: "Avatar mis à jour avec succès",
          },
        },
      },
      {
        name: "Upload Avatar - Succès (EN)",
        method: "POST",
        path: "/api/v1/users/me/avatar",
        request: "multipart/form-data avec fichier image",
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "en-US",
          "Content-Type": "multipart/form-data",
        },
        response: {
          status: 200,
          body: {
            status: "success",
            data: {
              fileName:
                "avatar_68ba3aed82a4d774c9cc4078_1751374774367_a5acc6b790b0c284.jpg",
              avatarUrl:
                "/uploads/avatars/avatar_68ba3aed82a4d774c9cc4078_1751374774367_a5acc6b790b0c284.jpg",
            },
            message: "Avatar updated successfully",
          },
        },
      },
      {
        name: "Upload Avatar - Pas de fichier (FR)",
        method: "POST",
        path: "/api/v1/users/me/avatar",
        request: "multipart/form-data vide",
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "fr-FR",
          "Content-Type": "multipart/form-data",
        },
        response: {
          status: 400,
          body: {
            status: "failed",
            errorCode: "400",
            errorName: "NO_FILE_PROVIDED",
            errorMessage:
              "Veuillez sélectionner un fichier image pour votre avatar",
          },
        },
      },
      {
        name: "Upload Avatar - Image JPEG valide (FR)",
        method: "POST",
        path: "/api/v1/users/me/avatar",
        request: "multipart/form-data avec fichier JPEG",
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "fr-FR",
          "Content-Type": "multipart/form-data",
        },
        response: {
          status: 200,
          body: {
            status: "success",
            data: {
              fileName:
                "avatar_68ba3aed82a4d774c9cc4078_1751374774367_a5acc6b790b0c284.jpg",
              avatarUrl:
                "/uploads/avatars/avatar_68ba3aed82a4d774c9cc4078_1751374774367_a5acc6b790b0c284.jpg",
            },
            message: "Avatar mis à jour avec succès",
          },
        },
      },
      {
        name: "Upload Avatar - Image PNG valide (FR)",
        method: "POST",
        path: "/api/v1/users/me/avatar",
        request: "multipart/form-data avec fichier PNG",
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "fr-FR",
          "Content-Type": "multipart/form-data",
        },
        response: {
          status: 200,
          body: {
            status: "success",
            data: {
              fileName:
                "avatar_68ba3aed82a4d774c9cc4078_1751374774367_a5acc6b790b0c284.png",
              avatarUrl:
                "/uploads/avatars/avatar_68ba3aed82a4d774c9cc4078_1751374774367_a5acc6b790b0c284.png",
            },
            message: "Avatar mis à jour avec succès",
          },
        },
      },
      {
        name: "Upload Avatar - Image WebP valide (FR)",
        method: "POST",
        path: "/api/v1/users/me/avatar",
        request: "multipart/form-data avec fichier WebP",
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "fr-FR",
          "Content-Type": "multipart/form-data",
        },
        response: {
          status: 200,
          body: {
            status: "success",
            data: {
              fileName:
                "avatar_68ba3aed82a4d774c9cc4078_1751374774367_a5acc6b790b0c284.webp",
              avatarUrl:
                "/uploads/avatars/avatar_68ba3aed82a4d774c9cc4078_1751374774367_a5acc6b790b0c284.webp",
            },
            message: "Avatar mis à jour avec succès",
          },
        },
      },
      {
        name: "Upload Avatar - Image GIF valide (FR)",
        method: "POST",
        path: "/api/v1/users/me/avatar",
        request: "multipart/form-data avec fichier GIF",
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "fr-FR",
          "Content-Type": "multipart/form-data",
        },
        response: {
          status: 200,
          body: {
            status: "success",
            data: {
              fileName:
                "avatar_68ba3aed82a4d774c9cc4078_1751374774367_a5acc6b790b0c284.gif",
              avatarUrl:
                "/uploads/avatars/avatar_68ba3aed82a4d774c9cc4078_1751374774367_a5acc6b790b0c284.gif",
            },
            message: "Avatar mis à jour avec succès",
          },
        },
      },
      {
        name: "Upload Avatar - Image BMP valide (FR)",
        method: "POST",
        path: "/api/v1/users/me/avatar",
        request: "multipart/form-data avec fichier BMP",
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "fr-FR",
          "Content-Type": "multipart/form-data",
        },
        response: {
          status: 200,
          body: {
            status: "success",
            data: {
              fileName:
                "avatar_68ba3aed82a4d774c9cc4078_1751374774367_a5acc6b790b0c284.bmp",
              avatarUrl:
                "/uploads/avatars/avatar_68ba3aed82a4d774c9cc4078_1751374774367_a5acc6b790b0c284.bmp",
            },
            message: "Avatar mis à jour avec succès",
          },
        },
      },
      {
        name: "Upload Avatar - Fichier trop volumineux (FR)",
        method: "POST",
        path: "/api/v1/users/me/avatar",
        request: "multipart/form-data avec fichier > 5MB",
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "fr-FR",
          "Content-Type": "multipart/form-data",
        },
        response: {
          status: 400,
          body: {
            status: "failed",
            errorCode: "400",
            errorName: "FILE_TOO_LARGE",
            errorMessage:
              "Le fichier est trop volumineux. Taille maximale autorisée : 5 MB",
          },
        },
      },
      {
        name: "Upload Avatar - Format non supporté (FR)",
        method: "POST",
        path: "/api/v1/users/me/avatar",
        request: "multipart/form-data avec fichier SVG",
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "fr-FR",
          "Content-Type": "multipart/form-data",
        },
        response: {
          status: 400,
          body: {
            status: "failed",
            errorCode: "400",
            errorName: "UNSUPPORTED_FILE_TYPE",
            errorMessage:
              "Type de fichier non supporté. Formats acceptés : JPEG, PNG, GIF, WebP, BMP",
          },
        },
      },
    ],
  },

  deleteAvatar: {
    total: 4,
    tests: [
      {
        name: "Delete Avatar - Pas d'avatar (FR)",
        method: "DELETE",
        path: "/api/v1/users/me/avatar",
        request: null,
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "fr-FR",
        },
        response: {
          status: 400,
          body: {
            status: "failed",
            errorCode: "400",
            errorName: "NO_AVATAR_TO_DELETE",
            errorMessage: "Aucun avatar à supprimer",
          },
        },
      },
      {
        name: "Delete Avatar - Pas d'avatar (EN)",
        method: "DELETE",
        path: "/api/v1/users/me/avatar",
        request: null,
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "en-US",
        },
        response: {
          status: 400,
          body: {
            status: "failed",
            errorCode: "400",
            errorName: "NO_AVATAR_TO_DELETE",
            errorMessage: "No avatar to delete",
          },
        },
      },
      {
        name: "Delete Avatar - Avec avatar (FR)",
        method: "DELETE",
        path: "/api/v1/users/me/avatar",
        request: null,
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "fr-FR",
        },
        response: {
          status: 200,
          body: {
            status: "success",
            message: "Avatar supprimé",
          },
        },
      },
      {
        name: "Delete Avatar - Avec avatar (EN)",
        method: "DELETE",
        path: "/api/v1/users/me/avatar",
        request: null,
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "en-US",
        },
        response: {
          status: 200,
          body: {
            status: "success",
            message: "Avatar deleted",
          },
        },
      },
    ],
  },

  changePassword: {
    total: 20,
    tests: [
      {
        name: "Change Password - Succès (FR)",
        method: "PATCH",
        path: "/api/v1/users/me/password",
        request: {
          currentPassword: "TestPassword123",
          newPassword: "NewPassword123",
        },
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "fr-FR",
        },
        response: {
          status: 200,
          body: {
            status: "success",
            message: "Mot de passe changé avec succès",
          },
        },
      },
      {
        name: "Change Password - Succès (EN)",
        method: "PATCH",
        path: "/api/v1/users/me/password",
        request: {
          currentPassword: "TestPassword123",
          newPassword: "NewPassword456",
        },
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "en-US",
        },
        response: {
          status: 200,
          body: {
            status: "success",
            message: "Password changed successfully",
          },
        },
      },
      {
        name: "Change Password - Mot de passe actuel incorrect (FR)",
        method: "PATCH",
        path: "/api/v1/users/me/password",
        request: {
          currentPassword: "WrongPassword123",
          newPassword: "AnotherPassword123",
        },
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "fr-FR",
        },
        response: {
          status: 401,
          body: {
            status: "failed",
            errorCode: "401",
            errorName: "INVALID_CREDENTIALS",
            errorMessage: "Le mot de passe actuel est incorrect",
          },
        },
      },
      {
        name: "Change Password - Nouveau mot de passe trop court (FR)",
        method: "PATCH",
        path: "/api/v1/users/me/password",
        request: {
          currentPassword: "TestPassword123",
          newPassword: "123",
        },
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "fr-FR",
        },
        response: {
          status: 400,
          body: {
            status: "failed",
            errorCode: "400",
            errorName: "VALIDATION_ERROR",
            errorMessage:
              "Le nouveau mot de passe doit contenir au moins 6 caractères",
          },
        },
      },
      {
        name: "Change Password - Nouveau mot de passe faible (FR)",
        method: "PATCH",
        path: "/api/v1/users/me/password",
        request: {
          currentPassword: "TestPassword123",
          newPassword: "password",
        },
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "fr-FR",
        },
        response: {
          status: 400,
          body: {
            status: "failed",
            errorCode: "400",
            errorName: "VALIDATION_ERROR",
            errorMessage:
              "Le nouveau mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre",
          },
        },
      },
      {
        name: "Change Password - Mot de passe actuel manquant (FR)",
        method: "PATCH",
        path: "/api/v1/users/me/password",
        request: {
          newPassword: "NewPassword123",
        },
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "fr-FR",
        },
        response: {
          status: 400,
          body: {
            status: "failed",
            errorCode: "400",
            errorName: "VALIDATION_ERROR",
            errorMessage: "Le mot de passe actuel est requis",
          },
        },
      },
      {
        name: "Change Password - Nouveau mot de passe manquant (FR)",
        method: "PATCH",
        path: "/api/v1/users/me/password",
        request: {
          currentPassword: "TestPassword123",
        },
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "fr-FR",
        },
        response: {
          status: 400,
          body: {
            status: "failed",
            errorCode: "400",
            errorName: "VALIDATION_ERROR",
            errorMessage: "Le nouveau mot de passe est requis",
          },
        },
      },
      {
        name: "Change Password - Nouveau mot de passe trop court (EN)",
        method: "PATCH",
        path: "/api/v1/users/me/password",
        request: {
          currentPassword: "TestPassword123",
          newPassword: "123",
        },
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "en-US",
        },
        response: {
          status: 400,
          body: {
            status: "failed",
            errorCode: "400",
            errorName: "VALIDATION_ERROR",
            errorMessage: "New password must be at least 6 characters long",
          },
        },
      },
      {
        name: "Change Password - Nouveau mot de passe faible (EN)",
        method: "PATCH",
        path: "/api/v1/users/me/password",
        request: {
          currentPassword: "TestPassword123",
          newPassword: "password",
        },
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "en-US",
        },
        response: {
          status: 400,
          body: {
            status: "failed",
            errorCode: "400",
            errorName: "VALIDATION_ERROR",
            errorMessage:
              "New password must contain at least one lowercase letter, one uppercase letter and one number",
          },
        },
      },
      {
        name: "Change Password - Mot de passe actuel manquant (EN)",
        method: "PATCH",
        path: "/api/v1/users/me/password",
        request: {
          newPassword: "NewPassword123",
        },
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "en-US",
        },
        response: {
          status: 400,
          body: {
            status: "failed",
            errorCode: "400",
            errorName: "VALIDATION_ERROR",
            errorMessage: "Current password is required",
          },
        },
      },
      {
        name: "Change Password - Nouveau mot de passe manquant (EN)",
        method: "PATCH",
        path: "/api/v1/users/me/password",
        request: {
          currentPassword: "TestPassword123",
        },
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "en-US",
        },
        response: {
          status: 400,
          body: {
            status: "failed",
            errorCode: "400",
            errorName: "VALIDATION_ERROR",
            errorMessage: "New password is required",
          },
        },
      },
    ],
  },

  deleteAccount: {
    total: 5,
    tests: [
      {
        name: "Delete Account - Mot de passe incorrect (FR)",
        method: "DELETE",
        path: "/api/v1/users/me",
        request: {
          password: "WrongPassword123",
        },
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "fr-FR",
        },
        response: {
          status: 401,
          body: {
            status: "failed",
            errorCode: "401",
            errorName: "UNAUTHORIZED",
            errorMessage: "Le mot de passe actuel est incorrect",
          },
        },
      },
      {
        name: "Delete Account - Mot de passe incorrect (EN)",
        method: "DELETE",
        path: "/api/v1/users/me",
        request: {
          password: "WrongPassword123",
        },
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "en-US",
        },
        response: {
          status: 401,
          body: {
            status: "failed",
            errorCode: "401",
            errorName: "UNAUTHORIZED",
            errorMessage: "Current password is incorrect",
          },
        },
      },
      {
        name: "Delete Account - Succès (FR)",
        method: "DELETE",
        path: "/api/v1/users/me",
        request: {
          password: "TestPassword123",
        },
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "fr-FR",
        },
        response: {
          status: 200,
          body: {
            status: "success",
            message: "Compte utilisateur supprimé définitivement",
          },
        },
      },
      {
        name: "Delete Account - Succès (EN)",
        method: "DELETE",
        path: "/api/v1/users/me",
        request: {
          password: "TestPassword123",
        },
        headers: {
          Authorization: "Bearer [valid_token]",
          "Accept-Language": "en-US",
        },
        response: {
          status: 200,
          body: {
            status: "success",
            message: "User account permanently deleted",
          },
        },
      },
      {
        name: "Delete Account - Utilisateur déjà supprimé",
        method: "DELETE",
        path: "/api/v1/users/me",
        request: {
          password: "TestPassword123",
        },
        headers: {
          Authorization: "Bearer [deleted_user_token]",
          "Accept-Language": "fr-FR",
        },
        response: {
          status: 401,
          body: {
            status: "failed",
            errorCode: "401",
            errorName: "USER_NOT_FOUND",
            errorMessage: "Utilisateur introuvable",
          },
        },
      },
    ],
  },
};

/**
 * 🔐 Tests d'authentification pour les routes protégées
 */
export const AUTH_TESTS_FOR_PROTECTED_ROUTES = {
  getProfile: {
    total: 10,
    tests: [
      {
        name: "GET Profile - Token manquant (FR)",
        method: "GET",
        path: "/api/v1/users/me",
        request: null,
        headers: { "Accept-Language": "fr-FR" },
        response: {
          status: 401,
          body: {
            status: "failed",
            errorCode: "401",
            errorName: "MISSING_TOKEN",
            errorMessage: "Token d'accès requis",
          },
        },
      },
      {
        name: "GET Profile - Token manquant (EN)",
        method: "GET",
        path: "/api/v1/users/me",
        request: null,
        headers: { "Accept-Language": "en-US" },
        response: {
          status: 401,
          body: {
            status: "failed",
            errorCode: "401",
            errorName: "MISSING_TOKEN",
            errorMessage: "Access token required",
          },
        },
      },
      {
        name: "GET Profile - Token invalide (FR)",
        method: "GET",
        path: "/api/v1/users/me",
        request: null,
        headers: {
          Authorization: "Bearer abc123",
          "Accept-Language": "fr-FR",
        },
        response: {
          status: 401,
          body: {
            status: "failed",
            errorCode: "401",
            errorName: "INVALID_TOKEN",
            errorMessage: "Token invalide",
          },
        },
      },
      {
        name: "GET Profile - Token invalide (EN)",
        method: "GET",
        path: "/api/v1/users/me",
        request: null,
        headers: {
          Authorization: "Bearer abc123",
          "Accept-Language": "en-US",
        },
        response: {
          status: 401,
          body: {
            status: "failed",
            errorCode: "401",
            errorName: "INVALID_TOKEN",
            errorMessage: "Invalid token",
          },
        },
      },
      {
        name: "GET Profile - Token expiré (FR)",
        method: "GET",
        path: "/api/v1/users/me",
        request: null,
        headers: {
          Authorization: "Bearer [expired_token]",
          "Accept-Language": "fr-FR",
        },
        response: {
          status: 401,
          body: {
            status: "failed",
            errorCode: "401",
            errorName: "TOKEN_EXPIRED",
            errorMessage: "Token expiré",
          },
        },
      },
      {
        name: "GET Profile - Token expiré (EN)",
        method: "GET",
        path: "/api/v1/users/me",
        request: null,
        headers: {
          Authorization: "Bearer [expired_token]",
          "Accept-Language": "en-US",
        },
        response: {
          status: 401,
          body: {
            status: "failed",
            errorCode: "401",
            errorName: "TOKEN_EXPIRED",
            errorMessage: "Token expired",
          },
        },
      },
      {
        name: "GET Profile - Token blacklisté (FR)",
        method: "GET",
        path: "/api/v1/users/me",
        request: null,
        headers: {
          Authorization: "Bearer [blacklisted_token]",
          "Accept-Language": "fr-FR",
        },
        response: {
          status: 401,
          body: {
            status: "failed",
            errorCode: "401",
            errorName: "TOKEN_REVOKED",
            errorMessage: "Token révoqué",
          },
        },
      },
      {
        name: "GET Profile - Token blacklisté (EN)",
        method: "GET",
        path: "/api/v1/users/me",
        request: null,
        headers: {
          Authorization: "Bearer [blacklisted_token]",
          "Accept-Language": "en-US",
        },
        response: {
          status: 401,
          body: {
            status: "failed",
            errorCode: "401",
            errorName: "TOKEN_REVOKED",
            errorMessage: "Token revoked",
          },
        },
      },
      {
        name: "GET Profile - Utilisateur supprimé (FR)",
        method: "GET",
        path: "/api/v1/users/me",
        request: null,
        headers: {
          Authorization: "Bearer [deleted_user_token]",
          "Accept-Language": "fr-FR",
        },
        response: {
          status: 401,
          body: {
            status: "failed",
            errorCode: "401",
            errorName: "USER_NOT_FOUND",
            errorMessage: "Utilisateur introuvable",
          },
        },
      },
      {
        name: "GET Profile - Utilisateur supprimé (EN)",
        method: "GET",
        path: "/api/v1/users/me",
        request: null,
        headers: {
          Authorization: "Bearer [deleted_user_token]",
          "Accept-Language": "en-US",
        },
        response: {
          status: 401,
          body: {
            status: "failed",
            errorCode: "401",
            errorName: "USER_NOT_FOUND",
            errorMessage: "User not found",
          },
        },
      },
    ],
  },
};

