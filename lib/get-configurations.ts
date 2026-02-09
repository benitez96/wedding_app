import { cache } from "react";
import { CONFIGURATION_KEYS } from "@/types/configuration";
import type { ConfigurationKey } from "@/types/configuration";
import { logError } from "@/lib/logger";

// Re-export ConfigurationKey for adapters
export type { ConfigurationKey };

// ============================================================================
// PURE BUSINESS LOGIC - No database dependencies
// ============================================================================

/**
 * Cache en memoria con TTL de 5 minutos
 */
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Genera key para cache
 */
export function cacheKey(eventId: string, key: string): string {
  return `${eventId}:${key}`;
}

/**
 * Verifica si el cache está vigente
 */
export function isCacheValid(timestamp: number, now: number): boolean {
  return now - timestamp < CACHE_TTL;
}

/**
 * Parsea una fecha desde formato YYYYMMDD
 */
export function parseDateFromString(dateString: string): Date {
  const year = parseInt(dateString.substring(0, 4));
  const month = parseInt(dateString.substring(4, 6));
  const day = parseInt(dateString.substring(6, 8));
  return new Date(year, month - 1, day, 19, 0, 0);
}

/**
 * Valida y parsea días de recordatorio
 */
export function parseRemindDays(value: string | null): number | null {
  if (!value) return null;

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1 || parsed > 365) {
    return null;
  }

  return parsed;
}

// ============================================================================
// DATABASE OPERATIONS - Depend on external database adapter
// ============================================================================

/**
 * Database adapter interface for configurations
 */
export interface ConfigurationStorage {
  findOne(
    eventId: string,
    key: ConfigurationKey,
  ): Promise<{ value: string } | null>;

  findMany(
    eventId: string,
    keys: ConfigurationKey[],
  ): Promise<Array<{ key: ConfigurationKey; value: string }>>;
}

/**
 * Configuration service with dependency injection and in-memory cache
 */
export class ConfigurationService {
  private memoryCache = new Map<
    string,
    { value: string | null; timestamp: number }
  >();

  constructor(private storage: ConfigurationStorage) {}

  async getConfigurationValue(
    eventId: string,
    key: ConfigurationKey,
  ): Promise<string | null> {
    const ck = cacheKey(eventId, key);
    const cached = this.memoryCache.get(ck);
    const now = Date.now();

    if (cached && isCacheValid(cached.timestamp, now)) {
      return cached.value;
    }

    try {
      const config = await this.storage.findOne(eventId, key);
      const value = config?.value || null;
      this.memoryCache.set(ck, { value, timestamp: now });
      return value;
    } catch (error) {
      logError(`Error obteniendo configuración ${key}`, error);
      return null;
    }
  }

  async getConfigurations(
    eventId: string,
    keys: ConfigurationKey[],
  ): Promise<Record<ConfigurationKey, string | null>> {
    try {
      const configs = await this.storage.findMany(eventId, keys);
      const now = Date.now();

      const result: Record<string, string | null> = {};
      for (const key of keys) {
        const config = configs.find((c) => c.key === key);
        result[key] = config?.value || null;

        this.memoryCache.set(cacheKey(eventId, key), {
          value: config?.value || null,
          timestamp: now,
        });
      }

      return result as Record<ConfigurationKey, string | null>;
    } catch (error) {
      logError("Error obteniendo configuraciones", error);

      const result: Record<string, string | null> = {};
      for (const key of keys) {
        result[key] = null;
      }
      return result as Record<ConfigurationKey, string | null>;
    }
  }

  clearCache(): void {
    this.memoryCache.clear();
  }

  // ============================================================================
  // SPECIFIC CONFIGURATION GETTERS - Business logic con fallbacks
  // ============================================================================

  getWeddingDate = cache(async (eventId: string): Promise<Date> => {
    const dateString = await this.getConfigurationValue(
      eventId,
      CONFIGURATION_KEYS.WEDDING_DATE,
    );

    if (dateString) {
      return new Date(dateString);
    }

    // Fallback a variable de entorno (formato: YYYYMMDD)
    const envDate = process.env.NEXT_PUBLIC_WEDDING_DATE || "20260214";
    return parseDateFromString(envDate);
  });

  getPhotoUploadUrl = cache(async (eventId: string): Promise<string> => {
    const url = await this.getConfigurationValue(
      eventId,
      CONFIGURATION_KEYS.PHOTO_UPLOAD_URL,
    );

    return url || process.env.NEXT_PUBLIC_PHOTO_UPLOAD_URL || "";
  });

  getRemindRestingDays = cache(async (eventId: string): Promise<number> => {
    const days = await this.getConfigurationValue(
      eventId,
      CONFIGURATION_KEYS.REMIND_RESTING_DAYS,
    );

    const parsed = parseRemindDays(days);
    if (parsed !== null) {
      return parsed;
    }

    const envDays = process.env.NEXT_PUBLIC_REMIND_RESTING || "40";
    return Number.parseInt(envDays, 10);
  });
}
