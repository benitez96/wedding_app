/**
 * Prisma implementation of ConfigurationStorage
 */

import prisma from "@/lib/prisma";
import type {
  ConfigurationStorage,
  ConfigurationKey,
} from "@/lib/get-configurations";
import { ConfigurationService } from "@/lib/get-configurations";

/**
 * Implementación de ConfigurationStorage usando Prisma
 */
export class PrismaConfigurationStorage implements ConfigurationStorage {
  async findOne(
    eventId: string,
    key: ConfigurationKey,
  ): Promise<{ value: string } | null> {
    const config = await prisma.configuration.findUnique({
      where: { eventId_key: { eventId, key } },
      select: { value: true },
    });

    return config;
  }

  async findMany(
    eventId: string,
    keys: ConfigurationKey[],
  ): Promise<Array<{ key: ConfigurationKey; value: string }>> {
    const configs = await prisma.configuration.findMany({
      where: { eventId, key: { in: keys } },
      select: { key: true, value: true },
    });

    return configs.map((c) => ({
      key: c.key as ConfigurationKey,
      value: c.value,
    }));
  }
}

/**
 * Singleton instance del service con Prisma storage
 */
const prismaStorage = new PrismaConfigurationStorage();
export const configurationService = new ConfigurationService(prismaStorage);

// Re-export service methods para backward compatibility
export async function getConfigurationValue(
  eventId: string,
  key: ConfigurationKey,
): Promise<string | null> {
  return configurationService.getConfigurationValue(eventId, key);
}

export async function getConfigurations(
  eventId: string,
  keys: ConfigurationKey[],
): Promise<Record<ConfigurationKey, string | null>> {
  return configurationService.getConfigurations(eventId, keys);
}

export function clearConfigurationCache(): void {
  configurationService.clearCache();
}

// Re-export specific getters
export const getWeddingDate = configurationService.getWeddingDate;
export const getPhotoUploadUrl = configurationService.getPhotoUploadUrl;
export const getRemindRestingDays = configurationService.getRemindRestingDays;
