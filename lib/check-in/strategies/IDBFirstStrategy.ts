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
import {
  getInvitationByToken,
  saveCheckInToQueue,
} from "@/lib/offline/indexedDB";
import { scanQR } from "@/app/actions/check-in/scanQR";

export class IDBFirstStrategy implements ICheckInStrategy {
  constructor(private config: CheckInStrategyConfig) {}

  getName(): string {
    return "IDB_FIRST";
  }

  /**
   * Validate QR: Check cache first, fallback to server if not found
   */
  async validateQR(
    tokenId: string,
    eventId: string,
  ): Promise<CheckInAttemptResult> {
    try {
      const cached = await getInvitationByToken(tokenId);

      if (cached) {
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

      // Cache miss → fallback to server
      const serverResult = await scanQR({ tokenId, eventId });

      if (!serverResult.success) {
        return {
          success: false,
          source: "SERVER",
          error: serverResult.error || "Token inválido",
        };
      }

      return {
        success: true,
        source: "SERVER",
        invitation: serverResult.invitation,
      };
    } catch (error) {
      // IDB error → try server as last resort
      try {
        const serverResult = await scanQR({ tokenId, eventId });

        if (!serverResult.success) {
          return {
            success: false,
            source: "SERVER",
            error: serverResult.error || "Token inválido",
          };
        }

        return {
          success: true,
          source: "SERVER",
          invitation: serverResult.invitation,
        };
      } catch {
        return {
          success: false,
          source: "IDB",
          error: "Error al validar código QR",
        };
      }
    }
  }

  /**
   * Create check-in: Try server first, fallback to offline queue
   */
  async createCheckIn(
    input: CheckInAttemptInput,
  ): Promise<CheckInAttemptResult> {
    // If offline, queue immediately
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return this.queueCheckIn(input);
    }

    // Try server
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

      // Server returned error → fallback to queue
      return this.queueCheckIn(input);
    } catch (error) {
      // Network error or timeout → fallback to queue
      return this.queueCheckIn(input);
    }
  }

  /**
   * Queue check-in for later sync
   */
  private async queueCheckIn(
    input: CheckInAttemptInput,
  ): Promise<CheckInAttemptResult> {
    try {
      await saveCheckInToQueue({
        invitationId: input.invitationId,
        tokenId: input.tokenId,
        guestsCount: input.guestsCount,
        timestamp: Date.now(),
      });

      return {
        success: true,
        source: "OFFLINE_QUEUE",
        queued: true,
      };
    } catch (error) {
      return {
        success: false,
        source: "OFFLINE_QUEUE",
        error: "Error al guardar check-in offline",
      };
    }
  }
}
