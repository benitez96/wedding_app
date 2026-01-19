import prisma from "@/lib/prisma";
import { CONFIGURATION_KEYS } from "@/types/configuration";
import type { ConfigurationKey } from "@/types/configuration";

// Cache en memoria con TTL de 5 minutos
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
const cache = new Map<string, { value: string | null; timestamp: number }>();

/**
 * Obtiene una configuración específica desde la BBDD
 * Incluye cache en memoria para optimizar lecturas
 */
export async function getConfigurationValue(
  key: ConfigurationKey,
): Promise<string | null> {
  // Revisar cache
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.value;
  }

  try {
    const config = await prisma.configuration.findUnique({
      where: { key },
      select: { value: true },
    });

    const value = config?.value || null;

    // Guardar en cache
    cache.set(key, { value, timestamp: Date.now() });

    return value;
  } catch (error) {
    console.error(`Error obteniendo configuración ${key}:`, error);
    return null;
  }
}

/**
 * Obtiene múltiples configuraciones en un solo query
 */
export async function getConfigurations(
  keys: ConfigurationKey[],
): Promise<Record<ConfigurationKey, string | null>> {
  try {
    const configs = await prisma.configuration.findMany({
      where: { key: { in: keys } },
      select: { key: true, value: true },
    });

    const result: Record<string, string | null> = {};
    for (const key of keys) {
      const config = configs.find((c) => c.key === key);
      result[key] = config?.value || null;

      // Actualizar cache
      cache.set(key, { value: config?.value || null, timestamp: Date.now() });
    }

    return result as Record<ConfigurationKey, string | null>;
  } catch (error) {
    console.error("Error obteniendo configuraciones:", error);

    // Retornar objeto con valores null
    const result: Record<string, string | null> = {};
    for (const key of keys) {
      result[key] = null;
    }
    return result as Record<ConfigurationKey, string | null>;
  }
}

/**
 * Obtiene la fecha de la boda desde BBDD o fallback a variable de entorno
 */
export async function getWeddingDate(): Promise<Date> {
  const dateString = await getConfigurationValue(
    CONFIGURATION_KEYS.WEDDING_DATE,
  );

  if (dateString) {
    // dateString está en formato "YYYY-MM-DDTHH:mm" (datetime-local)
    // Lo convertimos a Date asumiendo hora local
    return new Date(dateString);
  }

  // Fallback a variable de entorno (formato: YYYYMMDD)
  const envDate = process.env.NEXT_PUBLIC_WEDDING_DATE || "20260214";
  const year = parseInt(envDate.substring(0, 4));
  const month = parseInt(envDate.substring(4, 6));
  const day = parseInt(envDate.substring(6, 8));

  return new Date(year, month - 1, day, 19, 0, 0);
}

/**
 * Obtiene la URL de subida de fotos desde BBDD o fallback a variable de entorno
 */
export async function getPhotoUploadUrl(): Promise<string> {
  const url = await getConfigurationValue(CONFIGURATION_KEYS.PHOTO_UPLOAD_URL);

  return url || process.env.NEXT_PUBLIC_PHOTO_UPLOAD_URL || "";
}

/**
 * Obtiene los días de recordatorio RSVP desde BBDD o fallback a variable de entorno
 */
export async function getRemindRestingDays(): Promise<number> {
  const days = await getConfigurationValue(
    CONFIGURATION_KEYS.REMIND_RESTING_DAYS,
  );

  if (days) {
    const parsed = Number.parseInt(days, 10);
    if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 365) {
      return parsed;
    }
  }

  // Fallback a variable de entorno
  const envDays = process.env.NEXT_PUBLIC_REMIND_RESTING || "40";
  return Number.parseInt(envDays, 10);
}

/**
 * Limpia el cache de configuraciones (útil después de actualizaciones)
 */
export function clearConfigurationCache(): void {
  cache.clear();
}
