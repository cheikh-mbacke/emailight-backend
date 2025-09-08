# 🧪 Rapport de Tests API Complet

**Généré le:** 07/09/2025
**URL de base:** http://localhost:3001/api/v1
**Couverture totale:** 172+ tests automatisés

---

## 📊 Résumé de la couverture

### Scripts de test
- **auth-testing.js**: 52 tests (18 register + 14 login + 10 refresh-token + 10 logout)
- **user-testing.js**: 120+ tests (incluant les tests d'authentification pour chaque route)

---

## 🔐 MODULE AUTHENTIFICATION

## POST /api/v1/auth/register (18 tests)

### 1. Register - Succès valide (FR)
**Request:** `POST /api/v1/auth/register`
```json
{
  "name": "cheikh",
  "email": "test-xxxxxx@emailight.com",
  "password": "MotDePasseSecurise123"
}
```
**Headers:** `Accept-Language: fr-FR`

**Response (201):**
```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  },
  "message": "Compte créé avec succès"
}
```

### 2. Register - Succès valide (EN)
**Request:** `POST /api/v1/auth/register`
```json
{
  "name": "cheikh",
  "email": "test-xxxxxx@emailight.com",
  "password": "MotDePasseSecurise123"
}
```
**Headers:** `Accept-Language: en-US`

**Response (201):**
```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  },
  "message": "Account created successfully"
}
```

### 3. Register - Email déjà utilisé (FR)
**Request:** `POST /api/v1/auth/register`
```json
{
  "name": "cheikh",
  "email": "existing@emailight.com",
  "password": "MotDePasseSecurise123"
}
```
**Headers:** `Accept-Language: fr-FR`

**Response (409):**
```json
{
  "status": "failed",
  "errorCode": "409",
  "errorName": "USER_EXISTS",
  "errorMessage": "Un compte avec cette adresse email existe déjà"
}
```

### 4. Register - Email déjà utilisé (EN)
**Request:** `POST /api/v1/auth/register`
```json
{
  "name": "cheikh",
  "email": "existing@emailight.com",
  "password": "MotDePasseSecurise123"
}
```
**Headers:** `Accept-Language: en-US`

**Response (409):**
```json
{
  "status": "failed",
  "errorCode": "409",
  "errorName": "USER_EXISTS",
  "errorMessage": "An account with this email address already exists"
}
```

### 5. Register - Mot de passe trop court (FR)
**Request:** `POST /api/v1/auth/register`
```json
{
  "name": "cheikh",
  "email": "test@emailight.com",
  "password": "abc"
}
```
**Headers:** `Accept-Language: fr-FR`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Le mot de passe doit contenir au moins 6 caractères"
}
```

### 6. Register - Mot de passe trop court (EN)
**Request:** `POST /api/v1/auth/register`
```json
{
  "name": "cheikh",
  "email": "test@emailight.com",
  "password": "abc"
}
```
**Headers:** `Accept-Language: en-US`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Password must be at least 6 characters long"
}
```

### 7. Register - Email invalide (FR)
**Request:** `POST /api/v1/auth/register`
```json
{
  "name": "cheikh",
  "email": "pasunemail",
  "password": "MotDePasseSecurise123"
}
```
**Headers:** `Accept-Language: fr-FR`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Format d'email invalide"
}
```

### 8. Register - Email invalide (EN)
**Request:** `POST /api/v1/auth/register`
```json
{
  "name": "cheikh",
  "email": "pasunemail",
  "password": "MotDePasseSecurise123"
}
```
**Headers:** `Accept-Language: en-US`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Invalid email format"
}
```

### 9. Register - Nom trop court (FR)
**Request:** `POST /api/v1/auth/register`
```json
{
  "name": "c",
  "email": "test@emailight.com",
  "password": "MotDePasseSecurise123"
}
```
**Headers:** `Accept-Language: fr-FR`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Le nom doit contenir au moins 2 caractères"
}
```

### 10. Register - Nom trop court (EN)
**Request:** `POST /api/v1/auth/register`
```json
{
  "name": "c",
  "email": "test@emailight.com",
  "password": "MotDePasseSecurise123"
}
```
**Headers:** `Accept-Language: en-US`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Name must be at least 2 characters long"
}
```

### 11. Register - Nom manquant (FR)
**Request:** `POST /api/v1/auth/register`
```json
{
  "email": "test@emailight.com",
  "password": "MotDePasseSecurise123"
}
```
**Headers:** `Accept-Language: fr-FR`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Le nom est requis"
}
```

### 12. Register - Nom manquant (EN)
**Request:** `POST /api/v1/auth/register`
```json
{
  "email": "test@emailight.com",
  "password": "MotDePasseSecurise123"
}
```
**Headers:** `Accept-Language: en-US`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Name is required"
}
```

### 13. Register - Email manquant (FR)
**Request:** `POST /api/v1/auth/register`
```json
{
  "name": "cheikh",
  "password": "MotDePasseSecurise123"
}
```
**Headers:** `Accept-Language: fr-FR`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "L'email est requis"
}
```

### 14. Register - Email manquant (EN)
**Request:** `POST /api/v1/auth/register`
```json
{
  "name": "cheikh",
  "password": "MotDePasseSecurise123"
}
```
**Headers:** `Accept-Language: en-US`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Email is required"
}
```

### 15. Register - Mot de passe manquant (FR)
**Request:** `POST /api/v1/auth/register`
```json
{
  "name": "cheikh",
  "email": "test@emailight.com"
}
```
**Headers:** `Accept-Language: fr-FR`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Le mot de passe est requis"
}
```

### 16. Register - Mot de passe manquant (EN)
**Request:** `POST /api/v1/auth/register`
```json
{
  "name": "cheikh",
  "email": "test@emailight.com"
}
```
**Headers:** `Accept-Language: en-US`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Password is required"
}
```

### 17. Register - Corps vide (FR)
**Request:** `POST /api/v1/auth/register`
```json
{}
```
**Headers:** `Accept-Language: fr-FR`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Le nom est requis"
}
```

### 18. Register - Corps vide (EN)
**Request:** `POST /api/v1/auth/register`
```json
{}
```
**Headers:** `Accept-Language: en-US`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Name is required"
}
```

## POST /api/v1/auth/login (14 tests)

### 1. Login - Succès valide (FR)
**Request:** `POST /api/v1/auth/login`
```json
{
  "email": "test@emailight.com",
  "password": "MotDePasseSecurise123"
}
```
**Headers:** `Accept-Language: fr-FR`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  },
  "message": "Connexion réussie"
}
```

### 2. Login - Succès valide (EN)
**Request:** `POST /api/v1/auth/login`
```json
{
  "email": "test@emailight.com",
  "password": "MotDePasseSecurise123"
}
```
**Headers:** `Accept-Language: en-US`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  },
  "message": "Login successful"
}
```

### 3. Login - Email inexistant (FR)
**Request:** `POST /api/v1/auth/login`
```json
{
  "email": "inexistant@emailight.com",
  "password": "MotDePasseSecurise123"
}
```
**Headers:** `Accept-Language: fr-FR`

**Response (401):**
```json
{
  "status": "failed",
  "errorCode": "401",
  "errorName": "INVALID_CREDENTIALS",
  "errorMessage": "Identifiants invalides"
}
```

### 4. Login - Email inexistant (EN)
**Request:** `POST /api/v1/auth/login`
```json
{
  "email": "inexistant@emailight.com",
  "password": "MotDePasseSecurise123"
}
```
**Headers:** `Accept-Language: en-US`

**Response (401):**
```json
{
  "status": "failed",
  "errorCode": "401",
  "errorName": "INVALID_CREDENTIALS",
  "errorMessage": "Invalid credentials"
}
```

### 5. Login - Mot de passe incorrect (FR)
**Request:** `POST /api/v1/auth/login`
```json
{
  "email": "test@emailight.com",
  "password": "MauvaisMotDePasse123"
}
```
**Headers:** `Accept-Language: fr-FR`

**Response (401):**
```json
{
  "status": "failed",
  "errorCode": "401",
  "errorName": "INVALID_CREDENTIALS",
  "errorMessage": "Identifiants invalides"
}
```

### 6. Login - Mot de passe incorrect (EN)
**Request:** `POST /api/v1/auth/login`
```json
{
  "email": "test@emailight.com",
  "password": "MauvaisMotDePasse123"
}
```
**Headers:** `Accept-Language: en-US`

**Response (401):**
```json
{
  "status": "failed",
  "errorCode": "401",
  "errorName": "INVALID_CREDENTIALS",
  "errorMessage": "Invalid credentials"
}
```

### 7. Login - Email manquant (FR)
**Request:** `POST /api/v1/auth/login`
```json
{
  "password": "MotDePasseSecurise123"
}
```
**Headers:** `Accept-Language: fr-FR`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "L'email est requis"
}
```

### 8. Login - Email manquant (EN)
**Request:** `POST /api/v1/auth/login`
```json
{
  "password": "MotDePasseSecurise123"
}
```
**Headers:** `Accept-Language: en-US`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Email is required"
}
```

### 9. Login - Mot de passe manquant (FR)
**Request:** `POST /api/v1/auth/login`
```json
{
  "email": "test@emailight.com"
}
```
**Headers:** `Accept-Language: fr-FR`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Le mot de passe est requis"
}
```

### 10. Login - Mot de passe manquant (EN)
**Request:** `POST /api/v1/auth/login`
```json
{
  "email": "test@emailight.com"
}
```
**Headers:** `Accept-Language: en-US`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Password is required"
}
```

### 11. Login - Email invalide (FR)
**Request:** `POST /api/v1/auth/login`
```json
{
  "email": "pasunemail",
  "password": "MotDePasseSecurise123"
}
```
**Headers:** `Accept-Language: fr-FR`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Format d'email invalide"
}
```

### 12. Login - Email invalide (EN)
**Request:** `POST /api/v1/auth/login`
```json
{
  "email": "pasunemail",
  "password": "MotDePasseSecurise123"
}
```
**Headers:** `Accept-Language: en-US`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Invalid email format"
}
```

### 13. Login - Corps vide (FR)
**Request:** `POST /api/v1/auth/login`
```json
{}
```
**Headers:** `Accept-Language: fr-FR`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "L'email est requis"
}
```

### 14. Login - Corps vide (EN)
**Request:** `POST /api/v1/auth/login`
```json
{}
```
**Headers:** `Accept-Language: en-US`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Email is required"
}
```

## POST /api/v1/auth/refresh-token (10 tests)

### 1. Refresh Token - Succès valide (FR)
**Request:** `POST /api/v1/auth/refresh-token`
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
**Headers:** `Accept-Language: fr-FR`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  },
  "message": "Token rafraîchi avec succès"
}
```

### 2. Refresh Token - Succès valide (EN)
**Request:** `POST /api/v1/auth/refresh-token`
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
**Headers:** `Accept-Language: en-US`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  },
  "message": "Token refreshed successfully"
}
```

### 3. Refresh Token - Token manquant (FR)
**Request:** `POST /api/v1/auth/refresh-token`
```json
{}
```
**Headers:** `Accept-Language: fr-FR`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Le token de rafraîchissement est requis"
}
```

### 4. Refresh Token - Token manquant (EN)
**Request:** `POST /api/v1/auth/refresh-token`
```json
{}
```
**Headers:** `Accept-Language: en-US`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Refresh token is required"
}
```

### 5. Refresh Token - Token vide (FR)
**Request:** `POST /api/v1/auth/refresh-token`
```json
{
  "refreshToken": ""
}
```
**Headers:** `Accept-Language: fr-FR`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Le token de rafraîchissement est requis"
}
```

### 6. Refresh Token - Token vide (EN)
**Request:** `POST /api/v1/auth/refresh-token`
```json
{
  "refreshToken": ""
}
```
**Headers:** `Accept-Language: en-US`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Refresh token is required"
}
```

### 7. Refresh Token - Token invalide/malformé (FR)
**Request:** `POST /api/v1/auth/refresh-token`
```json
{
  "refreshToken": "abc"
}
```
**Headers:** `Accept-Language: fr-FR`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Format du token de rafraîchissement invalide"
}
```

### 8. Refresh Token - Token invalide/malformé (EN)
**Request:** `POST /api/v1/auth/refresh-token`
```json
{
  "refreshToken": "abc"
}
```
**Headers:** `Accept-Language: en-US`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Invalid refresh token format"
}
```

### 9. Refresh Token - Token expiré (FR)
**Request:** `POST /api/v1/auth/refresh-token`
```json
{
  "refreshToken": "[expired_token]"
}
```
**Headers:** `Accept-Language: fr-FR`

**Response (401):**
```json
{
  "status": "failed",
  "errorCode": "401",
  "errorName": "TOKEN_EXPIRED",
  "errorMessage": "Token de rafraîchissement expiré"
}
```

### 10. Refresh Token - Token expiré (EN)
**Request:** `POST /api/v1/auth/refresh-token`
```json
{
  "refreshToken": "[expired_token]"
}
```
**Headers:** `Accept-Language: en-US`

**Response (401):**
```json
{
  "status": "failed",
  "errorCode": "401",
  "errorName": "TOKEN_EXPIRED",
  "errorMessage": "Refresh token expired"
}
```

## POST /api/v1/auth/logout (12 tests)

### 1. Logout - Succès valide (FR)
**Request:** `POST /api/v1/auth/logout`
```json
{}
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: fr-FR`

**Response (200):**
```json
{
  "status": "success",
  "message": "Déconnexion réussie"
}
```

### 2. Logout - Succès valide (EN)
**Request:** `POST /api/v1/auth/logout`
```json
{}
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: en-US`

**Response (200):**
```json
{
  "status": "success",
  "message": "Logout successful"
}
```

### 3. Logout - Token manquant (FR)
**Request:** `POST /api/v1/auth/logout`
```json
{}
```
**Headers:** 
- `Accept-Language: fr-FR`

**Response (401):**
```json
{
  "status": "failed",
  "errorCode": "401",
  "errorName": "MISSING_TOKEN",
  "errorMessage": "Token d'accès requis"
}
```

### 4. Logout - Token manquant (EN)
**Request:** `POST /api/v1/auth/logout`
```json
{}
```
**Headers:** 
- `Accept-Language: en-US`

**Response (401):**
```json
{
  "status": "failed",
  "errorCode": "401",
  "errorName": "MISSING_TOKEN",
  "errorMessage": "Access token required"
}
```

### 5. Logout - Token malformé (FR)
**Request:** `POST /api/v1/auth/logout`
```json
{}
```
**Headers:** 
- `Authorization: Bearer abc123`
- `Accept-Language: fr-FR`

**Response (401):**
```json
{
  "status": "failed",
  "errorCode": "401",
  "errorName": "INVALID_TOKEN",
  "errorMessage": "Token invalide"
}
```

### 6. Logout - Token malformé (EN)
**Request:** `POST /api/v1/auth/logout`
```json
{}
```
**Headers:** 
- `Authorization: Bearer abc123`
- `Accept-Language: en-US`

**Response (401):**
```json
{
  "status": "failed",
  "errorCode": "401",
  "errorName": "INVALID_TOKEN",
  "errorMessage": "Invalid token"
}
```

### 7. Logout - Token expiré (FR)
**Request:** `POST /api/v1/auth/logout`
```json
{}
```
**Headers:** 
- `Authorization: Bearer [expired_token]`
- `Accept-Language: fr-FR`

**Response (401):**
```json
{
  "status": "failed",
  "errorCode": "401",
  "errorName": "TOKEN_EXPIRED",
  "errorMessage": "Token expiré"
}
```

### 8. Logout - Token expiré (EN)
**Request:** `POST /api/v1/auth/logout`
```json
{}
```
**Headers:** 
- `Authorization: Bearer [expired_token]`
- `Accept-Language: en-US`

**Response (401):**
```json
{
  "status": "failed",
  "errorCode": "401",
  "errorName": "TOKEN_EXPIRED",
  "errorMessage": "Token expired"
}
```

### 9. Logout - Token blacklisté (FR)
**Request:** `POST /api/v1/auth/logout`
```json
{}
```
**Headers:** 
- `Authorization: Bearer [blacklisted_token]`
- `Accept-Language: fr-FR`

**Response (401):**
```json
{
  "status": "failed",
  "errorCode": "401",
  "errorName": "TOKEN_REVOKED",
  "errorMessage": "Token révoqué"
}
```

### 10. Logout - Token blacklisté (EN)
**Request:** `POST /api/v1/auth/logout`
```json
{}
```
**Headers:** 
- `Authorization: Bearer [blacklisted_token]`
- `Accept-Language: en-US`

**Response (401):**
```json
{
  "status": "failed",
  "errorCode": "401",
  "errorName": "TOKEN_REVOKED",
  "errorMessage": "Token revoked"
}
```

### 11. Logout - Utilisateur supprimé (FR)
**Request:** `POST /api/v1/auth/logout`
```json
{}
```
**Headers:** 
- `Authorization: Bearer [deleted_user_token]`
- `Accept-Language: fr-FR`

**Response (401):**
```json
{
  "status": "failed",
  "errorCode": "401",
  "errorName": "USER_NOT_FOUND",
  "errorMessage": "Utilisateur introuvable"
}
```

### 12. Logout - Utilisateur supprimé (EN)
**Request:** `POST /api/v1/auth/logout`
```json
{}
```
**Headers:** 
- `Authorization: Bearer [deleted_user_token]`
- `Accept-Language: en-US`

**Response (401):**
```json
{
  "status": "failed",
  "errorCode": "401",
  "errorName": "USER_NOT_FOUND",
  "errorMessage": "User not found"
}
```

## 👤 MODULE UTILISATEUR

## GET /api/v1/users/me (2 tests de base + 10 tests d'auth)

### Tests de base

#### 1. Get Profile - Succès (FR)
**Request:** `GET /api/v1/users/me`

**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: fr-FR`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": "68ba3aed82a4d774c9cc4078",
    "name": "Test User",
    "email": "test-user@example.com",
    "subscriptionStatus": "free",
    "isEmailVerified": false,
    "isActive": true,
    "profilePictureUrl": null
  },
  "message": "Profil récupéré avec succès"
}
```

#### 2. Get Profile - Succès (EN)
**Request:** `GET /api/v1/users/me`

**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: en-US`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": "68ba3aed82a4d774c9cc4078",
    "name": "Test User",
    "email": "test-user@example.com",
    "subscriptionStatus": "free",
    "isEmailVerified": false,
    "isActive": true,
    "profilePictureUrl": null
  },
  "message": "Profile retrieved successfully"
}
```

### Tests d'authentification (10 tests)

#### 1. GET Profile - Token manquant (FR)
**Request:** `GET /api/v1/users/me`

**Headers:** 
- `Accept-Language: fr-FR`

**Response (401):**
```json
{
  "status": "failed",
  "errorCode": "401",
  "errorName": "MISSING_TOKEN",
  "errorMessage": "Token d'accès requis"
}
```

#### 2. GET Profile - Token manquant (EN)
**Request:** `GET /api/v1/users/me`

**Headers:** 
- `Accept-Language: en-US`

**Response (401):**
```json
{
  "status": "failed",
  "errorCode": "401",
  "errorName": "MISSING_TOKEN",
  "errorMessage": "Access token required"
}
```

#### 3. GET Profile - Token invalide (FR)
**Request:** `GET /api/v1/users/me`

**Headers:** 
- `Authorization: Bearer abc123`
- `Accept-Language: fr-FR`

**Response (401):**
```json
{
  "status": "failed",
  "errorCode": "401",
  "errorName": "INVALID_TOKEN",
  "errorMessage": "Token invalide"
}
```

#### 4. GET Profile - Token invalide (EN)
**Request:** `GET /api/v1/users/me`

**Headers:** 
- `Authorization: Bearer abc123`
- `Accept-Language: en-US`

**Response (401):**
```json
{
  "status": "failed",
  "errorCode": "401",
  "errorName": "INVALID_TOKEN",
  "errorMessage": "Invalid token"
}
```

#### 5. GET Profile - Token expiré (FR)
**Request:** `GET /api/v1/users/me`

**Headers:** 
- `Authorization: Bearer [expired_token]`
- `Accept-Language: fr-FR`

**Response (401):**
```json
{
  "status": "failed",
  "errorCode": "401",
  "errorName": "TOKEN_EXPIRED",
  "errorMessage": "Token expiré"
}
```

#### 6. GET Profile - Token expiré (EN)
**Request:** `GET /api/v1/users/me`

**Headers:** 
- `Authorization: Bearer [expired_token]`
- `Accept-Language: en-US`

**Response (401):**
```json
{
  "status": "failed",
  "errorCode": "401",
  "errorName": "TOKEN_EXPIRED",
  "errorMessage": "Token expired"
}
```

#### 7. GET Profile - Token blacklisté (FR)
**Request:** `GET /api/v1/users/me`

**Headers:** 
- `Authorization: Bearer [blacklisted_token]`
- `Accept-Language: fr-FR`

**Response (401):**
```json
{
  "status": "failed",
  "errorCode": "401",
  "errorName": "TOKEN_REVOKED",
  "errorMessage": "Token révoqué"
}
```

#### 8. GET Profile - Token blacklisté (EN)
**Request:** `GET /api/v1/users/me`

**Headers:** 
- `Authorization: Bearer [blacklisted_token]`
- `Accept-Language: en-US`

**Response (401):**
```json
{
  "status": "failed",
  "errorCode": "401",
  "errorName": "TOKEN_REVOKED",
  "errorMessage": "Token revoked"
}
```

#### 9. GET Profile - Utilisateur supprimé (FR)
**Request:** `GET /api/v1/users/me`

**Headers:** 
- `Authorization: Bearer [deleted_user_token]`
- `Accept-Language: fr-FR`

**Response (401):**
```json
{
  "status": "failed",
  "errorCode": "401",
  "errorName": "USER_NOT_FOUND",
  "errorMessage": "Utilisateur introuvable"
}
```

#### 10. GET Profile - Utilisateur supprimé (EN)
**Request:** `GET /api/v1/users/me`

**Headers:** 
- `Authorization: Bearer [deleted_user_token]`
- `Accept-Language: en-US`

**Response (401):**
```json
{
  "status": "failed",
  "errorCode": "401",
  "errorName": "USER_NOT_FOUND",
  "errorMessage": "User not found"
}
```

## PATCH /api/v1/users/me (30 tests de validation + 10 tests d'auth)

### Tests de validation

#### 1. Update Profile - Nom valide (FR)
**Request:** `PATCH /api/v1/users/me`
```json
{
  "name": "cheikh"
}
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: fr-FR`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": "68ba3aed82a4d774c9cc4078",
    "name": "cheikh",
    "email": "test-user@example.com"
  },
  "message": "Profil mis à jour avec succès"
}
```

#### 2. Update Profile - Nom valide (EN)
**Request:** `PATCH /api/v1/users/me`
```json
{
  "name": "cheikh"
}
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: en-US`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": "68ba3aed82a4d774c9cc4078",
    "name": "cheikh",
    "email": "test-user@example.com"
  },
  "message": "Profile updated successfully"
}
```

#### 3. Update Profile - Nom trop court (FR)
**Request:** `PATCH /api/v1/users/me`
```json
{
  "name": "A"
}
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: fr-FR`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Le nom doit contenir au moins 2 caractères"
}
```

#### 4. Update Profile - Nom trop court (EN)
**Request:** `PATCH /api/v1/users/me`
```json
{
  "name": "A"
}
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: en-US`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Name must be at least 2 characters long"
}
```

#### 5. Update Profile - Nom trop long (FR)
**Request:** `PATCH /api/v1/users/me`
```json
{
  "name": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
}
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: fr-FR`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Le nom ne peut pas dépasser 100 caractères"
}
```

#### 6. Update Profile - Email invalide (FR)
**Request:** `PATCH /api/v1/users/me`
```json
{
  "email": "invalid-email"
}
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: fr-FR`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Format d'email invalide"
}
```

#### 7. Update Profile - Aucun champ (FR)
**Request:** `PATCH /api/v1/users/me`
```json
{}
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: fr-FR`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Au moins un champ doit être fourni pour la mise à jour"
}
```

#### 8. Update Profile - Nom vide (FR)
**Request:** `PATCH /api/v1/users/me`
```json
{
  "name": ""
}
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: fr-FR`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Le nom ne peut pas être vide"
}
```

#### 9. Update Profile - Email vide (FR)
**Request:** `PATCH /api/v1/users/me`
```json
{
  "email": ""
}
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: fr-FR`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "L'email ne peut pas être vide"
}
```

#### 10. Update Profile - Nom avec chiffres (FR)
**Request:** `PATCH /api/v1/users/me`
```json
{
  "name": "Cheikh123"
}
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: fr-FR`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": "68ba3aed82a4d774c9cc4078",
    "name": "Cheikh123",
    "email": "test-user@example.com"
  },
  "message": "Profil mis à jour avec succès"
}
```

#### 11. Update Profile - Nom avec caractères spéciaux (FR)
**Request:** `PATCH /api/v1/users/me`
```json
{
  "name": "Cheikh-O'Connor"
}
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: fr-FR`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": "68ba3aed82a4d774c9cc4078",
    "name": "Cheikh-O'Connor",
    "email": "test-user@example.com"
  },
  "message": "Profil mis à jour avec succès"
}
```

#### 12. Update Profile - Nom avec espaces seulement (FR)
**Request:** `PATCH /api/v1/users/me`
```json
{
  "name": "   "
}
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: fr-FR`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Le nom ne peut pas être vide"
}
```

#### 13. Update Profile - Email trop long (FR)
**Request:** `PATCH /api/v1/users/me`
```json
{
  "email": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@example.com"
}
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: fr-FR`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Format d'email invalide"
}
```

#### 14. Update Profile - Email avec espaces (FR)
**Request:** `PATCH /api/v1/users/me`
```json
{
  "email": "  user@example.com  "
}
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: fr-FR`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": "68ba3aed82a4d774c9cc4078",
    "name": "Test User",
    "email": "user@example.com"
  },
  "message": "Profil mis à jour avec succès"
}
```

#### 15. Update Profile - Champs vides (FR)
**Request:** `PATCH /api/v1/users/me`
```json
{
  "name": "",
  "email": ""
}
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: fr-FR`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Le nom ne peut pas être vide"
}
```

#### 16. Update Profile - Email valide (FR)
**Request:** `PATCH /api/v1/users/me`
```json
{
  "email": "test-valid@example.com"
}
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: fr-FR`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": "68ba3aed82a4d774c9cc4078",
    "name": "Test User",
    "email": "test-valid@example.com"
  },
  "message": "Profil mis à jour avec succès"
}
```

#### 17. Update Profile - Nom avec chiffres (EN)
**Request:** `PATCH /api/v1/users/me`
```json
{
  "name": "Cheikh123"
}
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: en-US`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": "68ba3aed82a4d774c9cc4078",
    "name": "Cheikh123",
    "email": "test-user@example.com"
  },
  "message": "Profile updated successfully"
}
```

#### 18. Update Profile - Nom avec caractères spéciaux (EN)
**Request:** `PATCH /api/v1/users/me`
```json
{
  "name": "Cheikh-O'Connor"
}
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: en-US`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": "68ba3aed82a4d774c9cc4078",
    "name": "Cheikh-O'Connor",
    "email": "test-user@example.com"
  },
  "message": "Profile updated successfully"
}
```

#### 19. Update Profile - Email déjà existant (FR)
**Request:** `PATCH /api/v1/users/me`
```json
{
  "email": "admin@example.com"
}
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: fr-FR`

**Response (409):**
```json
{
  "status": "failed",
  "errorCode": "409",
  "errorName": "CONFLICT",
  "errorMessage": "Un compte avec cette adresse email existe déjà"
}
```

### Tests d'authentification (10 tests)

#### 1-2. Token manquant (FR/EN)
#### 3-4. Token invalide (FR/EN)
#### 5-6. Token expiré (FR/EN)
#### 7-8. Token blacklisté (FR/EN)
#### 9-10. Utilisateur supprimé (FR/EN)

(Mêmes formats de réponse que les tests d'authentification de logout)

## POST /api/v1/users/me/avatar (14 tests + 10 tests d'auth)

### 1. Upload Avatar - Succès (FR)
**Request:** `POST /api/v1/users/me/avatar`
```json
"multipart/form-data avec fichier image"
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: fr-FR`
- `Content-Type: multipart/form-data`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "fileName": "avatar_68ba3aed82a4d774c9cc4078_1751374774367_a5acc6b790b0c284.jpg",
    "avatarUrl": "/uploads/avatars/avatar_68ba3aed82a4d774c9cc4078_1751374774367_a5acc6b790b0c284.jpg"
  },
  "message": "Avatar mis à jour avec succès"
}
```

### 2. Upload Avatar - Succès (EN)
**Request:** `POST /api/v1/users/me/avatar`
```json
"multipart/form-data avec fichier image"
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: en-US`
- `Content-Type: multipart/form-data`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "fileName": "avatar_68ba3aed82a4d774c9cc4078_1751374774367_a5acc6b790b0c284.jpg",
    "avatarUrl": "/uploads/avatars/avatar_68ba3aed82a4d774c9cc4078_1751374774367_a5acc6b790b0c284.jpg"
  },
  "message": "Avatar updated successfully"
}
```

### 3. Upload Avatar - Pas de fichier (FR)
**Request:** `POST /api/v1/users/me/avatar`
```json
"multipart/form-data vide"
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: fr-FR`
- `Content-Type: multipart/form-data`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "NO_FILE_PROVIDED",
  "errorMessage": "Veuillez sélectionner un fichier image pour votre avatar"
}
```

### 4. Upload Avatar - Image JPEG valide (FR)
**Request:** `POST /api/v1/users/me/avatar`
```json
"multipart/form-data avec fichier JPEG"
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: fr-FR`
- `Content-Type: multipart/form-data`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "fileName": "avatar_68ba3aed82a4d774c9cc4078_1751374774367_a5acc6b790b0c284.jpg",
    "avatarUrl": "/uploads/avatars/avatar_68ba3aed82a4d774c9cc4078_1751374774367_a5acc6b790b0c284.jpg"
  },
  "message": "Avatar mis à jour avec succès"
}
```

### 5. Upload Avatar - Image PNG valide (FR)
**Request:** `POST /api/v1/users/me/avatar`
```json
"multipart/form-data avec fichier PNG"
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: fr-FR`
- `Content-Type: multipart/form-data`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "fileName": "avatar_68ba3aed82a4d774c9cc4078_1751374774367_a5acc6b790b0c284.png",
    "avatarUrl": "/uploads/avatars/avatar_68ba3aed82a4d774c9cc4078_1751374774367_a5acc6b790b0c284.png"
  },
  "message": "Avatar mis à jour avec succès"
}
```

### 6. Upload Avatar - Image WebP valide (FR)
**Request:** `POST /api/v1/users/me/avatar`
```json
"multipart/form-data avec fichier WebP"
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: fr-FR`
- `Content-Type: multipart/form-data`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "fileName": "avatar_68ba3aed82a4d774c9cc4078_1751374774367_a5acc6b790b0c284.webp",
    "avatarUrl": "/uploads/avatars/avatar_68ba3aed82a4d774c9cc4078_1751374774367_a5acc6b790b0c284.webp"
  },
  "message": "Avatar mis à jour avec succès"
}
```

### 7. Upload Avatar - Image GIF valide (FR)
**Request:** `POST /api/v1/users/me/avatar`
```json
"multipart/form-data avec fichier GIF"
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: fr-FR`
- `Content-Type: multipart/form-data`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "fileName": "avatar_68ba3aed82a4d774c9cc4078_1751374774367_a5acc6b790b0c284.gif",
    "avatarUrl": "/uploads/avatars/avatar_68ba3aed82a4d774c9cc4078_1751374774367_a5acc6b790b0c284.gif"
  },
  "message": "Avatar mis à jour avec succès"
}
```

### 8. Upload Avatar - Image BMP valide (FR)
**Request:** `POST /api/v1/users/me/avatar`
```json
"multipart/form-data avec fichier BMP"
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: fr-FR`
- `Content-Type: multipart/form-data`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "fileName": "avatar_68ba3aed82a4d774c9cc4078_1751374774367_a5acc6b790b0c284.bmp",
    "avatarUrl": "/uploads/avatars/avatar_68ba3aed82a4d774c9cc4078_1751374774367_a5acc6b790b0c284.bmp"
  },
  "message": "Avatar mis à jour avec succès"
}
```

### 9. Upload Avatar - Fichier trop volumineux (FR)
**Request:** `POST /api/v1/users/me/avatar`
```json
"multipart/form-data avec fichier > 5MB"
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: fr-FR`
- `Content-Type: multipart/form-data`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "FILE_TOO_LARGE",
  "errorMessage": "Le fichier est trop volumineux. Taille maximale autorisée : 5 MB"
}
```

### 10. Upload Avatar - Format non supporté (FR)
**Request:** `POST /api/v1/users/me/avatar`
```json
"multipart/form-data avec fichier SVG"
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: fr-FR`
- `Content-Type: multipart/form-data`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "UNSUPPORTED_FILE_TYPE",
  "errorMessage": "Type de fichier non supporté. Formats acceptés : JPEG, PNG, GIF, WebP, BMP"
}
```

### Tests d'authentification (10 tests)

#### 1-2. Token manquant (FR/EN)
#### 3-4. Token invalide (FR/EN)
#### 5-6. Token expiré (FR/EN)
#### 7-8. Token blacklisté (FR/EN)
#### 9-10. Utilisateur supprimé (FR/EN)

(Mêmes formats de réponse que les tests d'authentification de logout)

## DELETE /api/v1/users/me/avatar (4 tests + 10 tests d'auth)

### 1. Delete Avatar - Pas d'avatar (FR)
**Request:** `DELETE /api/v1/users/me/avatar`

**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: fr-FR`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "NO_AVATAR_TO_DELETE",
  "errorMessage": "Aucun avatar à supprimer"
}
```

### 2. Delete Avatar - Pas d'avatar (EN)
**Request:** `DELETE /api/v1/users/me/avatar`

**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: en-US`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "NO_AVATAR_TO_DELETE",
  "errorMessage": "No avatar to delete"
}
```

### 3. Delete Avatar - Avec avatar (FR)
**Request:** `DELETE /api/v1/users/me/avatar`

**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: fr-FR`

**Response (200):**
```json
{
  "status": "success",
  "message": "Avatar supprimé"
}
```

### 4. Delete Avatar - Avec avatar (EN)
**Request:** `DELETE /api/v1/users/me/avatar`

**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: en-US`

**Response (200):**
```json
{
  "status": "success",
  "message": "Avatar deleted"
}
```

### Tests d'authentification (10 tests)

#### 1-2. Token manquant (FR/EN)
#### 3-4. Token invalide (FR/EN)
#### 5-6. Token expiré (FR/EN)
#### 7-8. Token blacklisté (FR/EN)
#### 9-10. Utilisateur supprimé (FR/EN)

(Mêmes formats de réponse que les tests d'authentification de logout)

## PATCH /api/v1/users/me/password (20 tests + 10 tests d'auth)

### 1. Change Password - Succès (FR)
**Request:** `PATCH /api/v1/users/me/password`
```json
{
  "currentPassword": "TestPassword123",
  "newPassword": "NewPassword123"
}
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: fr-FR`

**Response (200):**
```json
{
  "status": "success",
  "message": "Mot de passe changé avec succès"
}
```

### 2. Change Password - Succès (EN)
**Request:** `PATCH /api/v1/users/me/password`
```json
{
  "currentPassword": "TestPassword123",
  "newPassword": "NewPassword456"
}
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: en-US`

**Response (200):**
```json
{
  "status": "success",
  "message": "Password changed successfully"
}
```

### 3. Change Password - Mot de passe actuel incorrect (FR)
**Request:** `PATCH /api/v1/users/me/password`
```json
{
  "currentPassword": "WrongPassword123",
  "newPassword": "AnotherPassword123"
}
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: fr-FR`

**Response (401):**
```json
{
  "status": "failed",
  "errorCode": "401",
  "errorName": "INVALID_CREDENTIALS",
  "errorMessage": "Le mot de passe actuel est incorrect"
}
```

### 4. Change Password - Nouveau mot de passe trop court (FR)
**Request:** `PATCH /api/v1/users/me/password`
```json
{
  "currentPassword": "TestPassword123",
  "newPassword": "123"
}
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: fr-FR`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Le nouveau mot de passe doit contenir au moins 6 caractères"
}
```

### 5. Change Password - Nouveau mot de passe faible (FR)
**Request:** `PATCH /api/v1/users/me/password`
```json
{
  "currentPassword": "TestPassword123",
  "newPassword": "password"
}
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: fr-FR`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Le nouveau mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre"
}
```

### 6. Change Password - Mot de passe actuel manquant (FR)
**Request:** `PATCH /api/v1/users/me/password`
```json
{
  "newPassword": "NewPassword123"
}
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: fr-FR`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Le mot de passe actuel est requis"
}
```

### 7. Change Password - Nouveau mot de passe manquant (FR)
**Request:** `PATCH /api/v1/users/me/password`
```json
{
  "currentPassword": "TestPassword123"
}
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: fr-FR`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Le nouveau mot de passe est requis"
}
```

### 8. Change Password - Nouveau mot de passe trop court (EN)
**Request:** `PATCH /api/v1/users/me/password`
```json
{
  "currentPassword": "TestPassword123",
  "newPassword": "123"
}
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: en-US`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "New password must be at least 6 characters long"
}
```

### 9. Change Password - Nouveau mot de passe faible (EN)
**Request:** `PATCH /api/v1/users/me/password`
```json
{
  "currentPassword": "TestPassword123",
  "newPassword": "password"
}
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: en-US`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "New password must contain at least one lowercase letter, one uppercase letter and one number"
}
```

### 10. Change Password - Mot de passe actuel manquant (EN)
**Request:** `PATCH /api/v1/users/me/password`
```json
{
  "newPassword": "NewPassword123"
}
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: en-US`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "Current password is required"
}
```

### 11. Change Password - Nouveau mot de passe manquant (EN)
**Request:** `PATCH /api/v1/users/me/password`
```json
{
  "currentPassword": "TestPassword123"
}
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: en-US`

**Response (400):**
```json
{
  "status": "failed",
  "errorCode": "400",
  "errorName": "VALIDATION_ERROR",
  "errorMessage": "New password is required"
}
```

### Tests d'authentification (10 tests)

#### 1-2. Token manquant (FR/EN)
#### 3-4. Token invalide (FR/EN)
#### 5-6. Token expiré (FR/EN)
#### 7-8. Token blacklisté (FR/EN)
#### 9-10. Utilisateur supprimé (FR/EN)

(Mêmes formats de réponse que les tests d'authentification de logout)

## DELETE /api/v1/users/me (5 tests + 10 tests d'auth)

### 1. Delete Account - Mot de passe incorrect (FR)
**Request:** `DELETE /api/v1/users/me`
```json
{
  "password": "WrongPassword123"
}
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: fr-FR`

**Response (401):**
```json
{
  "status": "failed",
  "errorCode": "401",
  "errorName": "UNAUTHORIZED",
  "errorMessage": "Le mot de passe actuel est incorrect"
}
```

### 2. Delete Account - Mot de passe incorrect (EN)
**Request:** `DELETE /api/v1/users/me`
```json
{
  "password": "WrongPassword123"
}
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: en-US`

**Response (401):**
```json
{
  "status": "failed",
  "errorCode": "401",
  "errorName": "UNAUTHORIZED",
  "errorMessage": "Current password is incorrect"
}
```

### 3. Delete Account - Succès (FR)
**Request:** `DELETE /api/v1/users/me`
```json
{
  "password": "TestPassword123"
}
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: fr-FR`

**Response (200):**
```json
{
  "status": "success",
  "message": "Compte utilisateur supprimé définitivement"
}
```

### 4. Delete Account - Succès (EN)
**Request:** `DELETE /api/v1/users/me`
```json
{
  "password": "TestPassword123"
}
```
**Headers:** 
- `Authorization: Bearer [valid_token]`
- `Accept-Language: en-US`

**Response (200):**
```json
{
  "status": "success",
  "message": "User account permanently deleted"
}
```

### 5. Delete Account - Utilisateur déjà supprimé
**Request:** `DELETE /api/v1/users/me`
```json
{
  "password": "TestPassword123"
}
```
**Headers:** 
- `Authorization: Bearer [deleted_user_token]`
- `Accept-Language: fr-FR`

**Response (401):**
```json
{
  "status": "failed",
  "errorCode": "401",
  "errorName": "USER_NOT_FOUND",
  "errorMessage": "Utilisateur introuvable"
}
```

### Tests d'authentification (10 tests)

#### 1-2. Token manquant (FR/EN)
#### 3-4. Token invalide (FR/EN)
#### 5-6. Token expiré (FR/EN)
#### 7-8. Token blacklisté (FR/EN)
#### 9-10. Utilisateur supprimé (FR/EN)

(Mêmes formats de réponse que les tests d'authentification de logout)

