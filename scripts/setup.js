#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { exec } from "child_process";

// Import permission fixing utilities
import {
  fixExceptionlessPermissions,
  checkDockerRunning,
} from "./fix-permissions.js";

// Function to generate a secure random key
function generateSecretKey(length = 64) {
  return new Promise((resolve, reject) => {
    exec(`openssl rand -hex ${length / 2}`, (error, stdout) => {
      if (error) {
        // Fallback to a basic random generation if openssl is not available
        const chars = "abcdef0123456789";
        let result = "";
        for (let i = 0; i < length; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        resolve(result);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

// Function to copy the .env.example file to .env if it doesn't already exist
function copyEnvFile() {
  const envExample = path.join(process.cwd(), "docker", ".env.example");
  const envFile = path.join(process.cwd(), "docker", ".env");

  try {
    if (fs.existsSync(envFile)) {
      console.log("⚠️  The docker/.env file already exists");
      return;
    }

    fs.copyFileSync(envExample, envFile);
    console.log("✅ File docker/.env created from .env.example");
  } catch (error) {
    console.error("❌ Error while copying the .env file:", error.message);
    process.exit(1); // Exit the process with an error code
  }
}

// Main setup function
async function main() {
  console.log(
    "🚀 Setting up the Emailight infrastructure with Exceptionless...\n"
  );

  copyEnvFile();

  // Fix Exceptionless permissions if Docker is available
  console.log("🔧 Setting up Docker volumes and permissions...");
  if (await checkDockerRunning()) {
    await fixExceptionlessPermissions();
  } else {
    console.log(
      "⚠️  Docker not available - permissions will be fixed on first start"
    );
  }

  console.log("\n🔐 Security recommendations:");
  console.log("1. Generate secure passwords for:");
  console.log("   - MONGO_ROOT_PASSWORD");
  console.log("   - MONGO_APP_PASSWORD");
  console.log("   - REDIS_PASSWORD");

  try {
    const exceptionlessKey = await generateSecretKey(64);
    console.log("2. Use this generated Exceptionless signing key:");
    console.log(`   EXCEPTIONLESS_TOKEN_SIGNING_KEY=${exceptionlessKey}`);
  } catch (error) {
    console.log(
      "2. Generate an Exceptionless signing key with: openssl rand -hex 32"
    );
  }

  try {
    const jwtSecret = await generateSecretKey(32);
    console.log("3. Use this generated JWT secret:");
    console.log(`   JWT_SECRET=${jwtSecret}`);
  } catch (error) {
    console.log("3. Generate a JWT secret with: openssl rand -hex 16");
  }

  console.log("\n📝 Next steps:");
  console.log("1. Edit docker/.env with your secure configuration");
  console.log("2. Run npm run dev to start the infrastructure");
  console.log("3. Access admin interfaces:");
  console.log("   - MongoDB: http://localhost:8082 (admin/admin)");
  console.log("   - Redis: http://localhost:8081 (admin/admin)");
  console.log(
    "   - Exceptionless: http://localhost:5000 (create account on first visit)"
  );

  console.log("\n🔧 Exceptionless setup:");
  console.log("1. After starting, visit http://localhost:5000");
  console.log("2. Create your admin account");
  console.log("3. Create a new project for 'user-service'");
  console.log(
    "4. Copy the API key and add it to USER_SERVICE_EXCEPTIONLESS_API_KEY in .env"
  );
  console.log("5. Restart the user-service to activate monitoring");

  console.log("\n💡 Useful commands:");
  console.log(
    "   - npm run dev:infra      → Start only infrastructure (MongoDB, Redis)"
  );
  console.log(
    "   - npm run dev:monitoring → Start only monitoring (Exceptionless)"
  );
  console.log("   - npm run dev:admin      → Start only admin interfaces");
  console.log("   - npm run logs:exceptionless → View Exceptionless logs");
  console.log(
    "   - npm run fix:permissions → Fix Exceptionless volume permissions"
  );

  console.log("\n✨ Setup complete!");
}

// Run the main function
main();
