/**
 * 🛠️ Utilitaires pour les tests
 */

import http from "http";
import { randomBytes } from "crypto";

/**
 * Configuration des tests
 */
export const TEST_CONFIG = {
  baseUrl: "http://localhost:3001",
  apiPrefix: "/api/v1",
  timeout: 30000, // Augmenté à 30s pour être cohérent avec jest.setTimeout(30000)
  colors: {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
    bold: "\x1b[1m",
  },
};

/**
 * 🌐 Effectue une requête HTTP
 */
export function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;

    const options = {
      hostname: "localhost",
      port: 3001,
      path: `${TEST_CONFIG.apiPrefix}${path}`,
      method: method,
      headers: {
        "User-Agent": "Emailight-Test-Suite/1.0",
        "X-Test-Environment": "Docker-Container",
        ...headers,
      },
      timeout: TEST_CONFIG.timeout,
    };

    if (postData) {
      options.headers["Content-Type"] = "application/json";
      options.headers["Content-Length"] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let body = "";

      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null,
          };
          resolve(response);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            parseError: error.message,
          });
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    if (postData) {
      req.write(postData);
    }

    req.end();
  });
}

/**
 * 🏥 Vérifie la santé du serveur
 */
export function makeHealthCheck() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 3001,
      path: "/health",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Emailight-Test-Suite/1.0",
        "X-Test-Environment": "Docker-Container",
      },
      timeout: TEST_CONFIG.timeout,
    };

    const req = http.request(options, (res) => {
      let body = "";

      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null,
          };
          resolve(response);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            parseError: error.message,
          });
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.end();
  });
}

/**
 * 🎲 Génère un email unique pour les tests
 */
export function generateTestEmail(prefix = "test") {
  return `${prefix}-${randomBytes(4).toString("hex")}@emailight.com`;
}

/**
 * 🎲 Génère un nom unique pour les tests
 */
export function generateTestName(prefix = "TestUser") {
  return `${prefix}-${randomBytes(4).toString("hex")}`;
}

/**
 * ⏱️ Délai pour éviter le rate limiting
 */
export function delay(ms = 500) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 🎨 Utilitaires d'affichage coloré
 */
export const log = {
  success: (msg) =>
    console.log(
      `${TEST_CONFIG.colors.green}✅ ${msg}${TEST_CONFIG.colors.reset}`
    ),
  error: (msg) =>
    console.log(
      `${TEST_CONFIG.colors.red}❌ ${msg}${TEST_CONFIG.colors.reset}`
    ),
  warning: (msg) =>
    console.log(
      `${TEST_CONFIG.colors.yellow}⚠️  ${msg}${TEST_CONFIG.colors.reset}`
    ),
  info: (msg) =>
    console.log(
      `${TEST_CONFIG.colors.blue}ℹ️  ${msg}${TEST_CONFIG.colors.reset}`
    ),
  title: (msg) =>
    console.log(
      `${TEST_CONFIG.colors.bold}${TEST_CONFIG.colors.cyan}🔥 ${msg}${TEST_CONFIG.colors.reset}\n`
    ),
  section: (msg) =>
    console.log(
      `\n${TEST_CONFIG.colors.yellow}📋 ${msg}${TEST_CONFIG.colors.reset}`
    ),
};
