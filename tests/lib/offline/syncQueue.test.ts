/**
 * Tests for lib/offline/syncQueue.ts
 *
 * CRITICAL: Testing sync logic with mocked dependencies
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  syncPendingCheckIns,
  forceSyncCheckIns,
  hasPendingCheckIns,
  type SyncResult,
} from "@/lib/offline/syncQueue";
import type { CheckInQueueItem } from "@/lib/offline/indexedDB";

// Mock IndexedDB functions
vi.mock("@/lib/offline/indexedDB", () => ({
  getPendingCheckIns: vi.fn(),
  markCheckInAsSynced: vi.fn(),
  clearSyncedCheckIns: vi.fn(),
}));

// Import mocked functions
import {
  getPendingCheckIns,
  markCheckInAsSynced,
  clearSyncedCheckIns,
} from "@/lib/offline/indexedDB";

describe("syncQueue", () => {
  const mockCheckIn: CheckInQueueItem = {
    id: "check-in-1",
    clientId: "client-1",
    invitationId: "invitation-1",
    tokenId: "token-1",
    guestsCount: 2,
    deviceId: "device-1",
    timestamp: Date.now(),
    synced: false,
  };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock console methods to avoid noise
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Mock global fetch
    global.fetch = vi.fn();

    // Mock Notification API
    global.Notification = vi.fn() as any;
    (global.Notification as any).permission = "granted";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("syncPendingCheckIns", () => {
    it("should return empty result if no pending check-ins", async () => {
      vi.mocked(getPendingCheckIns).mockResolvedValue([]);

      const result = await syncPendingCheckIns();

      expect(result).toEqual({
        total: 0,
        synced: 0,
        failed: 0,
        conflicts: [],
      });
      expect(clearSyncedCheckIns).not.toHaveBeenCalled();
    });

    it("should sync all pending check-ins successfully", async () => {
      const pending: CheckInQueueItem[] = [
        mockCheckIn,
        { ...mockCheckIn, id: "check-in-2" },
      ];

      vi.mocked(getPendingCheckIns).mockResolvedValue(pending);
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);
      vi.mocked(markCheckInAsSynced).mockResolvedValue();
      vi.mocked(clearSyncedCheckIns).mockResolvedValue();

      const result = await syncPendingCheckIns();

      expect(result).toEqual({
        total: 2,
        synced: 2,
        failed: 0,
        conflicts: [],
      });
      expect(markCheckInAsSynced).toHaveBeenCalledTimes(2);
      expect(clearSyncedCheckIns).toHaveBeenCalledTimes(1);
    });

    it("should send correct payload to API", async () => {
      vi.mocked(getPendingCheckIns).mockResolvedValue([mockCheckIn]);
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);
      vi.mocked(markCheckInAsSynced).mockResolvedValue();
      vi.mocked(clearSyncedCheckIns).mockResolvedValue();

      await syncPendingCheckIns();

      expect(fetch).toHaveBeenCalledWith("/api/check-in/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: mockCheckIn.clientId,
          invitationId: mockCheckIn.invitationId,
          guestsCount: mockCheckIn.guestsCount,
          deviceId: mockCheckIn.deviceId,
          timestamp: mockCheckIn.timestamp,
        }),
      });
    });

    it("should handle conflicts with warning", async () => {
      vi.mocked(getPendingCheckIns).mockResolvedValue([mockCheckIn]);
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          warning: "Capacidad casi excedida",
        }),
      } as Response);
      vi.mocked(markCheckInAsSynced).mockResolvedValue();
      vi.mocked(clearSyncedCheckIns).mockResolvedValue();

      const result = await syncPendingCheckIns();

      expect(result.synced).toBe(1);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0]).toEqual({
        checkInId: mockCheckIn.id,
        invitationId: mockCheckIn.invitationId,
        reason: "Capacidad casi excedida",
      });
    });

    it("should handle conflicts with exceededCapacity flag", async () => {
      vi.mocked(getPendingCheckIns).mockResolvedValue([mockCheckIn]);
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          exceededCapacity: true,
        }),
      } as Response);
      vi.mocked(markCheckInAsSynced).mockResolvedValue();
      vi.mocked(clearSyncedCheckIns).mockResolvedValue();

      const result = await syncPendingCheckIns();

      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].reason).toBe("Capacidad excedida");
    });

    it("should count failed sync attempts", async () => {
      vi.mocked(getPendingCheckIns).mockResolvedValue([mockCheckIn]);
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      const result = await syncPendingCheckIns();

      expect(result).toEqual({
        total: 1,
        synced: 0,
        failed: 1,
        conflicts: [],
      });
      expect(markCheckInAsSynced).not.toHaveBeenCalled();
    });

    it("should continue syncing after individual failures", async () => {
      const pending: CheckInQueueItem[] = [
        mockCheckIn,
        { ...mockCheckIn, id: "check-in-2" },
        { ...mockCheckIn, id: "check-in-3" },
      ];

      vi.mocked(getPendingCheckIns).mockResolvedValue(pending);

      // First fails, second succeeds, third succeeds
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        } as Response);

      vi.mocked(markCheckInAsSynced).mockResolvedValue();
      vi.mocked(clearSyncedCheckIns).mockResolvedValue();

      const result = await syncPendingCheckIns();

      expect(result).toEqual({
        total: 3,
        synced: 2,
        failed: 1,
        conflicts: [],
      });
    });

    it("should not clear synced check-ins if none synced", async () => {
      vi.mocked(getPendingCheckIns).mockResolvedValue([mockCheckIn]);
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      await syncPendingCheckIns();

      expect(clearSyncedCheckIns).not.toHaveBeenCalled();
    });

    it("should show notification if conflicts exist and permission granted", async () => {
      vi.mocked(getPendingCheckIns).mockResolvedValue([mockCheckIn]);
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          warning: "Conflict",
        }),
      } as Response);
      vi.mocked(markCheckInAsSynced).mockResolvedValue();
      vi.mocked(clearSyncedCheckIns).mockResolvedValue();

      await syncPendingCheckIns();

      expect(global.Notification).toHaveBeenCalledWith(
        "⚠️ Conflictos en check-in",
        {
          body: "1 check-ins excedieron capacidad",
          icon: "/favicon.ico",
        },
      );
    });

    it("should not show notification if permission denied", async () => {
      (global.Notification as any).permission = "denied";

      vi.mocked(getPendingCheckIns).mockResolvedValue([mockCheckIn]);
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          warning: "Conflict",
        }),
      } as Response);
      vi.mocked(markCheckInAsSynced).mockResolvedValue();
      vi.mocked(clearSyncedCheckIns).mockResolvedValue();

      await syncPendingCheckIns();

      expect(global.Notification).not.toHaveBeenCalled();
    });

    it("should throw error if getPendingCheckIns fails", async () => {
      vi.mocked(getPendingCheckIns).mockRejectedValue(
        new Error("IndexedDB error"),
      );

      await expect(syncPendingCheckIns()).rejects.toThrow("IndexedDB error");
    });
  });

  describe("forceSyncCheckIns", () => {
    it("should throw error if offline", async () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: false,
      });

      await expect(forceSyncCheckIns()).rejects.toThrow(
        "Sin conexión a internet",
      );

      // Restore
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: true,
      });
    });

    it("should call syncPendingCheckIns if online", async () => {
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: true,
      });

      vi.mocked(getPendingCheckIns).mockResolvedValue([]);

      const result = await forceSyncCheckIns();

      expect(result).toEqual({
        total: 0,
        synced: 0,
        failed: 0,
        conflicts: [],
      });
    });
  });

  describe("hasPendingCheckIns", () => {
    it("should return true if pending check-ins exist", async () => {
      vi.mocked(getPendingCheckIns).mockResolvedValue([mockCheckIn]);

      const result = await hasPendingCheckIns();

      expect(result).toBe(true);
    });

    it("should return false if no pending check-ins", async () => {
      vi.mocked(getPendingCheckIns).mockResolvedValue([]);

      const result = await hasPendingCheckIns();

      expect(result).toBe(false);
    });
  });
});
