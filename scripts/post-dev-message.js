#!/usr/bin/env node

const { exec } = require("child_process");

// Function to check the status of Docker containers
function checkContainerStatus() {
  return new Promise((resolve) => {
    exec(
      "docker compose -f docker/docker-compose.yml ps --format json",
      (error, stdout) => {
        if (error) {
          // If there's an error, return an empty list
          return resolve([]);
        }

        const lines = stdout.trim().split("\n");
        const containers = [];

        for (const line of lines) {
          try {
            const container = JSON.parse(line);
            // Only keep containers that are running
            if (container.State === "running") {
              containers.push(container);
            }
          } catch (_) {
            // Ignore non-JSON lines (e.g., error or unexpected output)
          }
        }

        resolve(containers);
      }
    );
  });
}

// Main function to check container status and display info
async function main() {
  console.log("\n🔍 Checking container status...");

  // Wait 1.5 seconds before checking (simulate loading)
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const runningContainers = await checkContainerStatus();

  if (runningContainers.length === 0) {
    console.log("⚠️  No containers detected. Check with: npm run status");
    return;
  }

  console.log("✅ Infrastructure successfully started!\n");

  console.log("📊 Active containers:");
  runningContainers.forEach((container) => {
    const name = container.Name || container.Service;
    const ports = container.Publishers?.length
      ? container.Publishers.map(
          (p) => `${p.PublishedPort}:${p.TargetPort}`
        ).join(", ")
      : "N/A";
    console.log(`   - ${name} (ports: ${ports})`);
  });

  console.log("\n🌐 Available interfaces:");

  // Core admin interfaces
  if (runningContainers.some((c) => c.Name.includes("mongo-express"))) {
    console.log("   - MongoDB Admin: http://localhost:8082 (admin/admin)");
  }
  if (runningContainers.some((c) => c.Name.includes("redis-commander"))) {
    console.log("   - Redis Admin: http://localhost:8081 (admin/admin)");
  }

  // GlitchTip interface
  if (runningContainers.some((c) => c.Name.includes("glitchtip-web"))) {
    console.log("   - GlitchTip (Error Monitoring): http://localhost:8090");
  }

  console.log("\n🔧 Useful commands:");
  console.log("   - npm run status       → Check container status");
  console.log("   - npm run logs         → View all logs");
  console.log("   - npm run logs:glitch  → View GlitchTip logs");
  console.log("   - npm run stop         → Stop the infrastructure");

  console.log("\n🎯 Infrastructure ready for development!");

  // Additional GlitchTip setup info if it's running
  if (runningContainers.some((c) => c.Name.includes("glitchtip-web"))) {
    console.log("\n💡 GlitchTip first-time setup:");
    console.log("   1. Visit http://localhost:8090");
    console.log("   2. Create your admin account");
    console.log("   3. Set up your first organization");
  }
}

// Execute the main function and catch any unexpected errors
main().catch(console.error);
