/**
 * IDB_FIRST Strategy
 *
 * Optimized for fast UX in slow/unstable networks.
 * Always reads from IndexedDB cache first for instant response,
 * then attempts server sync in parallel (fire-and-forget).
 *
 * Trade-off: Speed > Consistency
 * Use case: Events with slow 3G/Edge network, multiple staff members
 */

import type {
  ICheckInStrategy,
  CheckInAttemptInput,
  CheckInAttemptResult,
  CheckInStrategyConfig,
} from "@/types/check-in-strategy";
import { getInvitationByToken } from "@/lib/offline/indexedDB";

export class IDBFirstStrategy implements ICheckInStrategy {
  constructor(private config: CheckInStrategyConfig) {}

  getName(): string {
    return "IDB_FIRST";
  }

  /**
   * Validate QR: Always return cached data for instant UX
   */
  async validateQR(
    tokenId: string,
    eventId: string,
  ): Promise<CheckInAttemptResult> {
    try {
      const cached = await getInvitationByToken(tokenId);

      if (!cached) {
        return {
          success: false,
          source: "IDB",
          error: "QR code not found in local cache",
        };
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
    } catch (error) {
      return {
        success: false,
        source: "IDB",
        error: "Failed to read from local cache",
      };
    }
  }

  /**
   * Create check-in: Always use client-side POST (SW intercepts if offline)
   */
  async createCheckIn(
    input: CheckInAttemptInput,
  ): Promise<CheckInAttemptResult> {
    try {
      const response = await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitationId: input.invitationId,
          tokenId: input.tokenId,
          guestsCount: input.guestsCount,
        }),
        signal: AbortSignal.timeout(this.config.serverTimeoutMs),
      });

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          source: result.queued ? "OFFLINE_QUEUE" : "SERVER",
          queued: result.queued,
          warning: result.warning,
          exceededCapacity: result.exceededCapacity,
        };
      }

      return {
        success: false,
        source: "SERVER",
        error: result.error || "Check-in failed",
      };
    } catch (error) {
      // Timeout or network error
      // SW should have intercepted and queued, but if not, surface error
      return {
        success: false,
        source: "SERVER",
        error:
          error instanceof Error && error.name === "TimeoutError"
            ? "Server timeout - check-in may be queued"
            : "Network error during check-in",
      };
    }
  }
}
