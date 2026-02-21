/**
 * Load check-in strategy configuration for an event
 *
 * Combines:
 * - Per-event strategy selection (from Configuration table)
 * - Global timeout/threshold values (from environment variables)
 */

import prisma from "@/lib/prisma";
import { CONFIGURATION_KEYS } from "@/types/configuration";
import type {
  CheckInStrategyConfig,
  CheckInStrategyType,
} from "@/types/check-in-strategy";

/**
 * Get check-in configuration for a specific event
 */
export async function getCheckInConfig(
  eventId: string,
): Promise<CheckInStrategyConfig> {
  // Load strategy from database (per-event configuration)
  const strategyConfig = await prisma.configuration.findUnique({
    where: {
      eventId_key: {
        eventId,
        key: CONFIGURATION_KEYS.CHECKIN_STRATEGY,
      },
    },
  });

  const strategy =
    (strategyConfig?.value as CheckInStrategyType) || "HYBRID_SMART";

  // Load timeouts/thresholds from environment variables (global configuration)
  const serverTimeoutMs = Number.parseInt(
    process.env.CHECKIN_SERVER_TIMEOUT_MS || "5000",
    10,
  );

  const maxStalenessMs = Number.parseInt(
    process.env.CHECKIN_CACHE_STALE_THRESHOLD_MS || "30000",
    10,
  );

  const networkLatencyThresholdMs = Number.parseInt(
    process.env.CHECKIN_LATENCY_THRESHOLD_MS || "500",
    10,
  );

  return {
    strategy,
    serverTimeoutMs,
    maxStalenessMs,
    parallelRaceEnabled: true, // Always enabled for HYBRID_SMART
    networkLatencyThresholdMs,
  };
}
