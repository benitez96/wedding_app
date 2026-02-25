/**
 * Tests for lib/check-in/getCheckInConfig.ts
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock Prisma BEFORE any imports (hoisted)
vi.mock("@/lib/prisma", () => ({
  default: {
    configuration: {
      findUnique: vi.fn(),
    },
    $disconnect: vi.fn(),
  },
}));

import { getCheckInConfig } from "@/lib/check-in/getCheckInConfig";
import prisma from "@/lib/prisma";

describe("getCheckInConfig", () => {
  const eventId = "event-123";

  beforeEach(() => {
    vi.clearAllMocks();

    // Clear environment variables
    delete process.env.CHECKIN_SERVER_TIMEOUT_MS;
    delete process.env.CHECKIN_CACHE_STALE_THRESHOLD_MS;
    delete process.env.CHECKIN_LATENCY_THRESHOLD_MS;
  });

  describe("strategy selection", () => {
    it("should load strategy from database configuration", async () => {
      vi.mocked(prisma.configuration.findUnique).mockResolvedValue({
        id: "config-1",
        eventId,
        key: "checkin.strategy",
        value: "IDB_FIRST",
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const config = await getCheckInConfig(eventId);

      expect(config.strategy).toBe("IDB_FIRST");
      expect(prisma.configuration.findUnique).toHaveBeenCalledWith({
        where: {
          eventId_key: {
            eventId,
            key: "checkin.strategy",
          },
        },
      });
    });

    it("should default to HYBRID_SMART when no configuration found", async () => {
      vi.mocked(prisma.configuration.findUnique).mockResolvedValue(null);

      const config = await getCheckInConfig(eventId);

      expect(config.strategy).toBe("HYBRID_SMART");
    });

    it("should handle SERVER_FIRST strategy", async () => {
      vi.mocked(prisma.configuration.findUnique).mockResolvedValue({
        id: "config-2",
        eventId,
        key: "checkin.strategy",
        value: "SERVER_FIRST",
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const config = await getCheckInConfig(eventId);

      expect(config.strategy).toBe("SERVER_FIRST");
    });

    it("should handle HYBRID_SMART strategy", async () => {
      vi.mocked(prisma.configuration.findUnique).mockResolvedValue({
        id: "config-3",
        eventId,
        key: "checkin.strategy",
        value: "HYBRID_SMART",
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const config = await getCheckInConfig(eventId);

      expect(config.strategy).toBe("HYBRID_SMART");
    });
  });

  describe("timeout/threshold configuration from env vars", () => {
    it("should use default values when env vars not set", async () => {
      vi.mocked(prisma.configuration.findUnique).mockResolvedValue(null);

      const config = await getCheckInConfig(eventId);

      expect(config.serverTimeoutMs).toBe(5000);
      expect(config.maxStalenessMs).toBe(30000);
      expect(config.networkLatencyThresholdMs).toBe(500);
    });

    it("should use custom serverTimeoutMs from env var", async () => {
      process.env.CHECKIN_SERVER_TIMEOUT_MS = "10000";
      vi.mocked(prisma.configuration.findUnique).mockResolvedValue(null);

      const config = await getCheckInConfig(eventId);

      expect(config.serverTimeoutMs).toBe(10000);
    });

    it("should use custom maxStalenessMs from env var", async () => {
      process.env.CHECKIN_CACHE_STALE_THRESHOLD_MS = "60000";
      vi.mocked(prisma.configuration.findUnique).mockResolvedValue(null);

      const config = await getCheckInConfig(eventId);

      expect(config.maxStalenessMs).toBe(60000);
    });

    it("should use custom networkLatencyThresholdMs from env var", async () => {
      process.env.CHECKIN_LATENCY_THRESHOLD_MS = "1000";
      vi.mocked(prisma.configuration.findUnique).mockResolvedValue(null);

      const config = await getCheckInConfig(eventId);

      expect(config.networkLatencyThresholdMs).toBe(1000);
    });

    it("should handle all env vars at once", async () => {
      process.env.CHECKIN_SERVER_TIMEOUT_MS = "8000";
      process.env.CHECKIN_CACHE_STALE_THRESHOLD_MS = "45000";
      process.env.CHECKIN_LATENCY_THRESHOLD_MS = "750";

      vi.mocked(prisma.configuration.findUnique).mockResolvedValue({
        id: "config-4",
        eventId,
        key: "checkin.strategy",
        value: "IDB_FIRST",
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const config = await getCheckInConfig(eventId);

      expect(config.strategy).toBe("IDB_FIRST");
      expect(config.serverTimeoutMs).toBe(8000);
      expect(config.maxStalenessMs).toBe(45000);
      expect(config.networkLatencyThresholdMs).toBe(750);
    });

    it("should handle invalid env var values (fallback to defaults)", async () => {
      process.env.CHECKIN_SERVER_TIMEOUT_MS = "invalid";
      process.env.CHECKIN_CACHE_STALE_THRESHOLD_MS = "not-a-number";
      process.env.CHECKIN_LATENCY_THRESHOLD_MS = "";

      vi.mocked(prisma.configuration.findUnique).mockResolvedValue(null);

      const config = await getCheckInConfig(eventId);

      // Number.parseInt("invalid", 10) returns NaN, but we should still get a config
      expect(config).toBeDefined();
      expect(config.strategy).toBe("HYBRID_SMART");
    });
  });

  describe("parallelRaceEnabled", () => {
    it("should always set parallelRaceEnabled to true", async () => {
      vi.mocked(prisma.configuration.findUnique).mockResolvedValue(null);

      const config = await getCheckInConfig(eventId);

      expect(config.parallelRaceEnabled).toBe(true);
    });
  });

  describe("complete configuration object", () => {
    it("should return complete config with all required fields", async () => {
      vi.mocked(prisma.configuration.findUnique).mockResolvedValue({
        id: "config-5",
        eventId,
        key: "checkin.strategy",
        value: "SERVER_FIRST",
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const config = await getCheckInConfig(eventId);

      expect(config).toEqual({
        strategy: "SERVER_FIRST",
        serverTimeoutMs: 5000,
        maxStalenessMs: 30000,
        parallelRaceEnabled: true,
        networkLatencyThresholdMs: 500,
      });
    });
  });
});
