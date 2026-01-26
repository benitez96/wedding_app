#!/usr/bin/env tsx

import prisma from "../lib/prisma";

/**
 * Script para limpiar logs de seguridad antiguos
 * Se recomienda ejecutar periódicamente (ej: cronjob diario)
 *
 * Configuración:
 * - Retiene logs de los últimos 90 días
 * - Elimina logs más antiguos para mantener la BD limpia
 */

const RETENTION_DAYS = 90;

async function cleanupSecurityLogs() {
  console.log("🧹 Limpiando logs de seguridad antiguos...");
  console.log(`📅 Reteniendo logs de los últimos ${RETENTION_DAYS} días`);

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

    console.log(`🗓️  Fecha de corte: ${cutoffDate.toISOString()}`);

    // Eliminar logs más antiguos que la fecha de corte
    const result = await prisma.securityLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`✅ Eliminados ${result.count} logs antiguos`);
    console.log("✅ Limpieza completada exitosamente");
  } catch (error) {
    console.error("❌ Error durante la limpieza:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  try {
    await cleanupSecurityLogs();
    process.exit(0);
  } catch (error) {
    console.error("❌ Falló la limpieza de logs de seguridad:", error);
    process.exit(1);
  }
}

main();
