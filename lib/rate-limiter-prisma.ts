/**
 * Prisma implementation of RateLimitStorage
 * Este archivo SÍ depende de Prisma, pero la lógica de negocio está separada
 */

import prisma from "@/lib/prisma";
import type { RateLimitStorage, RateLimitActionType } from "@/lib/rate-limiter";

/**
 * Implementación de RateLimitStorage usando Prisma
 */
export class PrismaRateLimitStorage implements RateLimitStorage {
  async findActiveBlock(
    ip: string,
    actionType: RateLimitActionType,
    now: Date,
  ): Promise<{ blockedUntil: Date } | null> {
    const block = await prisma.rateLimitBlock.findFirst({
      where: {
        ip,
        actionType,
        blockedUntil: {
          gt: now,
        },
      },
      select: {
        blockedUntil: true,
      },
    });

    return block;
  }

  async deleteOldAttempts(
    ip: string,
    actionType: RateLimitActionType,
    windowStart: Date,
  ): Promise<void> {
    await prisma.rateLimitAttempt.deleteMany({
      where: {
        ip,
        actionType,
        createdAt: {
          lt: windowStart,
        },
      },
    });
  }

  async countAttemptsInWindow(
    ip: string,
    actionType: RateLimitActionType,
    windowStart: Date,
  ): Promise<number> {
    return prisma.rateLimitAttempt.count({
      where: {
        ip,
        actionType,
        createdAt: {
          gte: windowStart,
        },
        success: false,
      },
    });
  }

  async createAttempt(
    ip: string,
    actionType: RateLimitActionType,
    success: boolean,
  ): Promise<void> {
    await prisma.rateLimitAttempt.create({
      data: {
        ip,
        actionType,
        success,
      },
    });
  }

  async createBlock(
    ip: string,
    actionType: RateLimitActionType,
    blockedUntil: Date,
    reason: string,
  ): Promise<void> {
    await prisma.rateLimitBlock.create({
      data: {
        ip,
        actionType,
        blockedUntil,
        reason,
      },
    });
  }

  async logSecurityEvent(
    type: string,
    ip: string,
    details: Record<string, unknown>,
  ): Promise<void> {
    await prisma.securityLog.create({
      data: {
        type: type as any, // SecurityLogType
        ip,
        userAgent: "N/A",
        details: details as any, // InputJsonValue
      },
    });
  }

  async deleteOldAttemptsGlobal(olderThan: Date): Promise<void> {
    await prisma.rateLimitAttempt.deleteMany({
      where: {
        createdAt: {
          lt: olderThan,
        },
      },
    });
  }

  async deleteExpiredBlocks(now: Date): Promise<void> {
    await prisma.rateLimitBlock.deleteMany({
      where: {
        blockedUntil: {
          lt: now,
        },
      },
    });
  }
}

/**
 * Singleton instance del service con Prisma storage
 */
import { RateLimiterService } from "@/lib/rate-limiter";

const prismaStorage = new PrismaRateLimitStorage();
export const rateLimiterService = new RateLimiterService(prismaStorage);

// Re-export helper functions para backward compatibility
export { getClientIP } from "@/lib/rate-limiter";

// Re-export service methods as top-level functions para backward compatibility
export async function isIPBlocked(
  ip: string,
  actionType: RateLimitActionType,
): Promise<{ blocked: boolean; block?: { blockedUntil: Date } | null }> {
  return rateLimiterService.isIPBlocked(ip, actionType);
}

export async function recordAttempt(
  ip: string,
  actionType: RateLimitActionType,
  success: boolean = false,
): Promise<{
  allowed: boolean;
  remainingAttempts: number;
  blockedUntil?: Date;
}> {
  return rateLimiterService.recordAttempt(ip, actionType, success);
}

export async function checkRateLimit(
  ip: string,
  actionType: RateLimitActionType,
): Promise<{
  allowed: boolean;
  remainingAttempts: number;
  blockedUntil?: Date;
}> {
  return rateLimiterService.checkRateLimit(ip, actionType);
}

export async function blockIPForHoneypot(
  ip: string,
  actionType: RateLimitActionType,
  details?: string,
): Promise<void> {
  return rateLimiterService.blockIPForHoneypot(ip, actionType, details);
}

export async function cleanupOldRateLimitData(): Promise<void> {
  return rateLimiterService.cleanupOldRateLimitData();
}
