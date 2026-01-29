/**
 * Tipos y constantes relacionados con suscripciones y planes
 */

/**
 * Tiers de suscripción disponibles
 */
export const SUBSCRIPTION_TIERS = {
  FREE: "FREE",
  BASIC: "BASIC",
  COMPANY: "COMPANY",
} as const;

export type SubscriptionTier =
  (typeof SUBSCRIPTION_TIERS)[keyof typeof SUBSCRIPTION_TIERS];

/**
 * Límites por tier de suscripción
 */
export interface TierLimits {
  maxEvents: number | null; // null = ilimitado
  maxGuestsPerEvent: number | null; // null = ilimitado
  canHaveCollaborators: boolean;
  canCustomizeSections: boolean;
  hasAdvancedAnalytics: boolean;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  FREE: {
    maxEvents: 1,
    maxGuestsPerEvent: 5,
    canHaveCollaborators: false,
    canCustomizeSections: false,
    hasAdvancedAnalytics: false,
  },
  BASIC: {
    maxEvents: 1,
    maxGuestsPerEvent: null, // Ilimitado
    canHaveCollaborators: false,
    canCustomizeSections: true,
    hasAdvancedAnalytics: false,
  },
  COMPANY: {
    maxEvents: null, // Ilimitado
    maxGuestsPerEvent: null, // Ilimitado
    canHaveCollaborators: true,
    canCustomizeSections: true,
    hasAdvancedAnalytics: true,
  },
} as const;

/**
 * Información de display para cada tier
 */
export interface TierInfo {
  name: string;
  displayName: string;
  description: string;
  price: string;
  features: string[];
  popular?: boolean;
}

export const TIER_INFO: Record<SubscriptionTier, TierInfo> = {
  FREE: {
    name: "FREE",
    displayName: "Gratis",
    description: "Perfecto para probar la plataforma",
    price: "$0",
    features: [
      "1 evento",
      "Hasta 5 invitados",
      "Diseño completo",
      "Themes básicos",
      "Soporte por email",
    ],
  },
  BASIC: {
    name: "BASIC",
    displayName: "Basic",
    description: "Ideal para eventos personales",
    price: "$X/mes",
    features: [
      "1 evento",
      "Invitados ilimitados",
      "Diseño completo",
      "Todos los themes",
      "Secciones personalizadas",
      "Analytics básico",
      "Soporte prioritario",
    ],
    popular: true,
  },
  COMPANY: {
    name: "COMPANY",
    displayName: "Company",
    description: "Para organizadores profesionales",
    price: "$Y/mes",
    features: [
      "Eventos ilimitados",
      "Invitados ilimitados",
      "Colaboradores ilimitados",
      "Permisos granulares",
      "Diseño completo",
      "Todos los themes",
      "Secciones personalizadas",
      "Analytics avanzado",
      "Soporte premium 24/7",
      "API access",
    ],
  },
} as const;

/**
 * Verifica si un tier permite una feature específica
 */
export function canUseTierFeature(
  tier: SubscriptionTier,
  feature: keyof TierLimits,
): boolean {
  return TIER_LIMITS[tier][feature] === true;
}

/**
 * Verifica si un tier puede crear más eventos
 */
export function canCreateEvent(
  tier: SubscriptionTier,
  currentEventCount: number,
): boolean {
  const limit = TIER_LIMITS[tier].maxEvents;
  return limit === null || currentEventCount < limit;
}

/**
 * Verifica si un tier puede agregar más invitados a un evento
 */
export function canAddGuest(
  tier: SubscriptionTier,
  currentGuestCount: number,
): boolean {
  const limit = TIER_LIMITS[tier].maxGuestsPerEvent;
  return limit === null || currentGuestCount < limit;
}

/**
 * Obtiene el número de eventos restantes que puede crear
 */
export function getRemainingEvents(
  tier: SubscriptionTier,
  currentEventCount: number,
): number | null {
  const limit = TIER_LIMITS[tier].maxEvents;
  if (limit === null) return null; // Ilimitado
  return Math.max(0, limit - currentEventCount);
}

/**
 * Obtiene el número de invitados restantes que puede agregar
 */
export function getRemainingGuests(
  tier: SubscriptionTier,
  currentGuestCount: number,
): number | null {
  const limit = TIER_LIMITS[tier].maxGuestsPerEvent;
  if (limit === null) return null; // Ilimitado
  return Math.max(0, limit - currentGuestCount);
}

/**
 * Estados posibles de una suscripción (Stripe)
 */
export const SUBSCRIPTION_STATUS = {
  ACTIVE: "active", // Suscripción activa y pagada
  PAST_DUE: "past_due", // Pago fallido, aún tiene acceso pero con advertencia
  CANCELED: "canceled", // Cancelada y sin acceso
  INCOMPLETE: "incomplete", // Pago inicial fallido
  TRIALING: "trialing", // En período de prueba
  PAUSED: "paused", // Pausada (Stripe permite pausar suscripciones)
} as const;

export type SubscriptionStatus =
  (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

/**
 * Tipos de eventos en el historial de suscripciones
 */
export const SUBSCRIPTION_EVENT_TYPE = {
  CREATED: "created", // Nueva suscripción creada
  UPGRADED: "upgraded", // Upgrade de tier (FREE → BASIC, BASIC → COMPANY)
  DOWNGRADED: "downgraded", // Downgrade de tier
  RENEWED: "renewed", // Renovación automática exitosa
  CANCELED: "canceled", // Usuario canceló
  EXPIRED: "expired", // Suscripción expiró
  PAYMENT_FAILED: "payment_failed", // Fallo en el pago
  REACTIVATED: "reactivated", // Reactivada después de cancelación
} as const;

export type SubscriptionEventType =
  (typeof SUBSCRIPTION_EVENT_TYPE)[keyof typeof SUBSCRIPTION_EVENT_TYPE];

/**
 * Estado de la suscripción de un usuario (usado en queries)
 */
export interface UserSubscription {
  userId: string;
  tier: SubscriptionTier;
  status?: SubscriptionStatus | null;

  // Stripe
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;

  // Fechas
  subscriptionStartDate?: Date | null;
  subscriptionEndDate?: Date | null;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
  trialEndsAt?: Date | null;
}

/**
 * Verifica si la suscripción está activa
 */
export function isSubscriptionActive(subscription: UserSubscription): boolean {
  // FREE siempre está "activo"
  if (subscription.tier === "FREE") return true;

  // Si no hay status, asumir inactivo
  if (!subscription.status) return false;

  // Estados que se consideran activos
  const activeStatuses: SubscriptionStatus[] = [
    "active",
    "trialing",
    "past_due",
  ];
  return activeStatuses.includes(subscription.status);
}

/**
 * Verifica si la suscripción está en período de gracia (past_due)
 * Esto significa que el pago falló pero aún tiene acceso
 */
export function isInGracePeriod(subscription: UserSubscription): boolean {
  return subscription.status === "past_due";
}

/**
 * Verifica si la suscripción está cancelada pero aún activa
 * (cancelAtPeriodEnd = true pero currentPeriodEnd aún no llegó)
 */
export function isCanceling(subscription: UserSubscription): boolean {
  if (!subscription.cancelAtPeriodEnd) return false;
  if (!subscription.currentPeriodEnd) return false;

  return subscription.currentPeriodEnd > new Date();
}

/**
 * Verifica si la suscripción expiró
 */
export function isSubscriptionExpired(subscription: UserSubscription): boolean {
  // FREE no expira
  if (subscription.tier === "FREE") return false;

  // Si no hay fecha de fin, no expira
  if (!subscription.currentPeriodEnd) return false;

  return subscription.currentPeriodEnd < new Date();
}

/**
 * Obtiene el número de días restantes de la suscripción
 */
export function getDaysRemaining(
  subscription: UserSubscription,
): number | null {
  if (!subscription.currentPeriodEnd) return null;

  const now = new Date();
  const end = subscription.currentPeriodEnd;

  if (end < now) return 0;

  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Verifica si el usuario puede acceder a una feature basado en su suscripción
 */
export function canAccessFeature(
  subscription: UserSubscription,
  feature: keyof TierLimits,
): boolean {
  // Si la suscripción no está activa, solo puede usar FREE
  if (!isSubscriptionActive(subscription)) {
    return TIER_LIMITS.FREE[feature] === true;
  }

  return TIER_LIMITS[subscription.tier][feature] === true;
}
