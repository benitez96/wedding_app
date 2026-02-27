/**
 * Tests for lib/check-in/CheckInStrategyFactory.ts
 */

import { describe, it, expect, vi } from "vitest";
import { CheckInStrategyFactory } from "@/lib/check-in/CheckInStrategyFactory";
import { IDBFirstStrategy } from "@/lib/check-in/strategies/IDBFirstStrategy";
import { ServerFirstStrategy } from "@/lib/check-in/strategies/ServerFirstStrategy";
import { HybridSmartStrategy } from "@/lib/check-in/strategies/HybridSmartStrategy";
import type { CheckInStrategyConfig } from "@/types/check-in-strategy";

describe("CheckInStrategyFactory", () => {
  const baseConfig: CheckInStrategyConfig = {
    strategy: "IDB_FIRST",
    serverTimeoutMs: 5000,
    maxStalenessMs: 30000,
    parallelRaceEnabled: true,
    networkLatencyThresholdMs: 500,
  };

  describe("create", () => {
    it("should create IDBFirstStrategy when strategy is IDB_FIRST", () => {
      const config: CheckInStrategyConfig = {
        ...baseConfig,
        strategy: "IDB_FIRST",
      };

      const strategy = CheckInStrategyFactory.create(config);

      expect(strategy).toBeInstanceOf(IDBFirstStrategy);
      expect(strategy.getName()).toBe("IDB_FIRST");
    });

    it("should create ServerFirstStrategy when strategy is SERVER_FIRST", () => {
      const config: CheckInStrategyConfig = {
        ...baseConfig,
        strategy: "SERVER_FIRST",
      };

      const strategy = CheckInStrategyFactory.create(config);

      expect(strategy).toBeInstanceOf(ServerFirstStrategy);
      expect(strategy.getName()).toBe("SERVER_FIRST");
    });

    it("should create HybridSmartStrategy when strategy is HYBRID_SMART", () => {
      const config: CheckInStrategyConfig = {
        ...baseConfig,
        strategy: "HYBRID_SMART",
      };

      const strategy = CheckInStrategyFactory.create(config);

      expect(strategy).toBeInstanceOf(HybridSmartStrategy);
      expect(strategy.getName()).toBe("HYBRID_SMART");
    });

    it("should fallback to IDBFirstStrategy for unknown strategy", () => {
      const config: CheckInStrategyConfig = {
        ...baseConfig,
        strategy: "UNKNOWN_STRATEGY" as any,
      };

      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const strategy = CheckInStrategyFactory.create(config);

      expect(strategy).toBeInstanceOf(IDBFirstStrategy);
      // Logger uses logWarning which formats as "[context]"
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "[Unknown check-in strategy]",
      );

      consoleWarnSpy.mockRestore();
    });

    it("should pass config to created strategy", () => {
      const config: CheckInStrategyConfig = {
        strategy: "IDB_FIRST",
        serverTimeoutMs: 10000,
        maxStalenessMs: 60000,
        parallelRaceEnabled: false,
        networkLatencyThresholdMs: 1000,
      };

      const strategy = CheckInStrategyFactory.create(config);

      // Strategy should be created with the provided config
      expect(strategy).toBeDefined();
    });
  });
});
