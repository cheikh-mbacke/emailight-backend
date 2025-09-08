#!/usr/bin/env node

import { exec } from "child_process";

// Function to get container status with formatted output
function getContainerStatus() {
  return new Promise((resolve) => {
    exec(
      "docker compose -f docker/docker-compose.yml ps --format json",
      (error, stdout) => {
        if (error) {
          return resolve([]);
        }

        const lines = stdout.trim().split("\n");
        const containers = [];

        for (const line of lines) {
          try {
            const container = JSON.parse(line);
            containers.push(container);
          } catch (_) {
            // Ignore non-JSON lines
          }
        }

        resolve(containers);
      }
    );
  });
}

// Function to format container information
function formatContainer(container) {
  const name = container.Name || container.Service;
  const status = container.State;
  const health = container.Health || "N/A";

  // Extract and format ports
  let ports = "No ports";
  if (container.Publishers && container.Publishers.length > 0) {
    ports = container.Publishers.map(
      (p) => `${p.PublishedPort}→${p.TargetPort}`
    ).join(", ");
  }

  // Status emoji
  const statusEmoji =
    status === "running"
      ? "✅"
      : status === "exited"
      ? "❌"
      : status === "starting"
      ? "🔄"
      : "⚠️";

  // Health emoji
  const healthEmoji =
    health === "healthy"
      ? "💚"
      : health === "unhealthy"
      ? "❤️"
      : health === "starting"
      ? "🔄"
      : "";

  return {
    name: name.replace("emailight-", ""),
    status,
    statusEmoji,
    health,
    healthEmoji,
    ports,
  };
}

// Function to categorize containers
function categorizeContainers(containers) {
  const categories = {
    infrastructure: [],
    admin: [],
    monitoring: [],
    services: [],
  };

  containers.forEach((container) => {
    const formatted = formatContainer(container);
    const name = formatted.name.toLowerCase();

    if (name.includes("mongodb") || name.includes("redis")) {
      categories.infrastructure.push(formatted);
    } else if (
      name.includes("mongo-express") ||
      name.includes("redis-commander")
    ) {
      categories.admin.push(formatted);
    } else if (name.includes("exceptionless")) {
      categories.monitoring.push(formatted);
    } else if (name.includes("service")) {
      categories.services.push(formatted);
    }
  });

  return categories;
}

// Function to display a category
function displayCategory(title, containers, emoji) {
  if (containers.length === 0) return;

  console.log(`\n${emoji} ${title}:`);
  containers.forEach((container) => {
    const healthDisplay = container.healthEmoji
      ? ` ${container.healthEmoji}`
      : "";
    console.log(
      `   ${container.statusEmoji} ${container.name.padEnd(20)} │ ${
        container.ports
      }${healthDisplay}`
    );
  });
}

// Function to display quick access URLs
function displayQuickAccess(categories) {
  const urls = [];

  // Admin interfaces
  categories.admin.forEach((container) => {
    if (
      container.name.includes("mongo-express") &&
      container.status === "running"
    ) {
      urls.push("📊 MongoDB Admin: http://localhost:8082 (admin/admin)");
    }
    if (
      container.name.includes("redis-commander") &&
      container.status === "running"
    ) {
      urls.push("📊 Redis Admin: http://localhost:8081 (admin/admin)");
    }
  });

  // Monitoring
  categories.monitoring.forEach((container) => {
    if (
      container.name.includes("exceptionless") &&
      container.status === "running"
    ) {
      urls.push("🔍 Exceptionless: http://localhost:5000");
    }
  });

  if (urls.length > 0) {
    console.log("\n🌐 Quick Access:");
    urls.forEach((url) => console.log(`   ${url}`));
  }
}

// Function to display monitoring status
function displayMonitoringStatus(categories) {
  const exceptionless = categories.monitoring.find(
    (c) => c.name.includes("exceptionless") && c.status === "running"
  );

  const elasticsearch = categories.infrastructure.find(
    (c) => c.name.includes("elasticsearch") && c.status === "running"
  );

  if (exceptionless || elasticsearch) {
    console.log("\n📊 Monitoring Status:");

    if (elasticsearch) {
      console.log(
        `   📦 Elasticsearch: ${elasticsearch.statusEmoji} ${elasticsearch.status}`
      );
    }

    if (exceptionless) {
      console.log(
        `   🔍 Exceptionless: ${exceptionless.statusEmoji} ${exceptionless.status}`
      );
    }

    if (exceptionless && exceptionless.status === "running") {
      console.log("\n💡 Next steps for monitoring:");
      console.log(
        "   1. Visit http://localhost:5000 to configure Exceptionless"
      );
      console.log("   2. Create a project and get your API key");
      console.log(
        "   3. Add the API key to USER_SERVICE_EXCEPTIONLESS_API_KEY in .env"
      );
    }
  }
}

// Main function
async function main() {
  console.log("🔍 Emailight Infrastructure Status\n");

  const containers = await getContainerStatus();

  if (containers.length === 0) {
    console.log(
      '⚠️  No containers found. Run "npm run dev" to start the infrastructure.'
    );
    return;
  }

  const categories = categorizeContainers(containers);

  // Display categories
  displayCategory("Infrastructure", categories.infrastructure, "🏗️");
  displayCategory("Admin Interfaces", categories.admin, "👥");
  displayCategory("Monitoring", categories.monitoring, "📊");
  displayCategory("Microservices", categories.services, "🔧");

  // Display quick access
  displayQuickAccess(categories);

  // Display monitoring-specific status
  displayMonitoringStatus(categories);

  // Summary
  const running = containers.filter((c) => c.State === "running").length;
  const total = containers.length;
  const healthy = containers.filter((c) => c.Health === "healthy").length;
  const unhealthy = containers.filter((c) => c.Health === "unhealthy").length;

  console.log(`\n📋 Summary: ${running}/${total} containers running`);

  if (healthy > 0 || unhealthy > 0) {
    console.log(`   Health: ${healthy} healthy, ${unhealthy} unhealthy`);
  }

  if (running < total) {
    console.log('💡 Tip: Use "npm run logs" to check for issues');
  }

  if (unhealthy > 0) {
    console.log("⚠️  Some containers are unhealthy. Check logs for details.");
  }
}

// Execute
main().catch(console.error);
