#!/usr/bin/env node

// ============================================================================
// 📁 scripts/generate-test-report.js - Générateur de rapport de tests API
// 📊 Génère un rapport complet des tests automatisés
// ============================================================================

import fs from "fs";
import path from "path";
import {
  USER_TEST_DATA,
  AUTH_TESTS_FOR_PROTECTED_ROUTES,
} from "./user-tests-data.js";

/**
 * 🎯 Configuration du générateur
 */
const CONFIG = {
  outputFile: "test-report-api.md",
  baseUrl: "http://localhost:3001/api/v1",
  date: new Date().toLocaleDateString("fr-FR"),
};

/**
 * 🎨 Utilitaires d'affichage
 */
const log = {
  success: (msg) => console.log(`\x1b[32m✅ ${msg}\x1b[0m`),
  error: (msg) => console.log(`\x1b[31m❌ ${msg}\x1b[0m`),
  info: (msg) => console.log(`\x1b[34mℹ️  ${msg}\x1b[0m`),
  title: (msg) => console.log(`\x1b[1m\x1b[36m🔥 ${msg}\x1b[0m`),
};

/**
 * 📊 Données des tests extraites des scripts
 */
const TEST_DATA = {
  auth: {
    register: {
      total: 18,
      tests: [
        {
          name: "Register - Succès valide (FR)",
          method: "POST",
          path: "/api/v1/auth/register",
          request: {
            name: "cheikh",
            email: "test-xxxxxx@emailight.com",
            password: "MotDePasseSecurise123",
          },
          headers: { "Accept-Language": "fr-FR" },
          response: {
            status: 201,
            body: {
              status: "success",
              data: {
                accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                expiresIn: "24h",
              },
              message: "Compte créé avec succès",
            },
          },
        },
        {
          name: "Register - Succès valide (EN)",
          method: "POST",
          path: "/api/v1/auth/register",
          request: {
            name: "cheikh",
            email: "test-xxxxxx@emailight.com",
            password: "MotDePasseSecurise123",
          },
          headers: { "Accept-Language": "en-US" },
          response: {
            status: 201,
            body: {
              status: "success",
              data: {
                accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                expiresIn: "24h",
              },
              message: "Account created successfully",
            },
          },
        },
        {
          name: "Register - Email déjà utilisé (FR)",
          method: "POST",
          path: "/api/v1/auth/register",
          request: {
            name: "cheikh",
            email: "existing@emailight.com",
            password: "MotDePasseSecurise123",
          },
          headers: { "Accept-Language": "fr-FR" },
          response: {
            status: 409,
            body: {
              status: "failed",
              errorCode: "409",
              errorName: "USER_EXISTS",
              errorMessage: "Un compte avec cette adresse email existe déjà",
            },
          },
        },
        {
          name: "Register - Email déjà utilisé (EN)",
          method: "POST",
          path: "/api/v1/auth/register",
          request: {
            name: "cheikh",
            email: "existing@emailight.com",
            password: "MotDePasseSecurise123",
          },
          headers: { "Accept-Language": "en-US" },
          response: {
            status: 409,
            body: {
              status: "failed",
              errorCode: "409",
              errorName: "USER_EXISTS",
              errorMessage: "An account with this email address already exists",
            },
          },
        },
        {
          name: "Register - Mot de passe trop court (FR)",
          method: "POST",
          path: "/api/v1/auth/register",
          request: {
            name: "cheikh",
            email: "test@emailight.com",
            password: "abc",
          },
          headers: { "Accept-Language": "fr-FR" },
          response: {
            status: 400,
            body: {
              status: "failed",
              errorCode: "400",
              errorName: "VALIDATION_ERROR",
              errorMessage:
                "Le mot de passe doit contenir au moins 6 caractères",
            },
          },
        },
        {
          name: "Register - Mot de passe trop court (EN)",
          method: "POST",
          path: "/api/v1/auth/register",
          request: {
            name: "cheikh",
            email: "test@emailight.com",
            password: "abc",
          },
          headers: { "Accept-Language": "en-US" },
          response: {
            status: 400,
            body: {
              status: "failed",
              errorCode: "400",
              errorName: "VALIDATION_ERROR",
              errorMessage: "Password must be at least 6 characters long",
            },
          },
        },
        {
          name: "Register - Email invalide (FR)",
          method: "POST",
          path: "/api/v1/auth/register",
          request: {
            name: "cheikh",
            email: "pasunemail",
            password: "MotDePasseSecurise123",
          },
          headers: { "Accept-Language": "fr-FR" },
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
          name: "Register - Email invalide (EN)",
          method: "POST",
          path: "/api/v1/auth/register",
          request: {
            name: "cheikh",
            email: "pasunemail",
            password: "MotDePasseSecurise123",
          },
          headers: { "Accept-Language": "en-US" },
          response: {
            status: 400,
            body: {
              status: "failed",
              errorCode: "400",
              errorName: "VALIDATION_ERROR",
              errorMessage: "Invalid email format",
            },
          },
        },
        {
          name: "Register - Nom trop court (FR)",
          method: "POST",
          path: "/api/v1/auth/register",
          request: {
            name: "c",
            email: "test@emailight.com",
            password: "MotDePasseSecurise123",
          },
          headers: { "Accept-Language": "fr-FR" },
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
          name: "Register - Nom trop court (EN)",
          method: "POST",
          path: "/api/v1/auth/register",
          request: {
            name: "c",
            email: "test@emailight.com",
            password: "MotDePasseSecurise123",
          },
          headers: { "Accept-Language": "en-US" },
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
          name: "Register - Nom manquant (FR)",
          method: "POST",
          path: "/api/v1/auth/register",
          request: {
            email: "test@emailight.com",
            password: "MotDePasseSecurise123",
          },
          headers: { "Accept-Language": "fr-FR" },
          response: {
            status: 400,
            body: {
              status: "failed",
              errorCode: "400",
              errorName: "VALIDATION_ERROR",
              errorMessage: "Le nom est requis",
            },
          },
        },
        {
          name: "Register - Nom manquant (EN)",
          method: "POST",
          path: "/api/v1/auth/register",
          request: {
            email: "test@emailight.com",
            password: "MotDePasseSecurise123",
          },
          headers: { "Accept-Language": "en-US" },
          response: {
            status: 400,
            body: {
              status: "failed",
              errorCode: "400",
              errorName: "VALIDATION_ERROR",
              errorMessage: "Name is required",
            },
          },
        },
        {
          name: "Register - Email manquant (FR)",
          method: "POST",
          path: "/api/v1/auth/register",
          request: {
            name: "cheikh",
            password: "MotDePasseSecurise123",
          },
          headers: { "Accept-Language": "fr-FR" },
          response: {
            status: 400,
            body: {
              status: "failed",
              errorCode: "400",
              errorName: "VALIDATION_ERROR",
              errorMessage: "L'email est requis",
            },
          },
        },
        {
          name: "Register - Email manquant (EN)",
          method: "POST",
          path: "/api/v1/auth/register",
          request: {
            name: "cheikh",
            password: "MotDePasseSecurise123",
          },
          headers: { "Accept-Language": "en-US" },
          response: {
            status: 400,
            body: {
              status: "failed",
              errorCode: "400",
              errorName: "VALIDATION_ERROR",
              errorMessage: "Email is required",
            },
          },
        },
        {
          name: "Register - Mot de passe manquant (FR)",
          method: "POST",
          path: "/api/v1/auth/register",
          request: {
            name: "cheikh",
            email: "test@emailight.com",
          },
          headers: { "Accept-Language": "fr-FR" },
          response: {
            status: 400,
            body: {
              status: "failed",
              errorCode: "400",
              errorName: "VALIDATION_ERROR",
              errorMessage: "Le mot de passe est requis",
            },
          },
        },
        {
          name: "Register - Mot de passe manquant (EN)",
          method: "POST",
          path: "/api/v1/auth/register",
          request: {
            name: "cheikh",
            email: "test@emailight.com",
          },
          headers: { "Accept-Language": "en-US" },
          response: {
            status: 400,
            body: {
              status: "failed",
              errorCode: "400",
              errorName: "VALIDATION_ERROR",
              errorMessage: "Password is required",
            },
          },
        },
        {
          name: "Register - Corps vide (FR)",
          method: "POST",
          path: "/api/v1/auth/register",
          request: {},
          headers: { "Accept-Language": "fr-FR" },
          response: {
            status: 400,
            body: {
              status: "failed",
              errorCode: "400",
              errorName: "VALIDATION_ERROR",
              errorMessage: "Le nom est requis",
            },
          },
        },
        {
          name: "Register - Corps vide (EN)",
          method: "POST",
          path: "/api/v1/auth/register",
          request: {},
          headers: { "Accept-Language": "en-US" },
          response: {
            status: 400,
            body: {
              status: "failed",
              errorCode: "400",
              errorName: "VALIDATION_ERROR",
              errorMessage: "Name is required",
            },
          },
        },
      ],
    },
  },
};

/**
 * 📝 Génère le rapport complet
 */
function generateReport() {
  log.title("Génération du rapport de tests API");

  let report = `# 🧪 Rapport de Tests API Complet

**Généré le:** ${CONFIG.date}
**URL de base:** ${CONFIG.baseUrl}
**Couverture totale:** 172+ tests automatisés

---

## 📊 Résumé de la couverture

### Scripts de test
- **auth-testing.js**: 52 tests (18 register + 14 login + 10 refresh-token + 10 logout)
- **user-testing.js**: 120+ tests (incluant les tests d'authentification pour chaque route)

---

## 🔐 MODULE AUTHENTIFICATION

`;

  // Générer les tests d'authentification
  report += generateAuthTests();

  // Générer les tests utilisateur
  report += generateUserTests();

  return report;
}

/**
 * 🔐 Génère les tests d'authentification
 */
function generateAuthTests() {
  let authReport = "";

  // Tests Register
  authReport += `## POST /api/v1/auth/register (${TEST_DATA.auth.register.total} tests)

`;

  TEST_DATA.auth.register.tests.forEach((test, index) => {
    authReport += `### ${index + 1}. ${test.name}
**Request:** \`${test.method} ${test.path}\`
\`\`\`json
${JSON.stringify(test.request, null, 2)}
\`\`\`
**Headers:** \`${Object.entries(test.headers)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ")}\`

**Response (${test.response.status}):**
\`\`\`json
${JSON.stringify(test.response.body, null, 2)}
\`\`\`

`;
  });

  // Ajouter les autres tests d'authentification
  authReport += generateLoginTests();
  authReport += generateRefreshTokenTests();
  authReport += generateLogoutTests();

  return authReport;
}

/**
 * 🔐 Génère les tests de login
 */
function generateLoginTests() {
  const loginTests = [
    {
      name: "Login - Succès valide (FR)",
      method: "POST",
      path: "/api/v1/auth/login",
      request: {
        email: "test@emailight.com",
        password: "MotDePasseSecurise123",
      },
      headers: { "Accept-Language": "fr-FR" },
      response: {
        status: 200,
        body: {
          status: "success",
          data: {
            accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            expiresIn: "24h",
          },
          message: "Connexion réussie",
        },
      },
    },
    {
      name: "Login - Succès valide (EN)",
      method: "POST",
      path: "/api/v1/auth/login",
      request: {
        email: "test@emailight.com",
        password: "MotDePasseSecurise123",
      },
      headers: { "Accept-Language": "en-US" },
      response: {
        status: 200,
        body: {
          status: "success",
          data: {
            accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            expiresIn: "24h",
          },
          message: "Login successful",
        },
      },
    },
    {
      name: "Login - Email inexistant (FR)",
      method: "POST",
      path: "/api/v1/auth/login",
      request: {
        email: "inexistant@emailight.com",
        password: "MotDePasseSecurise123",
      },
      headers: { "Accept-Language": "fr-FR" },
      response: {
        status: 401,
        body: {
          status: "failed",
          errorCode: "401",
          errorName: "INVALID_CREDENTIALS",
          errorMessage: "Identifiants invalides",
        },
      },
    },
    {
      name: "Login - Email inexistant (EN)",
      method: "POST",
      path: "/api/v1/auth/login",
      request: {
        email: "inexistant@emailight.com",
        password: "MotDePasseSecurise123",
      },
      headers: { "Accept-Language": "en-US" },
      response: {
        status: 401,
        body: {
          status: "failed",
          errorCode: "401",
          errorName: "INVALID_CREDENTIALS",
          errorMessage: "Invalid credentials",
        },
      },
    },
    {
      name: "Login - Mot de passe incorrect (FR)",
      method: "POST",
      path: "/api/v1/auth/login",
      request: {
        email: "test@emailight.com",
        password: "MauvaisMotDePasse123",
      },
      headers: { "Accept-Language": "fr-FR" },
      response: {
        status: 401,
        body: {
          status: "failed",
          errorCode: "401",
          errorName: "INVALID_CREDENTIALS",
          errorMessage: "Identifiants invalides",
        },
      },
    },
    {
      name: "Login - Mot de passe incorrect (EN)",
      method: "POST",
      path: "/api/v1/auth/login",
      request: {
        email: "test@emailight.com",
        password: "MauvaisMotDePasse123",
      },
      headers: { "Accept-Language": "en-US" },
      response: {
        status: 401,
        body: {
          status: "failed",
          errorCode: "401",
          errorName: "INVALID_CREDENTIALS",
          errorMessage: "Invalid credentials",
        },
      },
    },
    {
      name: "Login - Email manquant (FR)",
      method: "POST",
      path: "/api/v1/auth/login",
      request: {
        password: "MotDePasseSecurise123",
      },
      headers: { "Accept-Language": "fr-FR" },
      response: {
        status: 400,
        body: {
          status: "failed",
          errorCode: "400",
          errorName: "VALIDATION_ERROR",
          errorMessage: "L'email est requis",
        },
      },
    },
    {
      name: "Login - Email manquant (EN)",
      method: "POST",
      path: "/api/v1/auth/login",
      request: {
        password: "MotDePasseSecurise123",
      },
      headers: { "Accept-Language": "en-US" },
      response: {
        status: 400,
        body: {
          status: "failed",
          errorCode: "400",
          errorName: "VALIDATION_ERROR",
          errorMessage: "Email is required",
        },
      },
    },
    {
      name: "Login - Mot de passe manquant (FR)",
      method: "POST",
      path: "/api/v1/auth/login",
      request: {
        email: "test@emailight.com",
      },
      headers: { "Accept-Language": "fr-FR" },
      response: {
        status: 400,
        body: {
          status: "failed",
          errorCode: "400",
          errorName: "VALIDATION_ERROR",
          errorMessage: "Le mot de passe est requis",
        },
      },
    },
    {
      name: "Login - Mot de passe manquant (EN)",
      method: "POST",
      path: "/api/v1/auth/login",
      request: {
        email: "test@emailight.com",
      },
      headers: { "Accept-Language": "en-US" },
      response: {
        status: 400,
        body: {
          status: "failed",
          errorCode: "400",
          errorName: "VALIDATION_ERROR",
          errorMessage: "Password is required",
        },
      },
    },
    {
      name: "Login - Email invalide (FR)",
      method: "POST",
      path: "/api/v1/auth/login",
      request: {
        email: "pasunemail",
        password: "MotDePasseSecurise123",
      },
      headers: { "Accept-Language": "fr-FR" },
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
      name: "Login - Email invalide (EN)",
      method: "POST",
      path: "/api/v1/auth/login",
      request: {
        email: "pasunemail",
        password: "MotDePasseSecurise123",
      },
      headers: { "Accept-Language": "en-US" },
      response: {
        status: 400,
        body: {
          status: "failed",
          errorCode: "400",
          errorName: "VALIDATION_ERROR",
          errorMessage: "Invalid email format",
        },
      },
    },
    {
      name: "Login - Corps vide (FR)",
      method: "POST",
      path: "/api/v1/auth/login",
      request: {},
      headers: { "Accept-Language": "fr-FR" },
      response: {
        status: 400,
        body: {
          status: "failed",
          errorCode: "400",
          errorName: "VALIDATION_ERROR",
          errorMessage: "L'email est requis",
        },
      },
    },
    {
      name: "Login - Corps vide (EN)",
      method: "POST",
      path: "/api/v1/auth/login",
      request: {},
      headers: { "Accept-Language": "en-US" },
      response: {
        status: 400,
        body: {
          status: "failed",
          errorCode: "400",
          errorName: "VALIDATION_ERROR",
          errorMessage: "Email is required",
        },
      },
    },
  ];

  let loginReport = `## POST /api/v1/auth/login (${loginTests.length} tests)

`;

  loginTests.forEach((test, index) => {
    loginReport += `### ${index + 1}. ${test.name}
**Request:** \`${test.method} ${test.path}\`
\`\`\`json
${JSON.stringify(test.request, null, 2)}
\`\`\`
**Headers:** \`${Object.entries(test.headers)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ")}\`

**Response (${test.response.status}):**
\`\`\`json
${JSON.stringify(test.response.body, null, 2)}
\`\`\`

`;
  });

  return loginReport;
}

/**
 * 🔄 Génère les tests de refresh token
 */
function generateRefreshTokenTests() {
  const refreshTests = [
    {
      name: "Refresh Token - Succès valide (FR)",
      method: "POST",
      path: "/api/v1/auth/refresh-token",
      request: {
        refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      },
      headers: { "Accept-Language": "fr-FR" },
      response: {
        status: 200,
        body: {
          status: "success",
          data: {
            accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            expiresIn: "24h",
          },
          message: "Token rafraîchi avec succès",
        },
      },
    },
    {
      name: "Refresh Token - Succès valide (EN)",
      method: "POST",
      path: "/api/v1/auth/refresh-token",
      request: {
        refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      },
      headers: { "Accept-Language": "en-US" },
      response: {
        status: 200,
        body: {
          status: "success",
          data: {
            accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            expiresIn: "24h",
          },
          message: "Token refreshed successfully",
        },
      },
    },
    {
      name: "Refresh Token - Token manquant (FR)",
      method: "POST",
      path: "/api/v1/auth/refresh-token",
      request: {},
      headers: { "Accept-Language": "fr-FR" },
      response: {
        status: 400,
        body: {
          status: "failed",
          errorCode: "400",
          errorName: "VALIDATION_ERROR",
          errorMessage: "Le token de rafraîchissement est requis",
        },
      },
    },
    {
      name: "Refresh Token - Token manquant (EN)",
      method: "POST",
      path: "/api/v1/auth/refresh-token",
      request: {},
      headers: { "Accept-Language": "en-US" },
      response: {
        status: 400,
        body: {
          status: "failed",
          errorCode: "400",
          errorName: "VALIDATION_ERROR",
          errorMessage: "Refresh token is required",
        },
      },
    },
    {
      name: "Refresh Token - Token vide (FR)",
      method: "POST",
      path: "/api/v1/auth/refresh-token",
      request: { refreshToken: "" },
      headers: { "Accept-Language": "fr-FR" },
      response: {
        status: 400,
        body: {
          status: "failed",
          errorCode: "400",
          errorName: "VALIDATION_ERROR",
          errorMessage: "Le token de rafraîchissement est requis",
        },
      },
    },
    {
      name: "Refresh Token - Token vide (EN)",
      method: "POST",
      path: "/api/v1/auth/refresh-token",
      request: { refreshToken: "" },
      headers: { "Accept-Language": "en-US" },
      response: {
        status: 400,
        body: {
          status: "failed",
          errorCode: "400",
          errorName: "VALIDATION_ERROR",
          errorMessage: "Refresh token is required",
        },
      },
    },
    {
      name: "Refresh Token - Token invalide/malformé (FR)",
      method: "POST",
      path: "/api/v1/auth/refresh-token",
      request: { refreshToken: "abc" },
      headers: { "Accept-Language": "fr-FR" },
      response: {
        status: 400,
        body: {
          status: "failed",
          errorCode: "400",
          errorName: "VALIDATION_ERROR",
          errorMessage: "Format du token de rafraîchissement invalide",
        },
      },
    },
    {
      name: "Refresh Token - Token invalide/malformé (EN)",
      method: "POST",
      path: "/api/v1/auth/refresh-token",
      request: { refreshToken: "abc" },
      headers: { "Accept-Language": "en-US" },
      response: {
        status: 400,
        body: {
          status: "failed",
          errorCode: "400",
          errorName: "VALIDATION_ERROR",
          errorMessage: "Invalid refresh token format",
        },
      },
    },
    {
      name: "Refresh Token - Token expiré (FR)",
      method: "POST",
      path: "/api/v1/auth/refresh-token",
      request: { refreshToken: "[expired_token]" },
      headers: { "Accept-Language": "fr-FR" },
      response: {
        status: 401,
        body: {
          status: "failed",
          errorCode: "401",
          errorName: "TOKEN_EXPIRED",
          errorMessage: "Token de rafraîchissement expiré",
        },
      },
    },
    {
      name: "Refresh Token - Token expiré (EN)",
      method: "POST",
      path: "/api/v1/auth/refresh-token",
      request: { refreshToken: "[expired_token]" },
      headers: { "Accept-Language": "en-US" },
      response: {
        status: 401,
        body: {
          status: "failed",
          errorCode: "401",
          errorName: "TOKEN_EXPIRED",
          errorMessage: "Refresh token expired",
        },
      },
    },
  ];

  let refreshReport = `## POST /api/v1/auth/refresh-token (${refreshTests.length} tests)

`;

  refreshTests.forEach((test, index) => {
    refreshReport += `### ${index + 1}. ${test.name}
**Request:** \`${test.method} ${test.path}\`
\`\`\`json
${JSON.stringify(test.request, null, 2)}
\`\`\`
**Headers:** \`${Object.entries(test.headers)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ")}\`

**Response (${test.response.status}):**
\`\`\`json
${JSON.stringify(test.response.body, null, 2)}
\`\`\`

`;
  });

  return refreshReport;
}

/**
 * 🚪 Génère les tests de logout
 */
function generateLogoutTests() {
  const logoutTests = [
    {
      name: "Logout - Succès valide (FR)",
      method: "POST",
      path: "/api/v1/auth/logout",
      request: {},
      headers: {
        Authorization: "Bearer [valid_token]",
        "Accept-Language": "fr-FR",
      },
      response: {
        status: 200,
        body: {
          status: "success",
          message: "Déconnexion réussie",
        },
      },
    },
    {
      name: "Logout - Succès valide (EN)",
      method: "POST",
      path: "/api/v1/auth/logout",
      request: {},
      headers: {
        Authorization: "Bearer [valid_token]",
        "Accept-Language": "en-US",
      },
      response: {
        status: 200,
        body: {
          status: "success",
          message: "Logout successful",
        },
      },
    },
    {
      name: "Logout - Token manquant (FR)",
      method: "POST",
      path: "/api/v1/auth/logout",
      request: {},
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
      name: "Logout - Token manquant (EN)",
      method: "POST",
      path: "/api/v1/auth/logout",
      request: {},
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
      name: "Logout - Token malformé (FR)",
      method: "POST",
      path: "/api/v1/auth/logout",
      request: {},
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
      name: "Logout - Token malformé (EN)",
      method: "POST",
      path: "/api/v1/auth/logout",
      request: {},
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
      name: "Logout - Token expiré (FR)",
      method: "POST",
      path: "/api/v1/auth/logout",
      request: {},
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
      name: "Logout - Token expiré (EN)",
      method: "POST",
      path: "/api/v1/auth/logout",
      request: {},
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
      name: "Logout - Token blacklisté (FR)",
      method: "POST",
      path: "/api/v1/auth/logout",
      request: {},
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
      name: "Logout - Token blacklisté (EN)",
      method: "POST",
      path: "/api/v1/auth/logout",
      request: {},
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
      name: "Logout - Utilisateur supprimé (FR)",
      method: "POST",
      path: "/api/v1/auth/logout",
      request: {},
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
      name: "Logout - Utilisateur supprimé (EN)",
      method: "POST",
      path: "/api/v1/auth/logout",
      request: {},
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
  ];

  let logoutReport = `## POST /api/v1/auth/logout (${logoutTests.length} tests)

`;

  logoutTests.forEach((test, index) => {
    logoutReport += `### ${index + 1}. ${test.name}
**Request:** \`${test.method} ${test.path}\`
\`\`\`json
${JSON.stringify(test.request, null, 2)}
\`\`\`
**Headers:** 
${Object.entries(test.headers)
  .map(([k, v]) => `- \`${k}: ${v}\``)
  .join("\n")}

**Response (${test.response.status}):**
\`\`\`json
${JSON.stringify(test.response.body, null, 2)}
\`\`\`

`;
  });

  return logoutReport;
}

/**
 * 👤 Génère les tests utilisateur
 */
function generateUserTests() {
  let userReport = `## 👤 MODULE UTILISATEUR

`;

  // Tests GET /users/me
  userReport += generateGetProfileTests();

  // Tests PATCH /users/me
  userReport += generateUpdateProfileTests();

  // Tests POST /users/me/avatar
  userReport += generateUploadAvatarTests();

  // Tests DELETE /users/me/avatar
  userReport += generateDeleteAvatarTests();

  // Tests PATCH /users/me/password
  userReport += generateChangePasswordTests();

  // Tests DELETE /users/me
  userReport += generateDeleteAccountTests();

  return userReport;
}

/**
 * 📋 Génère les tests GET /users/me
 */
function generateGetProfileTests() {
  let report = `## GET /api/v1/users/me (${USER_TEST_DATA.getProfile.total} tests de base + ${AUTH_TESTS_FOR_PROTECTED_ROUTES.getProfile.total} tests d'auth)

### Tests de base

`;

  USER_TEST_DATA.getProfile.tests.forEach((test, index) => {
    report += `#### ${index + 1}. ${test.name}
**Request:** \`${test.method} ${test.path}\`
${
  test.request
    ? `\`\`\`json
${JSON.stringify(test.request, null, 2)}
\`\`\``
    : ""
}
**Headers:** 
${Object.entries(test.headers)
  .map(([k, v]) => `- \`${k}: ${v}\``)
  .join("\n")}

**Response (${test.response.status}):**
\`\`\`json
${JSON.stringify(test.response.body, null, 2)}
\`\`\`

`;
  });

  report += `### Tests d'authentification (${AUTH_TESTS_FOR_PROTECTED_ROUTES.getProfile.total} tests)

`;

  AUTH_TESTS_FOR_PROTECTED_ROUTES.getProfile.tests.forEach((test, index) => {
    report += `#### ${index + 1}. ${test.name}
**Request:** \`${test.method} ${test.path}\`
${
  test.request
    ? `\`\`\`json
${JSON.stringify(test.request, null, 2)}
\`\`\``
    : ""
}
**Headers:** 
${Object.entries(test.headers)
  .map(([k, v]) => `- \`${k}: ${v}\``)
  .join("\n")}

**Response (${test.response.status}):**
\`\`\`json
${JSON.stringify(test.response.body, null, 2)}
\`\`\`

`;
  });

  return report;
}

/**
 * ✏️ Génère les tests PATCH /users/me
 */
function generateUpdateProfileTests() {
  let report = `## PATCH /api/v1/users/me (${USER_TEST_DATA.updateProfile.total} tests de validation + 10 tests d'auth)

### Tests de validation

`;

  USER_TEST_DATA.updateProfile.tests.forEach((test, index) => {
    report += `#### ${index + 1}. ${test.name}
**Request:** \`${test.method} ${test.path}\`
\`\`\`json
${JSON.stringify(test.request, null, 2)}
\`\`\`
**Headers:** 
${Object.entries(test.headers)
  .map(([k, v]) => `- \`${k}: ${v}\``)
  .join("\n")}

**Response (${test.response.status}):**
\`\`\`json
${JSON.stringify(test.response.body, null, 2)}
\`\`\`

`;
  });

  report += `### Tests d'authentification (10 tests)

#### 1-2. Token manquant (FR/EN)
#### 3-4. Token invalide (FR/EN)
#### 5-6. Token expiré (FR/EN)
#### 7-8. Token blacklisté (FR/EN)
#### 9-10. Utilisateur supprimé (FR/EN)

(Mêmes formats de réponse que les tests d'authentification de logout)

`;

  return report;
}

/**
 * 🖼️ Génère les tests POST /users/me/avatar
 */
function generateUploadAvatarTests() {
  let report = `## POST /api/v1/users/me/avatar (${USER_TEST_DATA.uploadAvatar.total} tests + 10 tests d'auth)

`;

  USER_TEST_DATA.uploadAvatar.tests.forEach((test, index) => {
    report += `### ${index + 1}. ${test.name}
**Request:** \`${test.method} ${test.path}\`
\`\`\`json
"${test.request}"
\`\`\`
**Headers:** 
${Object.entries(test.headers)
  .map(([k, v]) => `- \`${k}: ${v}\``)
  .join("\n")}

**Response (${test.response.status}):**
\`\`\`json
${JSON.stringify(test.response.body, null, 2)}
\`\`\`

`;
  });

  report += `### Tests d'authentification (10 tests)

#### 1-2. Token manquant (FR/EN)
#### 3-4. Token invalide (FR/EN)
#### 5-6. Token expiré (FR/EN)
#### 7-8. Token blacklisté (FR/EN)
#### 9-10. Utilisateur supprimé (FR/EN)

(Mêmes formats de réponse que les tests d'authentification de logout)

`;

  return report;
}

/**
 * 🗑️ Génère les tests DELETE /users/me/avatar
 */
function generateDeleteAvatarTests() {
  let report = `## DELETE /api/v1/users/me/avatar (${USER_TEST_DATA.deleteAvatar.total} tests + 10 tests d'auth)

`;

  USER_TEST_DATA.deleteAvatar.tests.forEach((test, index) => {
    report += `### ${index + 1}. ${test.name}
**Request:** \`${test.method} ${test.path}\`
${
  test.request
    ? `\`\`\`json
${JSON.stringify(test.request, null, 2)}
\`\`\``
    : ""
}
**Headers:** 
${Object.entries(test.headers)
  .map(([k, v]) => `- \`${k}: ${v}\``)
  .join("\n")}

**Response (${test.response.status}):**
\`\`\`json
${JSON.stringify(test.response.body, null, 2)}
\`\`\`

`;
  });

  report += `### Tests d'authentification (10 tests)

#### 1-2. Token manquant (FR/EN)
#### 3-4. Token invalide (FR/EN)
#### 5-6. Token expiré (FR/EN)
#### 7-8. Token blacklisté (FR/EN)
#### 9-10. Utilisateur supprimé (FR/EN)

(Mêmes formats de réponse que les tests d'authentification de logout)

`;

  return report;
}

/**
 * 🔐 Génère les tests PATCH /users/me/password
 */
function generateChangePasswordTests() {
  let report = `## PATCH /api/v1/users/me/password (${USER_TEST_DATA.changePassword.total} tests + 10 tests d'auth)

`;

  USER_TEST_DATA.changePassword.tests.forEach((test, index) => {
    report += `### ${index + 1}. ${test.name}
**Request:** \`${test.method} ${test.path}\`
\`\`\`json
${JSON.stringify(test.request, null, 2)}
\`\`\`
**Headers:** 
${Object.entries(test.headers)
  .map(([k, v]) => `- \`${k}: ${v}\``)
  .join("\n")}

**Response (${test.response.status}):**
\`\`\`json
${JSON.stringify(test.response.body, null, 2)}
\`\`\`

`;
  });

  report += `### Tests d'authentification (10 tests)

#### 1-2. Token manquant (FR/EN)
#### 3-4. Token invalide (FR/EN)
#### 5-6. Token expiré (FR/EN)
#### 7-8. Token blacklisté (FR/EN)
#### 9-10. Utilisateur supprimé (FR/EN)

(Mêmes formats de réponse que les tests d'authentification de logout)

`;

  return report;
}

/**
 * 🗑️ Génère les tests DELETE /users/me
 */
function generateDeleteAccountTests() {
  let report = `## DELETE /api/v1/users/me (${USER_TEST_DATA.deleteAccount.total} tests + 10 tests d'auth)

`;

  USER_TEST_DATA.deleteAccount.tests.forEach((test, index) => {
    report += `### ${index + 1}. ${test.name}
**Request:** \`${test.method} ${test.path}\`
\`\`\`json
${JSON.stringify(test.request, null, 2)}
\`\`\`
**Headers:** 
${Object.entries(test.headers)
  .map(([k, v]) => `- \`${k}: ${v}\``)
  .join("\n")}

**Response (${test.response.status}):**
\`\`\`json
${JSON.stringify(test.response.body, null, 2)}
\`\`\`

`;
  });

  report += `### Tests d'authentification (10 tests)

#### 1-2. Token manquant (FR/EN)
#### 3-4. Token invalide (FR/EN)
#### 5-6. Token expiré (FR/EN)
#### 7-8. Token blacklisté (FR/EN)
#### 9-10. Utilisateur supprimé (FR/EN)

(Mêmes formats de réponse que les tests d'authentification de logout)

`;

  return report;
}

/**
 * 💾 Sauvegarde le rapport
 */
function saveReport(report) {
  try {
    fs.writeFileSync(CONFIG.outputFile, report, "utf8");
    log.success(`Rapport généré: ${CONFIG.outputFile}`);
  } catch (error) {
    log.error(`Erreur lors de la sauvegarde: ${error.message}`);
  }
}

/**
 * 🎯 Point d'entrée principal
 */
function main() {
  try {
    const report = generateReport();
    saveReport(report);
    log.info("Génération terminée avec succès");
  } catch (error) {
    log.error(`Erreur fatale: ${error.message}`);
    process.exit(1);
  }
}

// Lancement du script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default { generateReport, saveReport };
