/**
 * Check-in Strategy Pattern types
 *
 * Enables configurable check-in flows optimized for different network conditions:
 * - IDB_FIRST: Fast UX, eventual consistency (default for slow networks)
 * - SERVER_FIRST: Authoritative, slower UX (when network is fast + reliability critical)
 * - HYBRID_SMART: Dynamic strategy selection based on real-time conditions
 */


// ============================================
// STRATEGY TYPES
// ============================================

export const CheckInStrategyType = {
  IDB_FIRST: "IDB_FIRST",
  SERVER_FIRST: "SERVER_FIRST",
  HYBRID_SMART: "HYBRID_SMART",
} as const;

export type CheckInStrategyType =
  (typeof CheckInStrategyType)[keyof typeof CheckInStrategyType];

// ============================================
// CONFIGURATION
// ============================================

export interface CheckInStrategyConfig {
  strategy: CheckInStrategyType;
  serverTimeoutMs: number; // Timeout for server requests
  maxStalenessMs: number; // IDB cache considered stale after this
  parallelRaceEnabled: boolean; // Enable Promise.race for PARALLEL mode
  networkLatencyThresholdMs: number; // Network latency threshold for strategy decision
}

export const DEFAULT_STRATEGY_CONFIG: CheckInStrategyConfig = {
  strategy: "IDB_FIRST",
  serverTimeoutMs: 1200,
  maxStalenessMs: 60_000, // 60s
  parallelRaceEnabled: true,
  networkLatencyThresholdMs: 500,
};

// ============================================
// NETWORK MONITORING
// ============================================

export interface NetworkMetrics {
  isOnline: boolean;
  latencyMs: number; // Average latency from recent pings
  lastMeasuredAt: number; // Timestamp of last measurement
}

export interface CacheStaleness {
  lastSyncedAt: number; // Timestamp of last successful cache sync
  stalenessMs: number; // Time since last sync
  isStale: boolean; // Whether cache exceeds staleness threshold
}

// ============================================
// CHECK-IN ATTEMPT
// ============================================

export interface CheckInAttemptInput {
  invitationId: string;
  tokenId: string;
  guestsCount: number;
}

export interface CheckInAttemptResult {
  success: boolean;
  source: "IDB" | "SERVER" | "OFFLINE_QUEUE"; // Where the data came from
  invitation?: ScannedInvitationData;
  error?: string;
  warning?: string;
  queued?: boolean; // True if queued for later sync
  exceededCapacity?: boolean;
}

export interface ScannedInvitationData {
  id: string;
  tokenId: string;
  guestName: string;
  guestNickname: string | null;
  maxGuests: number;
  checkInCount: number;
  remaining: number;
}

// ============================================
// STRATEGY INTERFACE
// ============================================

/**
 * Base interface for all check-in strategies.
 * Each strategy implements its own logic for:
 * - Validating scanned QR codes
 * - Creating check-ins (online/offline)
 * - Handling network failures gracefully
 */
export interface ICheckInStrategy {
  /**
   * Validate a scanned QR token and return invitation data.
   * May return cached data (IDB_FIRST) or fresh server data (SERVER_FIRST).
   */
  validateQR(tokenId: string, eventId: string): Promise<CheckInAttemptResult>;

  /**
   * Create a check-in for the given invitation.
   * May POST to server (online) or queue in IDB (offline).
   */
  createCheckIn(input: CheckInAttemptInput): Promise<CheckInAttemptResult>;

  /**
   * Strategy name for logging/debugging
   */
  getName(): string;
}

// ============================================
// HYBRID SMART DECISION CONTEXT
// ============================================

/**
 * Context used by HYBRID_SMART strategy to decide which mode to use
 */
export interface StrategyDecisionContext {
  networkMetrics: NetworkMetrics;
  cacheStaleness: CacheStaleness;
  config: CheckInStrategyConfig;
}

export const StrategyMode = {
  IDB: "IDB",
  SERVER: "SERVER",
  PARALLEL: "PARALLEL",
} as const;

export type StrategyMode = (typeof StrategyMode)[keyof typeof StrategyMode];

// ============================================
// HELPER TYPE GUARDS
// ============================================

export function isCheckInStrategyType(
  value: string,
): value is CheckInStrategyType {
  return Object.values(CheckInStrategyType).includes(
    value as CheckInStrategyType,
  );
}

export function parseStrategyConfig(
  configMap: Record<string, string>,
): CheckInStrategyConfig {
  const strategy = configMap["checkin.strategy"];
  const serverTimeout = configMap["checkin.serverTimeoutMs"];
  const maxStaleness = configMap["checkin.maxStalenessMs"];
  const parallelRace = configMap["checkin.parallelRaceEnabled"];
  const latencyThreshold = configMap["checkin.networkLatencyThresholdMs"];

  return {
    strategy: isCheckInStrategyType(strategy)
      ? strategy
      : DEFAULT_STRATEGY_CONFIG.strategy,
    serverTimeoutMs: serverTimeout
      ? Number(serverTimeout)
      : DEFAULT_STRATEGY_CONFIG.serverTimeoutMs,
    maxStalenessMs: maxStaleness
      ? Number(maxStaleness)
      : DEFAULT_STRATEGY_CONFIG.maxStalenessMs,
    parallelRaceEnabled:
      parallelRace === "true" || parallelRace === undefined
        ? DEFAULT_STRATEGY_CONFIG.parallelRaceEnabled
        : false,
    networkLatencyThresholdMs: latencyThreshold
      ? Number(latencyThreshold)
      : DEFAULT_STRATEGY_CONFIG.networkLatencyThresholdMs,
  };
}
