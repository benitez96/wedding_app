import "server-only";

import {
  TIER_LIMITS,
  type SubscriptionTier,
  type TierLimits,
} from "@/types/subscription";

// ============================================================================
// PURE BUSINESS LOGIC - No database dependencies
// ============================================================================

/**
 * Contexto de tier del usuario - subscription + limites
 */
export interface UserTierContext {
  userId: string;
  tier: SubscriptionTier;
  limits: TierLimits;
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
 * Crea el contexto de tier a partir de un tier
 */
export function createTierContext(
  userId: string,
  tier: SubscriptionTier,
): UserTierContext {
  return {
    userId,
    tier,
    limits: TIER_LIMITS[tier],
  };
}

/**
 * Verifica si el conteo actual excede el límite
 */
export function checkLimit(
  current: number,
  limit: number | null,
): { exceeded: boolean } {
  if (limit === null) {
    return { exceeded: false };
  }
  return { exceeded: current >= limit };
}

/**
 * Genera mensaje de error para límite de invitados
 */
export function generateGuestLimitError(
  tier: SubscriptionTier,
  limit: number,
): string {
  return `El plan ${tier} permite hasta ${limit} invitados por evento`;
}

/**
 * Genera mensaje de error para límite de eventos
 */
export function generateEventLimitError(
  tier: SubscriptionTier,
  limit: number,
): string {
  return `El plan ${tier} permite hasta ${limit} evento(s)`;
}

/**
 * Genera mensaje de error para colaboradores
 */
export function generateCollaboratorError(): string {
  return "La funcionalidad de colaboradores requiere el plan Company";
}

/**
 * Evalúa enforcement de invitados (lógica pura)
 */
export function evaluateGuestEnforcement(
  context: UserTierContext,
  currentCount: number,
): EnforcementResult {
  const { tier, limits } = context;

  if (limits.maxGuestsPerEvent === null) {
    return { allowed: true };
  }

  const { exceeded } = checkLimit(currentCount, limits.maxGuestsPerEvent);

  if (exceeded) {
    return {
      allowed: false,
      reason: generateGuestLimitError(tier, limits.maxGuestsPerEvent),
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
 * Evalúa enforcement de eventos (lógica pura)
 */
export function evaluateEventEnforcement(
  context: UserTierContext,
  currentCount: number,
): EnforcementResult {
  const { tier, limits } = context;

  if (limits.maxEvents === null) {
    return { allowed: true };
  }

  const { exceeded } = checkLimit(currentCount, limits.maxEvents);

  if (exceeded) {
    return {
      allowed: false,
      reason: generateEventLimitError(tier, limits.maxEvents),
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
 * Evalúa enforcement de colaboradores (lógica pura)
 */
export function evaluateCollaboratorEnforcement(
  context: UserTierContext,
): EnforcementResult {
  const { limits } = context;

  if (!limits.canHaveCollaborators) {
    return {
      allowed: false,
      reason: generateCollaboratorError(),
    };
  }

  return { allowed: true };
}

// ============================================================================
// DATABASE OPERATIONS - Depend on external database adapter
// ============================================================================

/**
 * Database adapter interface for tier enforcement
 */
export interface TierEnforcementStorage {
  getUserSubscription(userId: string): Promise<{
    tier: SubscriptionTier;
  } | null>;

  countInvitations(eventId: string): Promise<number>;

  countEvents(userId: string): Promise<number>;
}

/**
 * Tier enforcement service with dependency injection
 */
export class TierEnforcementService {
  constructor(private storage: TierEnforcementStorage) {}

  async getUserTierContext(userId: string): Promise<UserTierContext> {
    const subscription = await this.storage.getUserSubscription(userId);
    const tier = (subscription?.tier ?? "FREE") as SubscriptionTier;
    return createTierContext(userId, tier);
  }

  async enforceGuestLimit(
    userId: string,
    eventId: string,
  ): Promise<EnforcementResult> {
    const context = await this.getUserTierContext(userId);
    const currentCount = await this.storage.countInvitations(eventId);
    return evaluateGuestEnforcement(context, currentCount);
  }

  async enforceEventLimit(userId: string): Promise<EnforcementResult> {
    const context = await this.getUserTierContext(userId);
    const currentCount = await this.storage.countEvents(userId);
    return evaluateEventEnforcement(context, currentCount);
  }

  async enforceCollaboratorAccess(userId: string): Promise<EnforcementResult> {
    const context = await this.getUserTierContext(userId);
    return evaluateCollaboratorEnforcement(context);
  }

  async getGuestUsage(
    userId: string,
    eventId: string,
  ): Promise<{
    current: number;
    limit: number | null;
    tier: SubscriptionTier;
  }> {
    const context = await this.getUserTierContext(userId);
    const current = await this.storage.countInvitations(eventId);

    return {
      current,
      limit: context.limits.maxGuestsPerEvent,
      tier: context.tier,
    };
  }
}
