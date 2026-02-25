/**
 * Tests for check-in strategies
 *
 * CRITICAL: Testing all 3 strategies (IDB_FIRST, SERVER_FIRST, HYBRID_SMART)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { IDBFirstStrategy } from "@/lib/check-in/strategies/IDBFirstStrategy";
import { ServerFirstStrategy } from "@/lib/check-in/strategies/ServerFirstStrategy";
import { HybridSmartStrategy } from "@/lib/check-in/strategies/HybridSmartStrategy";
import type {
  CheckInStrategyConfig,
  NetworkMetrics,
  CacheStaleness,
} from "@/types/check-in-strategy";
import type { InvitationCache } from "@/lib/offline/indexedDB";

// Mock IndexedDB functions
vi.mock("@/lib/offline/indexedDB", () => ({
  getInvitationByToken: vi.fn(),
  saveCheckInToQueue: vi.fn(),
}));

// Mock scanQR action
vi.mock("@/app/actions/check-in/scanQR", () => ({
  scanQR: vi.fn(),
}));

import {
  getInvitationByToken,
  saveCheckInToQueue,
} from "@/lib/offline/indexedDB";
import { scanQR } from "@/app/actions/check-in/scanQR";

describe("Check-In Strategies", () => {
  const mockConfig: CheckInStrategyConfig = {
    strategy: "IDB_FIRST",
    serverTimeoutMs: 5000,
    maxStalenessMs: 30000,
    parallelRaceEnabled: true,
    networkLatencyThresholdMs: 500,
  };

  const mockInvitationCache: InvitationCache = {
    id: "invitation-1",
    tokenId: "token-123",
    guestName: "Juan Pérez",
    guestNickname: "Juancho",
    maxGuests: 4,
    checkInCount: 1,
    lastSyncedAt: Date.now(),
  };

  const mockServerResponse = {
    success: true,
    invitation: {
      id: "invitation-1",
      tokenId: "token-123",
      guestName: "Juan Pérez",
      guestNickname: "Juancho",
      maxGuests: 4,
      checkInCount: 2, // Updated on server
      remaining: 2, // maxGuests - checkInCount
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    global.navigator = { onLine: true } as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("IDBFirstStrategy", () => {
    let strategy: IDBFirstStrategy;

    beforeEach(() => {
      strategy = new IDBFirstStrategy(mockConfig);
    });

    it("should have correct name", () => {
      expect(strategy.getName()).toBe("IDB_FIRST");
    });

    describe("validateQR", () => {
      it("should return cached data if available (cache hit)", async () => {
        vi.mocked(getInvitationByToken).mockResolvedValue(mockInvitationCache);

        const result = await strategy.validateQR("token-123", "event-1");

        expect(result.success).toBe(true);
        expect(result.source).toBe("IDB");
        expect(result.invitation?.guestName).toBe("Juan Pérez");
        expect(result.invitation?.checkInCount).toBe(1);
        expect(getInvitationByToken).toHaveBeenCalledWith("token-123");
      });

      it("should fallback to server if cache miss", async () => {
        vi.mocked(getInvitationByToken).mockResolvedValue(undefined);
        vi.mocked(scanQR).mockResolvedValue(mockServerResponse);

        const result = await strategy.validateQR("token-123", "event-1");

        expect(result.success).toBe(true);
        expect(result.source).toBe("SERVER");
        expect(result.invitation?.checkInCount).toBe(2);
        expect(scanQR).toHaveBeenCalledWith({
          tokenId: "token-123",
          eventId: "event-1",
        });
      });

      it("should return error if both cache and server fail", async () => {
        vi.mocked(getInvitationByToken).mockResolvedValue(undefined);
        vi.mocked(scanQR).mockResolvedValue({
          success: false,
          error: "Token inválido",
        });

        const result = await strategy.validateQR("token-invalid", "event-1");

        expect(result.success).toBe(false);
        expect(result.error).toBe("Token inválido");
      });

      it("should handle IDB errors gracefully", async () => {
        vi.mocked(getInvitationByToken).mockRejectedValue(
          new Error("IDB error"),
        );
        vi.mocked(scanQR).mockResolvedValue(mockServerResponse);

        const result = await strategy.validateQR("token-123", "event-1");

        // Should fallback to server
        expect(result.success).toBe(true);
        expect(result.source).toBe("SERVER");
      });
    });

    describe("createCheckIn - offline mode", () => {
      beforeEach(() => {
        Object.defineProperty(navigator, "onLine", {
          writable: true,
          value: false,
        });
      });

      afterEach(() => {
        Object.defineProperty(navigator, "onLine", {
          writable: true,
          value: true,
        });
      });

      it("should queue check-in when offline", async () => {
        vi.mocked(saveCheckInToQueue).mockResolvedValue({
          id: "queue-1",
          clientId: "client-123",
          invitationId: "invitation-1",
          tokenId: "token-123",
          guestsCount: 2,
          deviceId: "device-1",
          timestamp: Date.now(),
          synced: false,
        });

        const result = await strategy.createCheckIn({
          invitationId: "invitation-1",
          tokenId: "token-123",
          guestsCount: 2,
        });

        expect(result.success).toBe(true);
        expect(result.source).toBe("OFFLINE_QUEUE");
        expect(result.queued).toBe(true);
        expect(saveCheckInToQueue).toHaveBeenCalledWith({
          invitationId: "invitation-1",
          tokenId: "token-123",
          guestsCount: 2,
          timestamp: expect.any(Number),
        });
      });

      it("should return error if queue fails", async () => {
        vi.mocked(saveCheckInToQueue).mockRejectedValue(new Error("IDB full"));

        const result = await strategy.createCheckIn({
          invitationId: "invitation-1",
          tokenId: "token-123",
          guestsCount: 2,
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("Error al guardar check-in offline");
      });
    });

    describe("createCheckIn - online mode", () => {
      it("should POST to server when online", async () => {
        vi.mocked(fetch).mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            checkIn: { id: "checkin-1", guestsCount: 2 },
          }),
        } as Response);

        const result = await strategy.createCheckIn({
          invitationId: "invitation-1",
          tokenId: "token-123",
          guestsCount: 2,
        });

        expect(result.success).toBe(true);
        expect(result.source).toBe("SERVER");

        // Verify fetch was called with correct params (including timeout signal)
        expect(fetch).toHaveBeenCalledWith(
          "/api/check-in",
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: expect.stringContaining("invitation-1"),
            signal: expect.any(AbortSignal),
          }),
        );
      });

      it("should queue if server request fails", async () => {
        vi.mocked(fetch).mockResolvedValue({
          ok: false,
          status: 500,
        } as Response);

        vi.mocked(saveCheckInToQueue).mockResolvedValue({
          id: "queue-1",
          clientId: "client-123",
          invitationId: "invitation-1",
          tokenId: "token-123",
          guestsCount: 2,
          deviceId: "device-1",
          timestamp: Date.now(),
          synced: false,
        });

        const result = await strategy.createCheckIn({
          invitationId: "invitation-1",
          tokenId: "token-123",
          guestsCount: 2,
        });

        expect(result.success).toBe(true);
        expect(result.source).toBe("OFFLINE_QUEUE");
        expect(result.queued).toBe(true);
      });

      it("should handle server timeout gracefully", async () => {
        // Mock a fetch that rejects with an AbortError (simulating timeout)
        vi.mocked(fetch).mockRejectedValue(
          new DOMException("The operation was aborted", "AbortError"),
        );

        vi.mocked(saveCheckInToQueue).mockResolvedValue({
          id: "queue-1",
          clientId: "client-123",
          invitationId: "invitation-1",
          tokenId: "token-123",
          guestsCount: 2,
          deviceId: "device-1",
          timestamp: Date.now(),
          synced: false,
        });

        const result = await strategy.createCheckIn({
          invitationId: "invitation-1",
          tokenId: "token-123",
          guestsCount: 2,
        });

        // AbortSignal.timeout should abort the fetch after config.serverTimeoutMs (5000ms)
        // Then strategy should fallback to queue
        expect(result.success).toBe(true);
        expect(result.source).toBe("OFFLINE_QUEUE");
        expect(saveCheckInToQueue).toHaveBeenCalled();
      }, 15000); // 15 second timeout for this test
    });
  });

  describe("ServerFirstStrategy", () => {
    let strategy: ServerFirstStrategy;

    beforeEach(() => {
      strategy = new ServerFirstStrategy(mockConfig);
    });

    it("should have correct name", () => {
      expect(strategy.getName()).toBe("SERVER_FIRST");
    });

    describe("validateQR", () => {
      it("should always try server first when online", async () => {
        vi.mocked(scanQR).mockResolvedValue(mockServerResponse);

        const result = await strategy.validateQR("token-123", "event-1");

        expect(result.success).toBe(true);
        expect(result.source).toBe("SERVER");
        expect(scanQR).toHaveBeenCalledWith({
          tokenId: "token-123",
          eventId: "event-1",
        });
        // Should NOT check IDB first
        expect(getInvitationByToken).not.toHaveBeenCalled();
      });

      it("should fallback to cache if server fails", async () => {
        vi.mocked(scanQR).mockRejectedValue(new Error("Network error"));
        vi.mocked(getInvitationByToken).mockResolvedValue(mockInvitationCache);

        const result = await strategy.validateQR("token-123", "event-1");

        expect(result.success).toBe(true);
        expect(result.source).toBe("IDB");
        expect(result.invitation?.checkInCount).toBe(1);
      });

      it("should return error if both server and cache fail", async () => {
        vi.mocked(scanQR).mockRejectedValue(new Error("Network error"));
        vi.mocked(getInvitationByToken).mockResolvedValue(undefined);

        const result = await strategy.validateQR("token-123", "event-1");

        expect(result.success).toBe(false);
        expect(result.error).toContain("Error al validar");
      });
    });

    describe("createCheckIn", () => {
      it("should always POST to server when online", async () => {
        vi.mocked(fetch).mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            checkIn: { id: "checkin-1", guestsCount: 2 },
          }),
        } as Response);

        const result = await strategy.createCheckIn({
          invitationId: "invitation-1",
          tokenId: "token-123",
          guestsCount: 2,
        });

        expect(result.success).toBe(true);
        expect(result.source).toBe("SERVER");
        expect(fetch).toHaveBeenCalled();
      });

      it("should queue if offline", async () => {
        Object.defineProperty(navigator, "onLine", {
          writable: true,
          value: false,
        });

        vi.mocked(saveCheckInToQueue).mockResolvedValue({
          id: "queue-1",
          clientId: "client-123",
          invitationId: "invitation-1",
          tokenId: "token-123",
          guestsCount: 2,
          deviceId: "device-1",
          timestamp: Date.now(),
          synced: false,
        });

        const result = await strategy.createCheckIn({
          invitationId: "invitation-1",
          tokenId: "token-123",
          guestsCount: 2,
        });

        expect(result.success).toBe(true);
        expect(result.source).toBe("OFFLINE_QUEUE");
        expect(result.queued).toBe(true);

        // Restore
        Object.defineProperty(navigator, "onLine", {
          writable: true,
          value: true,
        });
      });
    });
  });

  describe("HybridSmartStrategy", () => {
    let strategy: HybridSmartStrategy;

    beforeEach(() => {
      strategy = new HybridSmartStrategy(mockConfig);
    });

    it("should have correct name", () => {
      expect(strategy.getName()).toBe("HYBRID_SMART");
    });

    describe("strategy decision logic", () => {
      it("should use IDB when offline", async () => {
        const context = {
          networkMetrics: {
            isOnline: false,
            latencyMs: 0,
            lastMeasuredAt: Date.now(),
          },
          cacheStaleness: {
            lastSyncedAt: Date.now(),
            stalenessMs: 1000,
            isStale: false,
          },
          config: mockConfig,
        };

        vi.mocked(getInvitationByToken).mockResolvedValue(mockInvitationCache);

        const result = await strategy.validateQR(
          "token-123",
          "event-1",
          context,
        );

        expect(result.source).toBe("IDB");
        expect(getInvitationByToken).toHaveBeenCalled();
      });

      it("should use SERVER when cache is stale", async () => {
        const context = {
          networkMetrics: {
            isOnline: true,
            latencyMs: 100,
            lastMeasuredAt: Date.now(),
          },
          cacheStaleness: {
            lastSyncedAt: Date.now() - 60000,
            stalenessMs: 60000,
            isStale: true, // Cache is stale!
          },
          config: mockConfig,
        };

        vi.mocked(scanQR).mockResolvedValue(mockServerResponse);

        const result = await strategy.validateQR(
          "token-123",
          "event-1",
          context,
        );

        expect(result.source).toBe("SERVER");
        expect(scanQR).toHaveBeenCalled();
      });

      it("should use PARALLEL when latency is low and cache is fresh", async () => {
        const context = {
          networkMetrics: {
            isOnline: true,
            latencyMs: 50, // Very fast network
            lastMeasuredAt: Date.now(),
          },
          cacheStaleness: {
            lastSyncedAt: Date.now(),
            stalenessMs: 1000,
            isStale: false,
          },
          config: mockConfig,
        };

        // Mock both IDB and server (race will pick whichever resolves first)
        vi.mocked(getInvitationByToken).mockResolvedValue(mockInvitationCache);
        vi.mocked(scanQR).mockResolvedValue(mockServerResponse);

        const result = await strategy.validateQR(
          "token-123",
          "event-1",
          context,
        );

        // PARALLEL mode - either source is valid
        expect(result.success).toBe(true);
        expect(["IDB", "SERVER"]).toContain(result.source);
      });

      it("should use IDB when latency is high and cache is fresh", async () => {
        const context = {
          networkMetrics: {
            isOnline: true,
            latencyMs: 800, // Slow network
            lastMeasuredAt: Date.now(),
          },
          cacheStaleness: {
            lastSyncedAt: Date.now(),
            stalenessMs: 1000,
            isStale: false, // Cache is fresh
          },
          config: mockConfig,
        };

        vi.mocked(getInvitationByToken).mockResolvedValue(mockInvitationCache);

        const result = await strategy.validateQR(
          "token-123",
          "event-1",
          context,
        );

        expect(result.source).toBe("IDB");
      });

      it("should default to IDB when no context provided", async () => {
        vi.mocked(getInvitationByToken).mockResolvedValue(mockInvitationCache);

        const result = await strategy.validateQR("token-123", "event-1");

        expect(result.source).toBe("IDB");
      });
    });

    describe("createCheckIn", () => {
      it("should always delegate to IDB strategy (writes are uniform)", async () => {
        vi.mocked(fetch).mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            checkIn: { id: "checkin-1", guestsCount: 2 },
          }),
        } as Response);

        const result = await strategy.createCheckIn({
          invitationId: "invitation-1",
          tokenId: "token-123",
          guestsCount: 2,
        });

        expect(result.success).toBe(true);
        expect(fetch).toHaveBeenCalled();
      });
    });
  });
});
