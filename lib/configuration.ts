import "server-only";

import prisma from "@/lib/prisma";
import {
  ConfigurationValueMap,
  CONFIGURATION_KEYS,
} from "@/types/configuration";

const DEFAULT_CONFIGURATION_VALUES: ConfigurationValueMap = {
  [CONFIGURATION_KEYS.PHOTO_UPLOAD_URL]: null,
  [CONFIGURATION_KEYS.WEDDING_DATE]: "20260214193000",
  [CONFIGURATION_KEYS.REMIND_RESTING_DAYS]: "7", // Días de descanso antes de recordar
};

const configurationCache = new Map<string, string | null>();

export async function getConfigurationValue(key: keyof ConfigurationValueMap) {
  if (configurationCache.has(key)) {
    return configurationCache.get(key) ?? null;
  }

  try {
    const record = await prisma.configuration.findUnique({
      where: { key },
      select: { value: true },
    });

    const value = record?.value ?? DEFAULT_CONFIGURATION_VALUES[key];
    configurationCache.set(key, value);
    return value;
  } catch (error) {
    // Si hay error de conexión a BD, usar valores por defecto
    console.warn(`Error fetching configuration ${key}, using default:`, error);
    return DEFAULT_CONFIGURATION_VALUES[key];
  }
}

export async function getConfigurationValues(
  keys: Array<keyof ConfigurationValueMap>,
) {
  const cachedValues: ConfigurationValueMap = {
    ...DEFAULT_CONFIGURATION_VALUES,
  };
  const missingKeys: Array<keyof ConfigurationValueMap> = [];

  keys.forEach((key) => {
    if (configurationCache.has(key)) {
      cachedValues[key] = configurationCache.get(key) ?? null;
    } else {
      missingKeys.push(key);
    }
  });

  if (missingKeys.length === 0) {
    return cachedValues;
  }

  try {
    const records = await prisma.configuration.findMany({
      where: { key: { in: missingKeys } },
      select: { key: true, value: true },
    });

    missingKeys.forEach((key) => {
      const record = records.find((entry) => entry.key === key);
      const value = record?.value ?? DEFAULT_CONFIGURATION_VALUES[key];
      cachedValues[key] = value ?? null;
      configurationCache.set(key, value ?? null);
    });
  } catch (error) {
    // Si hay error de conexión a BD, mantener valores por defecto
    console.warn(`Error fetching configurations, using defaults:`, error);
  }

  return cachedValues;
}
