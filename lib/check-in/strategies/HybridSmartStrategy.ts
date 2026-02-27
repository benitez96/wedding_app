/**
 * HYBRID_SMART Strategy
 *
 * Dynamic strategy selection based on real-time network conditions:
 * - Fast network + fresh cache → PARALLEL (Promise.race)
 * - Slow network → IDB
 * - Stale cache + decent network → SERVER
 * - Offline → IDB
 *
 * Trade-off: Adaptive (best of both worlds)
 * Use case: Variable network conditions, production default
 */

import type {
  ICheckInStrategy,
  CheckInAttemptInput,
  CheckInAttemptResult,
  CheckInStrategyConfig,
  StrategyDecisionContext,
  StrategyMode,
} from "@/types/check-in-strategy";
import { IDBFirstStrategy } from "./IDBFirstStrategy";
import { ServerFirstStrategy } from "./ServerFirstStrategy";
import { scanQR } from "@/app/actions/check-in/scanQR";
import { getInvitationByToken } from "@/lib/offline/indexedDB";

export class HybridSmartStrategy implements ICheckInStrategy {
  private idbStrategy: IDBFirstStrategy;
  private serverStrategy: ServerFirstStrategy;

  constructor(private config: CheckInStrategyConfig) {
    this.idbStrategy = new IDBFirstStrategy(config);
    this.serverStrategy = new ServerFirstStrategy(config);
  }

  getName(): string {
    return "HYBRID_SMART";
  }

  /**
   * Validate QR: Decide mode dynamically based on network + staleness
   */
  async validateQR(
    tokenId: string,
    eventId: string,
    context?: StrategyDecisionContext,
  ): Promise<CheckInAttemptResult> {
    if (!context) {
      // No context → default to IDB for safety
      return this.idbStrategy.validateQR(tokenId, eventId);
    }

    const mode = this.decideMode(context);

    switch (mode) {
      case "IDB":
        return this.idbStrategy.validateQR(tokenId, eventId);

      case "SERVER":
        return this.serverStrategy.validateQR(tokenId, eventId);

      case "PARALLEL":
        return this.validateParallel(tokenId, eventId);
    }
  }

  /**
   * Create check-in: Always delegate to IDBFirstStrategy
   * (check-in write operations use same flow regardless of read strategy)
   */
  async createCheckIn(
    input: CheckInAttemptInput,
  ): Promise<CheckInAttemptResult> {
    return this.idbStrategy.createCheckIn(input);
  }

  /**
   * PARALLEL mode: Race IDB vs Server, fastest wins
   */
  private async validateParallel(
    tokenId: string,
    eventId: string,
  ): Promise<CheckInAttemptResult> {
    try {
      // Race: IDB vs Server with timeout
      const result = await Promise.race([
        this.validateIDB(tokenId),
        this.validateServer(tokenId, eventId),
        this.timeoutReject(),
      ]);

      return result;
    } catch {
      // Both failed or timeout → fallback to IDB
      return this.idbStrategy.validateQR(tokenId, eventId);
    }
  }

  private async validateIDB(tokenId: string): Promise<CheckInAttemptResult> {
    const cached = await getInvitationByToken(tokenId);

    if (!cached) {
      throw new Error("Not in cache");
    }

    const remaining = cached.maxGuests - cached.checkInCount;

    return {
      success: true,
      source: "IDB",
      invitation: {
        id: cached.id,
        tokenId: cached.tokenId,
        guestName: cached.guestName,
        guestNickname: cached.guestNickname,
        maxGuests: cached.maxGuests,
        checkInCount: cached.checkInCount,
        remaining,
      },
    };
  }

  private async validateServer(
    tokenId: string,
    eventId: string,
  ): Promise<CheckInAttemptResult> {
    const result = await scanQR({ tokenId, eventId });

    if (!result.success || !result.invitation) {
      throw new Error(result.error || "Server validation failed");
    }

    return {
      success: true,
      source: "SERVER",
      invitation: result.invitation,
    };
  }

  private timeoutReject(): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Parallel race timeout")),
        this.config.serverTimeoutMs,
      ),
    );
  }

  /**
   * Decision tree: Which mode to use?
   */
  private decideMode(context: StrategyDecisionContext): StrategyMode {
    const { networkMetrics, cacheStaleness, config } = context;

    // Offline → IDB always
    if (!networkMetrics.isOnline) {
      return "IDB";
    }

    // Very slow network (>2s) → IDB
    if (networkMetrics.latencyMs > 2000) {
      return "IDB";
    }

    // Stale cache + decent network → SERVER preferred
    if (
      cacheStaleness.isStale &&
      networkMetrics.latencyMs < config.networkLatencyThresholdMs
    ) {
      return "SERVER";
    }

    // Fast network + fresh cache + parallel enabled → PARALLEL
    if (
      config.parallelRaceEnabled &&
      networkMetrics.latencyMs < 300 &&
      !cacheStaleness.isStale
    ) {
      return "PARALLEL";
    }

    // Default: IDB (fast UX)
    return "IDB";
  }
}
