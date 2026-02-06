import { cache } from "react";
import prisma from "@/lib/prisma";
import { CONFIGURATION_KEYS } from "@/types/configuration";
import type { ConfigurationKey } from "@/types/configuration";
import { logError } from "@/lib/logger";

// Cache en memoria con TTL de 5 minutos
// Key format: `${eventId}:${configKey}`
const CACHE_TTL = 5 * 60 * 1000;
const memoryCache = new Map<
  string,
  { value: string | null; timestamp: number }
>();

function cacheKey(eventId: string, key: string): string {
  return `${eventId}:${key}`;
}

/**
 * Obtiene una configuración específica desde la BBDD (scoped por evento)
 */
export async function getConfigurationValue(
  eventId: string,
  key: ConfigurationKey,
): Promise<string | null> {
  const ck = cacheKey(eventId, key);
  const cached = memoryCache.get(ck);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.value;
  }

  try {
    const config = await prisma.configuration.findUnique({
      where: { eventId_key: { eventId, key } },
      select: { value: true },
    });

    const value = config?.value || null;
    memoryCache.set(ck, { value, timestamp: Date.now() });

    return value;
  } catch (error) {
    logError(`Error obteniendo configuración ${key}`, error);
    return null;
  }
}

/**
 * Obtiene múltiples configuraciones en un solo query (scoped por evento)
 */
export async function getConfigurations(
  eventId: string,
  keys: ConfigurationKey[],
): Promise<Record<ConfigurationKey, string | null>> {
  try {
    const configs = await prisma.configuration.findMany({
      where: { eventId, key: { in: keys } },
      select: { key: true, value: true },
    });

    const result: Record<string, string | null> = {};
    for (const key of keys) {
      const config = configs.find((c) => c.key === key);
      result[key] = config?.value || null;

      memoryCache.set(cacheKey(eventId, key), {
        value: config?.value || null,
        timestamp: Date.now(),
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

/**
 * Obtiene la fecha de la boda desde BBDD o fallback a variable de entorno
 * Requiere eventId para scoping
 */
export const getWeddingDate = cache(async (eventId: string): Promise<Date> => {
  const dateString = await getConfigurationValue(
    eventId,
    CONFIGURATION_KEYS.WEDDING_DATE,
  );

  if (dateString) {
    return new Date(dateString);
  }

  // Fallback a variable de entorno (formato: YYYYMMDD)
  const envDate = process.env.NEXT_PUBLIC_WEDDING_DATE || "20260214";
  const year = parseInt(envDate.substring(0, 4));
  const month = parseInt(envDate.substring(4, 6));
  const day = parseInt(envDate.substring(6, 8));

  return new Date(year, month - 1, day, 19, 0, 0);
});

/**
 * Obtiene la URL de subida de fotos desde BBDD o fallback a variable de entorno
 */
export const getPhotoUploadUrl = cache(
  async (eventId: string): Promise<string> => {
    const url = await getConfigurationValue(
      eventId,
      CONFIGURATION_KEYS.PHOTO_UPLOAD_URL,
    );

    return url || process.env.NEXT_PUBLIC_PHOTO_UPLOAD_URL || "";
  },
);

/**
 * Obtiene los días de recordatorio RSVP desde BBDD o fallback a variable de entorno
 */
export const getRemindRestingDays = cache(
  async (eventId: string): Promise<number> => {
    const days = await getConfigurationValue(
      eventId,
      CONFIGURATION_KEYS.REMIND_RESTING_DAYS,
    );

    if (days) {
      const parsed = Number.parseInt(days, 10);
      if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 365) {
        return parsed;
      }
    }

    const envDays = process.env.NEXT_PUBLIC_REMIND_RESTING || "40";
    return Number.parseInt(envDays, 10);
  },
);

/**
 * Limpia el cache de configuraciones (útil después de actualizaciones)
 */
export function clearConfigurationCache(): void {
  memoryCache.clear();
}
