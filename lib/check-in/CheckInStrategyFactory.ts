/**
 * Check-In Strategy Factory
 *
 * Single Responsibility: Instantiate the correct strategy based on configuration.
 * Follows Factory Pattern for clean dependency injection.
 */

import type {
  ICheckInStrategy,
  CheckInStrategyConfig,
  CheckInStrategyType,
} from "@/types/check-in-strategy";
import { IDBFirstStrategy } from "./strategies/IDBFirstStrategy";
import { ServerFirstStrategy } from "./strategies/ServerFirstStrategy";
import { HybridSmartStrategy } from "./strategies/HybridSmartStrategy";

export class CheckInStrategyFactory {
  /**
   * Create strategy instance based on config
   */
  static create(config: CheckInStrategyConfig): ICheckInStrategy {
    switch (config.strategy) {
      case "IDB_FIRST":
        return new IDBFirstStrategy(config);

      case "SERVER_FIRST":
        return new ServerFirstStrategy(config);

      case "HYBRID_SMART":
        return new HybridSmartStrategy(config);

      default:
        // Type guard ensures exhaustive check, but fallback to safe default
        console.warn(
          `Unknown strategy: ${config.strategy}, falling back to IDB_FIRST`,
        );
        return new IDBFirstStrategy(config);
    }
  }
}
