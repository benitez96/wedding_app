/**
 * Tests for lib/check-in/NetworkMonitor.ts
 *
 * CRITICAL: Testing network latency tracking and cache staleness detection
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { NetworkMonitor } from "@/lib/check-in/NetworkMonitor";
import type { CheckInStrategyConfig } from "@/types/check-in-strategy";

describe("NetworkMonitor", () => {
  let monitor: NetworkMonitor;
  const mockConfig: CheckInStrategyConfig = {
    strategy: "IDB_FIRST",
    serverTimeoutMs: 5000,
    maxStalenessMs: 30000, // 30 seconds
    parallelRaceEnabled: true,
    networkLatencyThresholdMs: 500,
  };

  beforeEach(() => {
    vi.useFakeTimers();
    global.fetch = vi.fn();

    // Mock window object for client-side code
    global.window = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as any;

    global.navigator = {
      onLine: true,
    } as any;

    global.performance = {
      now: vi.fn(() => Date.now()),
    } as any;
  });

  afterEach(() => {
    monitor?.stop();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("initialization", () => {
    it("should initialize with config", () => {
      monitor = new NetworkMonitor(mockConfig);

      expect(monitor).toBeDefined();
      expect(monitor.getNetworkMetrics().isOnline).toBe(true);
    });

    it("should start measuring latency when start() is called", () => {
      monitor = new NetworkMonitor(mockConfig);

      vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);

      monitor.start();

      // Should have set up interval and event listeners
      expect(window.addEventListener).toHaveBeenCalledWith(
        "online",
        expect.any(Function),
      );
      expect(window.addEventListener).toHaveBeenCalledWith(
        "offline",
        expect.any(Function),
      );
    });
  });

  describe("measureNow", () => {
    it("should measure latency via HEAD /api/health", async () => {
      monitor = new NetworkMonitor(mockConfig);

      vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);

      await monitor.measureNow();

      expect(fetch).toHaveBeenCalledWith("/api/health", {
        method: "HEAD",
        cache: "no-store",
      });
    });

    it("should update latency metrics after successful measurement", async () => {
      monitor = new NetworkMonitor(mockConfig);

      const performanceNowSpy = vi.spyOn(performance, "now");
      performanceNowSpy.mockReturnValueOnce(1000); // Start
      performanceNowSpy.mockReturnValueOnce(1050); // End (50ms later)

      vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);

      const metrics = await monitor.measureNow();

      expect(metrics.latencyMs).toBe(50);
      expect(metrics.isOnline).toBe(true);
      expect(metrics.lastMeasuredAt).toBeGreaterThan(0);
    });

    it("should use rolling average of last 3 measurements", async () => {
      monitor = new NetworkMonitor(mockConfig);
      const performanceNowSpy = vi.spyOn(performance, "now");
      vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);

      // First measurement: 100ms (avg of [100] = 100)
      performanceNowSpy.mockReturnValueOnce(0).mockReturnValueOnce(100);
      let metrics = await monitor.measureNow();
      expect(metrics.latencyMs).toBe(100);

      // Second measurement: 50ms (avg of [100, 50] = 75)
      performanceNowSpy.mockReturnValueOnce(0).mockReturnValueOnce(50);
      metrics = await monitor.measureNow();
      expect(metrics.latencyMs).toBe(75);

      // Third measurement: 200ms (avg of [100, 50, 200] = 116.67 → 117)
      performanceNowSpy.mockReturnValueOnce(0).mockReturnValueOnce(200);
      metrics = await monitor.measureNow();
      expect(metrics.latencyMs).toBe(117);

      // Fourth measurement: 300ms (window shifts: [50, 200, 300] = 183.33 → 183)
      performanceNowSpy.mockReturnValueOnce(0).mockReturnValueOnce(300);
      metrics = await monitor.measureNow();
      expect(metrics.latencyMs).toBe(183);
    });

    it("should mark as offline on fetch failure", async () => {
      monitor = new NetworkMonitor(mockConfig);

      vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

      const metrics = await monitor.measureNow();

      expect(metrics.isOnline).toBe(false);
    });

    it("should skip measurement if navigator.onLine is false", async () => {
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: false,
      });

      monitor = new NetworkMonitor(mockConfig);

      await monitor.measureNow();

      expect(fetch).not.toHaveBeenCalled();
      expect(monitor.getNetworkMetrics().isOnline).toBe(false);

      // Restore
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: true,
      });
    });
  });

  describe("cache staleness", () => {
    it("should mark cache as fresh after markCacheSynced", () => {
      monitor = new NetworkMonitor(mockConfig);

      monitor.markCacheSynced();

      const staleness = monitor.getCacheStaleness();
      expect(staleness.isStale).toBe(false);
      expect(staleness.stalenessMs).toBe(0);
    });

    it("should detect stale cache after threshold", () => {
      monitor = new NetworkMonitor(mockConfig);

      monitor.markCacheSynced();

      // Advance time past staleness threshold (30s)
      vi.advanceTimersByTime(31000);

      const staleness = monitor.getCacheStaleness();
      expect(staleness.isStale).toBe(true);
      expect(staleness.stalenessMs).toBeGreaterThan(30000);
    });

    it("should keep cache fresh within threshold", () => {
      monitor = new NetworkMonitor(mockConfig);

      monitor.markCacheSynced();

      // Advance time within threshold (15s)
      vi.advanceTimersByTime(15000);

      const staleness = monitor.getCacheStaleness();
      expect(staleness.isStale).toBe(false);
      expect(staleness.stalenessMs).toBeLessThan(30000);
    });

    it("should calculate stalenessMs correctly", () => {
      monitor = new NetworkMonitor(mockConfig);

      const startTime = Date.now();
      monitor.markCacheSynced();

      vi.advanceTimersByTime(10000); // 10 seconds

      const staleness = monitor.getCacheStaleness();
      expect(staleness.stalenessMs).toBeGreaterThanOrEqual(10000);
      expect(staleness.lastSyncedAt).toBeGreaterThanOrEqual(startTime);
    });
  });

  describe("getNetworkMetrics", () => {
    it("should return immutable copy of metrics", () => {
      monitor = new NetworkMonitor(mockConfig);

      const metrics1 = monitor.getNetworkMetrics();
      const metrics2 = monitor.getNetworkMetrics();

      expect(metrics1).not.toBe(metrics2); // Different objects
      expect(metrics1).toEqual(metrics2); // Same values
    });
  });

  describe("online/offline event handlers", () => {
    it("should update isOnline on offline event", () => {
      monitor = new NetworkMonitor(mockConfig);
      monitor.start();

      // Get the offline handler
      const offlineHandler = vi
        .mocked(window.addEventListener)
        .mock.calls.find((call) => call[0] === "offline")?.[1] as () => void;

      expect(offlineHandler).toBeDefined();

      // Trigger offline
      offlineHandler();

      expect(monitor.getNetworkMetrics().isOnline).toBe(false);
    });

    it("should measure latency on online event", async () => {
      monitor = new NetworkMonitor(mockConfig);
      monitor.start();

      const performanceNowSpy = vi.spyOn(performance, "now");
      performanceNowSpy.mockReturnValueOnce(0).mockReturnValueOnce(50);
      vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);

      // Get the online handler
      const onlineHandler = vi
        .mocked(window.addEventListener)
        .mock.calls.find((call) => call[0] === "online")?.[1] as () => void;

      expect(onlineHandler).toBeDefined();

      // Trigger online event (fire-and-forget async call inside)
      onlineHandler();

      // Wait for the async measureLatency to complete using waitFor
      await vi.waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      expect(monitor.getNetworkMetrics().isOnline).toBe(true);
    });
  });

  describe("stop", () => {
    it("should clear interval and remove listeners", () => {
      monitor = new NetworkMonitor(mockConfig);
      monitor.start();

      monitor.stop();

      expect(window.removeEventListener).toHaveBeenCalledWith(
        "online",
        expect.any(Function),
      );
      expect(window.removeEventListener).toHaveBeenCalledWith(
        "offline",
        expect.any(Function),
      );
    });
  });

  describe("realistic scenarios", () => {
    it("should handle network degradation (latency increases over time)", async () => {
      const config: CheckInStrategyConfig = {
        ...mockConfig,
        networkLatencyThresholdMs: 300,
      };
      monitor = new NetworkMonitor(config);

      const performanceNowSpy = vi.spyOn(performance, "now");
      vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);

      // Good network: 50ms (avg [50] = 50)
      performanceNowSpy.mockReturnValueOnce(0).mockReturnValueOnce(50);
      await monitor.measureNow();
      expect(monitor.getNetworkMetrics().latencyMs).toBe(50);

      // Getting worse: 150ms (avg [50, 150] = 100)
      performanceNowSpy.mockReturnValueOnce(0).mockReturnValueOnce(150);
      await monitor.measureNow();
      expect(monitor.getNetworkMetrics().latencyMs).toBe(100);

      // Bad network: 500ms (avg [50, 150, 500] = 233.33 → 233)
      performanceNowSpy.mockReturnValueOnce(0).mockReturnValueOnce(500);
      await monitor.measureNow();
      expect(monitor.getNetworkMetrics().latencyMs).toBe(233);

      // Very bad: 800ms (window shifts: [150, 500, 800] = 483.33 → 483)
      performanceNowSpy.mockReturnValueOnce(0).mockReturnValueOnce(800);
      await monitor.measureNow();
      expect(monitor.getNetworkMetrics().latencyMs).toBe(483);
    });

    it("should handle rapid latency spikes with rolling average", async () => {
      monitor = new NetworkMonitor(mockConfig);
      const performanceNowSpy = vi.spyOn(performance, "now");
      vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);

      // Spike: 1000ms (avg [1000] = 1000)
      performanceNowSpy.mockReturnValueOnce(0).mockReturnValueOnce(1000);
      await monitor.measureNow();
      expect(monitor.getNetworkMetrics().latencyMs).toBe(1000);

      // Back to normal: 50ms (avg [1000, 50] = 525)
      performanceNowSpy.mockReturnValueOnce(0).mockReturnValueOnce(50);
      await monitor.measureNow();
      expect(monitor.getNetworkMetrics().latencyMs).toBe(525);

      // Another 50ms (avg [1000, 50, 50] = 366.67 → 367)
      performanceNowSpy.mockReturnValueOnce(0).mockReturnValueOnce(50);
      await monitor.measureNow();
      expect(monitor.getNetworkMetrics().latencyMs).toBe(367);

      // Fourth 50ms (window shifts: [50, 50, 50] = 50) - spike gone!
      performanceNowSpy.mockReturnValueOnce(0).mockReturnValueOnce(50);
      await monitor.measureNow();
      expect(monitor.getNetworkMetrics().latencyMs).toBe(50);
    });

    it("should detect cache staleness in real-time scenario", () => {
      monitor = new NetworkMonitor(mockConfig);

      // Initial sync
      monitor.markCacheSynced();
      expect(monitor.getCacheStaleness().isStale).toBe(false);

      // 15 seconds later - still fresh
      vi.advanceTimersByTime(15000);
      expect(monitor.getCacheStaleness().isStale).toBe(false);

      // 20 more seconds (35 total) - now stale
      vi.advanceTimersByTime(20000);
      expect(monitor.getCacheStaleness().isStale).toBe(true);

      // Re-sync - fresh again
      monitor.markCacheSynced();
      expect(monitor.getCacheStaleness().isStale).toBe(false);
    });
  });
});
