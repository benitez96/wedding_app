#!/usr/bin/env tsx

/**
 * Script helper para generar el enum de íconos de Zod
 * Útil cuando agregás nuevos íconos al catálogo
 *
 * Uso:
 *   pnpm tsx scripts/generate-icon-enum.ts
 *
 * Copia el output y pegalo en tus schemas
 */

import { SECTION_ICON_CATALOG } from "../types/section-icon";

function generateZodEnum() {
  const values = SECTION_ICON_CATALOG.map((icon) => `"${icon.value}"`);

  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║  Enum de Zod para SectionIcon                              ║");
  console.log(
    "╚════════════════════════════════════════════════════════════╝\n",
  );

  console.log("Copiá esto en tus schemas (.metadata.ts):\n");

  console.log(`icon: z
  .enum([
    ${values.join(",\n    ")},
  ])
  .default("TU_DEFAULT_AQUI"),\n`);

  console.log("═══════════════════════════════════════════════════════════\n");
  console.log(`Total de íconos: ${values.length}`);
  console.log("\nDesglose por tipo:");

  const byType = SECTION_ICON_CATALOG.reduce(
    (acc, icon) => {
      acc[icon.type] = (acc[icon.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  Object.entries(byType).forEach(([type, count]) => {
    console.log(`  - ${type}: ${count}`);
  });
}

generateZodEnum();
