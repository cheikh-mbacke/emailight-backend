#!/usr/bin/env node

const { exec } = require("child_process");

function checkContainerStatus() {
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
            if (container.State === "running") {
              containers.push(container);
            }
          } catch (_) {
            // Ligne non JSON, on ignore
          }
        }

        resolve(containers);
      }
    );
  });
}

async function main() {
  console.log("\n🔍 Vérification de l'état des containers...");

  await new Promise((resolve) => setTimeout(resolve, 1500));

  const runningContainers = await checkContainerStatus();

  if (runningContainers.length === 0) {
    console.log("⚠️  Aucun container détecté. Vérifiez avec: npm run status");
    return;
  }

  console.log("✅ Infrastructure démarrée avec succès !\n");

  console.log("📊 Containers actifs :");
  runningContainers.forEach((container) => {
    const name = container.Name || container.Service;
    const ports = container.Publishers?.length
      ? container.Publishers.map(
          (p) => `${p.PublishedPort}:${p.TargetPort}`
        ).join(", ")
      : "N/A";
    console.log(`   - ${name} (ports: ${ports})`);
  });

  console.log("\n🌐 Interfaces disponibles :");
  if (runningContainers.some((c) => c.Name.includes("mongo-express"))) {
    console.log("   - MongoDB Admin: http://localhost:8082 (admin/admin)");
  }
  if (runningContainers.some((c) => c.Name.includes("redis-commander"))) {
    console.log("   - Redis Admin: http://localhost:8081");
  }

  console.log("\n🔧 Commandes utiles :");
  console.log("   - npm run status    → État des containers");
  console.log("   - npm run logs      → Voir tous les logs");
  console.log("   - npm run stop      → Arrêter l'infrastructure");

  console.log("\n🎯 Infrastructure prête pour le développement !");
}

main().catch(console.error);
