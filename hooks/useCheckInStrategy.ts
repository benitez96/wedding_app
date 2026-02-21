"use client";

/**
 * useCheckInStrategy Hook
 *
 * Integrates NetworkMonitor + StrategyFactory to provide a reactive
 * check-in interface with dynamic strategy selection.
 *
 * Returns:
 * - validateQR: Function to validate scanned QR codes
 * - createCheckIn: Function to create check-ins
 * - metrics: Current network + staleness metrics
 * - strategyName: Active strategy name
 */

import { useState, useEffect, useRef } from "react";
import type {
  ICheckInStrategy,
  CheckInStrategyConfig,
  CheckInAttemptInput,
  CheckInAttemptResult,
  NetworkMetrics,
  CacheStaleness,
  StrategyDecisionContext,
} from "@/types/check-in-strategy";
import { NetworkMonitor } from "@/lib/check-in/NetworkMonitor";
import { CheckInStrategyFactory } from "@/lib/check-in/CheckInStrategyFactory";
import { HybridSmartStrategy } from "@/lib/check-in/strategies/HybridSmartStrategy";

interface UseCheckInStrategyReturn {
  validateQR: (
    tokenId: string,
    eventId: string,
  ) => Promise<CheckInAttemptResult>;
  createCheckIn: (input: CheckInAttemptInput) => Promise<CheckInAttemptResult>;
  networkMetrics: NetworkMetrics;
  cacheStaleness: CacheStaleness;
  strategyName: string;
  markCacheSynced: () => void;
}

export function useCheckInStrategy(
  config: CheckInStrategyConfig,
): UseCheckInStrategyReturn {
  const [networkMetrics, setNetworkMetrics] = useState<NetworkMetrics>({
    isOnline: true,
    latencyMs: 0,
    lastMeasuredAt: Date.now(),
  });

  const [cacheStaleness, setCacheStaleness] = useState<CacheStaleness>({
    lastSyncedAt: Date.now(),
    stalenessMs: 0,
    isStale: false,
  });

  // Keep monitor and strategy instances in refs (don't recreate on render)
  const monitorRef = useRef<NetworkMonitor | null>(null);
  const strategyRef = useRef<ICheckInStrategy | null>(null);

  // Initialize monitor + strategy on mount
  useEffect(() => {
    // Create monitor
    const monitor = new NetworkMonitor(config);
    monitor.start();
    monitorRef.current = monitor;

    // Create strategy
    const strategy = CheckInStrategyFactory.create(config);
    strategyRef.current = strategy;

    // Periodic metrics update (every 2s for UI reactivity)
    const intervalId = setInterval(() => {
      setNetworkMetrics(monitor.getNetworkMetrics());
      setCacheStaleness(monitor.getCacheStaleness());
    }, 2000);

    return () => {
      monitor.stop();
      clearInterval(intervalId);
    };
  }, [config]);

  // Validate QR with strategy
  const validateQR = async (
    tokenId: string,
    eventId: string,
  ): Promise<CheckInAttemptResult> => {
    if (!strategyRef.current || !monitorRef.current) {
      return {
        success: false,
        source: "IDB",
        error: "Strategy not initialized",
      };
    }

    const strategy = strategyRef.current;

    // If HYBRID_SMART, pass decision context
    if (strategy instanceof HybridSmartStrategy) {
      const context: StrategyDecisionContext = {
        networkMetrics: monitorRef.current.getNetworkMetrics(),
        cacheStaleness: monitorRef.current.getCacheStaleness(),
        config,
      };

      return strategy.validateQR(tokenId, eventId, context);
    }

    // Other strategies don't need context
    return strategy.validateQR(tokenId, eventId);
  };

  // Create check-in with strategy
  const createCheckIn = async (
    input: CheckInAttemptInput,
  ): Promise<CheckInAttemptResult> => {
    if (!strategyRef.current) {
      return {
        success: false,
        source: "SERVER",
        error: "Strategy not initialized",
      };
    }

    return strategyRef.current.createCheckIn(input);
  };

  // Mark cache as freshly synced (called after delta sync completes)
  const markCacheSynced = () => {
    if (monitorRef.current) {
      monitorRef.current.markCacheSynced();
      setCacheStaleness(monitorRef.current.getCacheStaleness());
    }
  };

  return {
    validateQR,
    createCheckIn,
    networkMetrics,
    cacheStaleness,
    strategyName: strategyRef.current?.getName() || "UNKNOWN",
    markCacheSynced,
  };
}
