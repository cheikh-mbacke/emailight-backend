#!/usr/bin/env node

import { exec } from "child_process";
import path from "path";

// Check if running in auto mode (silent)
const isAutoMode = process.argv.includes("--auto");

// Function to log only if not in auto mode
function log(message) {
  if (!isAutoMode) {
    console.log(message);
  }
}

// Function to execute shell commands with promise
function execCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stderr: stderr.trim() });
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

// Function to check if a volume exists
async function volumeExists(volumeName) {
  try {
    await execCommand(`docker volume inspect ${volumeName}`);
    return true;
  } catch {
    return false;
  }
}

// Function to fix Exceptionless volume permissions
async function fixExceptionlessPermissions() {
  const volumeName = "docker_exceptionless_storage";

  if (!isAutoMode) {
    console.log("🔧 Checking Exceptionless volume permissions...");
  }

  try {
    // Check if volume exists
    if (!(await volumeExists(volumeName))) {
      log(
        `📦 Volume ${volumeName} doesn't exist yet - will be created on first run`
      );
      return true;
    }

    log(`📦 Volume ${volumeName} found, fixing permissions...`);

    // Fix permissions using busybox
    await execCommand(
      `docker run --rm -v ${volumeName}:/app busybox chown -R 1000:1000 /app`,
      { timeout: 30000 }
    );

    log("✅ Exceptionless volume permissions fixed");
    return true;
  } catch (error) {
    if (!isAutoMode) {
      console.error(
        "❌ Error fixing Exceptionless permissions:",
        error.stderr || error.error?.message
      );
    }
    return false;
  }
}

// Function to check if Docker is running
async function checkDockerRunning() {
  try {
    await execCommand("docker info");
    return true;
  } catch {
    if (!isAutoMode) {
      console.error("❌ Docker is not running or not accessible");
      console.log("💡 Please start Docker and try again");
    }
    return false;
  }
}

// Main function for standalone usage
async function main() {
  if (!isAutoMode) {
    console.log("🚀 Fixing Exceptionless permissions...\n");
  }

  if (!(await checkDockerRunning())) {
    if (!isAutoMode) {
      process.exit(1);
    }
    return false;
  }

  const success = await fixExceptionlessPermissions();

  if (!isAutoMode) {
    if (success) {
      console.log("\n✨ Permissions fixed successfully!");
      console.log("💡 You can now start Exceptionless with: npm run dev");
    } else {
      console.log("\n⚠️  Failed to fix permissions");
      console.log("💡 You may need to run this manually:");
      console.log(
        "   docker run --rm -v docker_exceptionless_storage:/app busybox chown -R 1000:1000 /app"
      );
      process.exit(1);
    }
  }

  return success;
}

// Export functions for use in other scripts
export {
  fixExceptionlessPermissions,
  checkDockerRunning,
  volumeExists,
  execCommand,
};

// Run main if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
