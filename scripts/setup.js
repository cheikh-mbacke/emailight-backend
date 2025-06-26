#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

// Function to generate a secure random key
function generateSecretKey() {
  return new Promise((resolve, reject) => {
    exec("openssl rand -hex 32", (error, stdout) => {
      if (error) {
        // Fallback to a basic random generation if openssl is not available
        const chars = "abcdef0123456789";
        let result = "";
        for (let i = 0; i < 64; i++) {
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
  const envExample = path.join(__dirname, "..", "docker", ".env.example");
  const envFile = path.join(__dirname, "..", "docker", ".env");

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
  console.log("🚀 Setting up the Emailight infrastructure...\n");

  copyEnvFile();

  console.log("\n🔐 Security recommendations:");
  console.log("1. Generate secure passwords for:");
  console.log("   - MONGO_ROOT_PASSWORD");
  console.log("   - MONGO_APP_PASSWORD");
  console.log("   - REDIS_PASSWORD");
  console.log("   - GLITCHTIP_POSTGRES_PASSWORD");

  try {
    const secretKey = await generateSecretKey();
    console.log("2. Use this generated GlitchTip secret key:");
    console.log(`   GLITCHTIP_SECRET_KEY=${secretKey}`);
  } catch (error) {
    console.log(
      "2. Generate a GlitchTip secret key with: openssl rand -hex 32"
    );
  }

  console.log("\n📝 Next steps:");
  console.log("1. Edit docker/.env with your secure configuration");
  console.log("2. Run npm run dev to start the infrastructure");
  console.log("3. Access admin interfaces:");
  console.log("   - MongoDB: http://localhost:8082 (admin/admin)");
  console.log("   - Redis: http://localhost:8081 (admin/admin)");
  console.log(
    "   - GlitchTip: http://localhost:8090 (create account on first visit)"
  );

  console.log("\n✨ Setup complete!");
}

// Run the main function
main();
