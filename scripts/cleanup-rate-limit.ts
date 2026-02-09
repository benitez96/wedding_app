#!/usr/bin/env tsx

import { cleanupOldRateLimitData } from "../lib/rate-limiter-prisma";

async function main() {
  console.log("🧹 Limpiando datos antiguos de rate limiting...");

  try {
    await cleanupOldRateLimitData();
    console.log("✅ Limpieza completada exitosamente");
  } catch (error) {
    console.error("❌ Error durante la limpieza:", error);
    process.exit(1);
  }
}

main();
