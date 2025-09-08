#!/usr/bin/env node

import { exec } from "child_process";

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

  // Exceptionless interface
  if (runningContainers.some((c) => c.Name.includes("exceptionless"))) {
    console.log("   - Exceptionless (Error Monitoring): http://localhost:5000");
  }

  console.log("\n🔧 Useful commands:");
  console.log("   - npm run status              → Check container status");
  console.log("   - npm run logs                → View all logs");
  console.log("   - npm run logs:exceptionless  → View Exceptionless logs");
  console.log("   - npm run stop                → Stop the infrastructure");

  console.log("\n🎯 Infrastructure ready for development!");

  // Additional Exceptionless setup info if it's running
  if (runningContainers.some((c) => c.Name.includes("exceptionless"))) {
    console.log("\n💡 Exceptionless first-time setup:");
    console.log("   1. Visit http://localhost:5000");
    console.log("   2. Create your admin account");
    console.log("   3. Create your first project");
    console.log(
      "   4. Copy the API key to USER_SERVICE_EXCEPTIONLESS_API_KEY in .env"
    );
    console.log("   5. Restart the user-service: npm run restart:user");
  }

  // Health check suggestions
  const unhealthyContainers = runningContainers.filter(
    (c) => c.Health === "unhealthy"
  );
  if (unhealthyContainers.length > 0) {
    console.log("\n⚠️  Some containers are unhealthy:");
    unhealthyContainers.forEach((c) => {
      console.log(`   - ${c.Name}: ${c.Health}`);
    });
    console.log("   Run 'npm run logs' to investigate issues");
  }
}

// Execute the main function and catch any unexpected errors
main().catch(console.error);
