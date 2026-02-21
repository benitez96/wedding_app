/**
 * Network Monitor
 *
 * Measures network latency and tracks cache staleness for strategy decisions.
 * Uses exponential moving average (EMA) for smooth latency measurements.
 *
 * Single Responsibility: Network metrics + cache staleness tracking
 */

import type {
  NetworkMetrics,
  CacheStaleness,
  CheckInStrategyConfig,
} from "@/types/check-in-strategy";

const PING_INTERVAL_MS = 10_000; // Ping every 10s to measure latency
const EMA_ALPHA = 0.3; // Exponential moving average weight (0-1, higher = more reactive)

export class NetworkMonitor {
  private networkMetrics: NetworkMetrics = {
    isOnline: true,
    latencyMs: 0,
    lastMeasuredAt: Date.now(),
  };

  private cacheStaleness: CacheStaleness = {
    lastSyncedAt: Date.now(),
    stalenessMs: 0,
    isStale: false,
  };

  private pingIntervalId: ReturnType<typeof setInterval> | null = null;
  private config: CheckInStrategyConfig;

  constructor(config: CheckInStrategyConfig) {
    this.config = config;
  }

  /**
   * Start monitoring network latency (client-side only)
   */
  start() {
    if (typeof window === "undefined") return;

    // Initial ping
    this.measureLatency();

    // Periodic pings
    this.pingIntervalId = setInterval(() => {
      this.measureLatency();
    }, PING_INTERVAL_MS);

    // Listen to online/offline events
    window.addEventListener("online", this.handleOnline);
    window.addEventListener("offline", this.handleOffline);
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }

    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline);
      window.removeEventListener("offline", this.handleOffline);
    }
  }

  /**
   * Measure network latency via lightweight HEAD request
   */
  private async measureLatency() {
    if (typeof window === "undefined" || !navigator.onLine) {
      this.networkMetrics.isOnline = false;
      return;
    }

    try {
      const start = performance.now();

      // Lightweight HEAD request to measure round-trip time
      await fetch("/api/health", {
        method: "HEAD",
        cache: "no-store",
      });

      const latency = performance.now() - start;

      // Exponential moving average for smooth latency
      const previousLatency = this.networkMetrics.latencyMs;
      const smoothedLatency =
        previousLatency === 0
          ? latency
          : EMA_ALPHA * latency + (1 - EMA_ALPHA) * previousLatency;

      this.networkMetrics = {
        isOnline: true,
        latencyMs: Math.round(smoothedLatency),
        lastMeasuredAt: Date.now(),
      };

      // TODO: delete test comment
      console.log(
        `[📡 Network Monitor] Latency measured: ${Math.round(latency)}ms (smoothed: ${Math.round(smoothedLatency)}ms)`,
      );
    } catch {
      // Network error → mark as offline
      this.networkMetrics.isOnline = false;
      // TODO: delete test comment
      console.log(`[📡 Network Monitor] Offline detected`);
    }
  }

  /**
   * Update cache staleness after a successful sync
   */
  markCacheSynced() {
    const now = Date.now();
    this.cacheStaleness = {
      lastSyncedAt: now,
      stalenessMs: 0,
      isStale: false,
    };
  }

  /**
   * Get current network metrics
   */
  getNetworkMetrics(): NetworkMetrics {
    return { ...this.networkMetrics };
  }

  /**
   * Get current cache staleness
   */
  getCacheStaleness(): CacheStaleness {
    const now = Date.now();
    const stalenessMs = now - this.cacheStaleness.lastSyncedAt;
    const isStale = stalenessMs > this.config.maxStalenessMs;

    return {
      lastSyncedAt: this.cacheStaleness.lastSyncedAt,
      stalenessMs,
      isStale,
    };
  }

  /**
   * Force immediate latency measurement (useful before critical operations)
   */
  async measureNow(): Promise<NetworkMetrics> {
    await this.measureLatency();
    return this.getNetworkMetrics();
  }

  // Event handlers
  private handleOnline = () => {
    this.networkMetrics.isOnline = true;
    this.measureLatency(); // Immediately measure latency on reconnect
  };

  private handleOffline = () => {
    this.networkMetrics.isOnline = false;
  };
}
