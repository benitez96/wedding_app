import "server-only";

import prisma from "@/lib/prisma";
import {
  TIER_LIMITS,
  type SubscriptionTier,
  type TierLimits,
} from "@/types/subscription";

/**
 * Contexto de tier del usuario - subscription + limites
 */
export interface UserTierContext {
  userId: string;
  tier: SubscriptionTier;
  limits: TierLimits;
}

/**
 * Obtiene el contexto de tier de un usuario (subscription + limits)
 */
export async function getUserTierContext(
  userId: string,
): Promise<UserTierContext> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { tier: true },
  });

  const tier = (subscription?.tier ?? "FREE") as SubscriptionTier;

  return {
    userId,
    tier,
    limits: TIER_LIMITS[tier],
  };
}

/**
 * Resultado de un check de enforcement
 */
export interface EnforcementResult {
  allowed: boolean;
  reason?: string;
  current?: number;
  limit?: number | null;
}

/**
 * Verifica si el usuario puede crear mas invitados en un evento
 */
export async function enforceGuestLimit(
  userId: string,
  eventId: string,
): Promise<EnforcementResult> {
  const { tier, limits } = await getUserTierContext(userId);

  if (limits.maxGuestsPerEvent === null) {
    return { allowed: true };
  }

  const currentCount = await prisma.invitation.count({
    where: { eventId },
  });

  if (currentCount >= limits.maxGuestsPerEvent) {
    return {
      allowed: false,
      reason: `El plan ${tier} permite hasta ${limits.maxGuestsPerEvent} invitados por evento`,
      current: currentCount,
      limit: limits.maxGuestsPerEvent,
    };
  }

  return {
    allowed: true,
    current: currentCount,
    limit: limits.maxGuestsPerEvent,
  };
}

/**
 * Verifica si el usuario puede crear mas eventos
 */
export async function enforceEventLimit(
  userId: string,
): Promise<EnforcementResult> {
  const { tier, limits } = await getUserTierContext(userId);

  if (limits.maxEvents === null) {
    return { allowed: true };
  }

  const currentCount = await prisma.event.count({
    where: { ownerId: userId },
  });

  if (currentCount >= limits.maxEvents) {
    return {
      allowed: false,
      reason: `El plan ${tier} permite hasta ${limits.maxEvents} evento(s)`,
      current: currentCount,
      limit: limits.maxEvents,
    };
  }

  return {
    allowed: true,
    current: currentCount,
    limit: limits.maxEvents,
  };
}

/**
 * Verifica si el usuario tiene acceso a funcionalidad de colaboradores (tier COMPANY)
 */
export async function enforceCollaboratorAccess(
  userId: string,
): Promise<EnforcementResult> {
  const { limits } = await getUserTierContext(userId);

  if (!limits.canHaveCollaborators) {
    return {
      allowed: false,
      reason:
        "La funcionalidad de colaboradores requiere el plan Company",
    };
  }

  return { allowed: true };
}

/**
 * Obtiene el conteo actual de invitados para un evento (util para mostrar en UI)
 */
export async function getGuestUsage(
  userId: string,
  eventId: string,
): Promise<{ current: number; limit: number | null; tier: SubscriptionTier }> {
  const { tier, limits } = await getUserTierContext(userId);

  const current = await prisma.invitation.count({
    where: { eventId },
  });

  return {
    current,
    limit: limits.maxGuestsPerEvent,
    tier,
  };
}
