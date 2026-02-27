/**
 * SERVER_FIRST Strategy
 *
 * Optimized for authoritative data when network is reliable.
 * Always attempts server validation/check-in first,
 * falls back to IDB only on network failure.
 *
 * Trade-off: Consistency > Speed
 * Use case: Fast network, low tolerance for duplicate check-ins
 */

import type {
  ICheckInStrategy,
  CheckInAttemptInput,
  CheckInAttemptResult,
  CheckInStrategyConfig,
} from "@/types/check-in-strategy";
import { scanQR } from "@/app/actions/check-in/scanQR";
import {
  getInvitationByToken,
  saveCheckInToQueue,
} from "@/lib/offline/indexedDB";

export class ServerFirstStrategy implements ICheckInStrategy {
  constructor(private config: CheckInStrategyConfig) {}

  getName(): string {
    return "SERVER_FIRST";
  }

  /**
   * Validate QR: Try server first, fallback to IDB on failure
   */
  async validateQR(
    tokenId: string,
    eventId: string,
  ): Promise<CheckInAttemptResult> {
    try {
      // Attempt server validation with timeout
      const result = await Promise.race([
        scanQR({ tokenId, eventId }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Server timeout")),
            this.config.serverTimeoutMs,
          ),
        ),
      ]);

      if (result.success && result.invitation) {
        return {
          success: true,
          source: "SERVER",
          invitation: result.invitation,
        };
      }

      // Server returned error → try IDB fallback
      return this.validateFromIDB(tokenId, result.error || "Error al validar");
    } catch {
      // Network error or timeout → fallback to IDB
      return this.validateFromIDB(tokenId, "Error al validar");
    }
  }

  /**
   * Create check-in: POST to server with timeout, fallback to queue on failure
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
    } catch {
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
    } catch {
      return {
        success: false,
        source: "OFFLINE_QUEUE",
        error: "Error al guardar check-in offline",
      };
    }
  }

  /**
   * Fallback: validate from IDB cache
   */
  private async validateFromIDB(
    tokenId: string,
    serverError?: string,
  ): Promise<CheckInAttemptResult> {
    try {
      const cached = await getInvitationByToken(tokenId);

      if (!cached) {
        return {
          success: false,
          source: "IDB",
          error: serverError || "QR code not found",
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
        warning: "Using cached data (server unavailable)",
      };
    } catch {
      return {
        success: false,
        source: "IDB",
        error: serverError || "Failed to validate QR",
      };
    }
  }
}
