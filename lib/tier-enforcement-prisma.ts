/**
 * Prisma implementation of TierEnforcementStorage
 */

import "server-only";

import prisma from "@/lib/prisma";
import type {
  TierEnforcementStorage,
  UserTierContext,
  EnforcementResult,
} from "@/lib/tier-enforcement";
import { TierEnforcementService } from "@/lib/tier-enforcement";
import type { SubscriptionTier } from "@/types/subscription";

/**
 * Implementación de TierEnforcementStorage usando Prisma
 */
export class PrismaTierEnforcementStorage implements TierEnforcementStorage {
  async getUserSubscription(userId: string): Promise<{
    tier: SubscriptionTier;
  } | null> {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      select: { tier: true },
    });

    if (!subscription) {
      return null;
    }

    return {
      tier: subscription.tier as SubscriptionTier,
    };
  }

  async countInvitations(eventId: string): Promise<number> {
    return prisma.invitation.count({
      where: { eventId },
    });
  }

  async countEvents(userId: string): Promise<number> {
    return prisma.event.count({
      where: { ownerId: userId },
    });
  }
}

/**
 * Singleton instance del service con Prisma storage
 */
const prismaStorage = new PrismaTierEnforcementStorage();
export const tierEnforcementService = new TierEnforcementService(prismaStorage);

// Re-export service methods as top-level functions para backward compatibility
export async function getUserTierContext(
  userId: string,
): Promise<UserTierContext> {
  return tierEnforcementService.getUserTierContext(userId);
}

export async function enforceGuestLimit(
  userId: string,
  eventId: string,
): Promise<EnforcementResult> {
  return tierEnforcementService.enforceGuestLimit(userId, eventId);
}

export async function enforceEventLimit(
  userId: string,
): Promise<EnforcementResult> {
  return tierEnforcementService.enforceEventLimit(userId);
}

export async function enforceCollaboratorAccess(
  userId: string,
): Promise<EnforcementResult> {
  return tierEnforcementService.enforceCollaboratorAccess(userId);
}

export async function getGuestUsage(
  userId: string,
  eventId: string,
): Promise<{
  current: number;
  limit: number | null;
  tier: SubscriptionTier;
}> {
  return tierEnforcementService.getGuestUsage(userId, eventId);
}
