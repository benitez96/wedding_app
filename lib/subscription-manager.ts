import "server-only";

import {
  SUBSCRIPTION_EVENT_TYPE,
  type SubscriptionTier,
  type SubscriptionEventType,
  type SubscriptionStatus,
} from "@/types/subscription";

// ============================================================================
// PURE BUSINESS LOGIC - No database dependencies
// ============================================================================

/**
 * Determina el tipo de evento automáticamente basado en cambios
 */
export function determineEventType(
  fromTier: SubscriptionTier,
  toTier: SubscriptionTier,
  fromStatus: SubscriptionStatus,
  toStatus: SubscriptionStatus,
): SubscriptionEventType {
  // Cambio de tier → upgrade o downgrade
  if (fromTier !== toTier) {
    const tierOrder: Record<SubscriptionTier, number> = {
      FREE: 0,
      BASIC: 1,
      COMPANY: 2,
    };
    const fromLevel = tierOrder[fromTier];
    const toLevel = tierOrder[toTier];

    return toLevel > fromLevel
      ? SUBSCRIPTION_EVENT_TYPE.UPGRADED
      : SUBSCRIPTION_EVENT_TYPE.DOWNGRADED;
  }

  // Cambio a cancelado
  if (toStatus === "canceled") {
    return SUBSCRIPTION_EVENT_TYPE.CANCELED;
  }

  // Reactivación
  if (toStatus === "active" && fromStatus === "canceled") {
    return SUBSCRIPTION_EVENT_TYPE.REACTIVATED;
  }

  // Default: renovación
  return SUBSCRIPTION_EVENT_TYPE.RENEWED;
}

/**
 * Genera un slug único basado en un base slug y un contador
 */
export function generateUniqueSlug(baseSlug: string, counter: number): string {
  if (counter === 0) {
    return baseSlug;
  }
  return `${baseSlug}-${counter}`;
}

/**
 * Valida que los datos de actualización tengan al menos un campo
 */
export function hasUpdateData(updateData: Record<string, unknown>): boolean {
  return Object.keys(updateData).length > 0;
}

// ============================================================================
// INTERFACES Y TYPES
// ============================================================================

export interface CreateSubscriptionParams {
  userId: string;
  tier: SubscriptionTier;
  status?: SubscriptionStatus;

  // Payment Provider (agnóstico)
  paymentProvider?: string; // stripe | mercadopago | paypal | etc
  paymentProviderCustomerId?: string;
  externalSubscriptionId?: string;
  externalPriceId?: string;
  externalProductId?: string;

  // Fechas (opcional)
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  trialStart?: Date;
  trialEnd?: Date;

  // Metadata
  reason?: string;
  changedBy?: string;
}

export interface UpdateSubscriptionParams {
  userId: string;
  tier?: SubscriptionTier;
  status?: SubscriptionStatus;

  // Payment Provider (agnóstico)
  paymentProvider?: string;
  paymentProviderCustomerId?: string;
  externalSubscriptionId?: string;
  externalPriceId?: string;
  externalProductId?: string;

  // Fechas
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: Date | null;

  // Metadata
  reason: string;
  changedBy?: string;
  eventType?: SubscriptionEventType;

  // Pago (opcional, para historial)
  amount?: number;
  currency?: string;
  externalInvoiceId?: string;
  externalEventId?: string;
}

export interface Subscription {
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  paymentProvider?: string | null;
  paymentProviderCustomerId?: string | null;
  externalSubscriptionId?: string | null;
  externalPriceId?: string | null;
  externalProductId?: string | null;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  trialStart?: Date | null;
  trialEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionHistoryEntry {
  userId: string;
  eventType: SubscriptionEventType;
  fromTier: SubscriptionTier | null;
  toTier: SubscriptionTier;
  fromStatus: SubscriptionStatus | null;
  toStatus: SubscriptionStatus;
  reason: string;
  changedBy: string;
  effectiveDate: Date;
  periodStart?: Date | null;
  periodEnd?: Date | null;
  amount?: number | null;
  currency?: string | null;
  externalInvoiceId?: string | null;
  externalEventId?: string | null;
}

export interface Event {
  id: string;
  name: string;
  slug: string;
  description: string;
  ownerId: string;
  activeTheme: string;
}

// ============================================================================
// DATABASE OPERATIONS - Depend on external database adapter
// ============================================================================

/**
 * Database adapter interface for subscription management
 */
export interface SubscriptionStorage {
  createSubscription(
    data: Omit<Subscription, "createdAt" | "updatedAt">,
  ): Promise<Subscription>;

  createSubscriptionHistory(data: SubscriptionHistoryEntry): Promise<void>;

  findSubscription(userId: string): Promise<Subscription | null>;

  updateSubscription(
    userId: string,
    data: Partial<Omit<Subscription, "userId" | "createdAt" | "updatedAt">>,
  ): Promise<Subscription>;

  findSubscriptionHistory(userId: string): Promise<SubscriptionHistoryEntry[]>;

  findEventBySlug(slug: string): Promise<{ slug: string } | null>;

  createEvent(data: {
    name: string;
    slug: string;
    description: string;
    ownerId: string;
    activeTheme: string;
    sections: Array<{
      key: string;
      order: number;
      isEnabled: boolean;
    }>;
  }): Promise<Event>;

  countSubscriptions(): Promise<number>;

  groupSubscriptionsByTier(): Promise<Array<{ tier: string; _count: number }>>;

  groupSubscriptionsByStatus(): Promise<
    Array<{ status: string; _count: number }>
  >;

  countRecentUpgrades(since: Date): Promise<number>;

  countRecentCancellations(since: Date): Promise<number>;
}

/**
 * Subscription manager service with dependency injection
 */
export class SubscriptionManagerService {
  constructor(private storage: SubscriptionStorage) {}

  async createSubscription(
    params: CreateSubscriptionParams,
  ): Promise<Subscription> {
    const {
      userId,
      tier,
      status = "active",
      paymentProvider,
      paymentProviderCustomerId,
      externalSubscriptionId,
      externalPriceId,
      externalProductId,
      currentPeriodStart,
      currentPeriodEnd,
      trialStart,
      trialEnd,
      reason,
      changedBy = "system",
    } = params;

    // Crear suscripción
    const subscription = await this.storage.createSubscription({
      userId,
      tier,
      status,
      paymentProvider,
      paymentProviderCustomerId,
      externalSubscriptionId,
      externalPriceId,
      externalProductId,
      currentPeriodStart,
      currentPeriodEnd,
      trialStart,
      trialEnd,
    });

    // Registrar en historial
    await this.storage.createSubscriptionHistory({
      userId,
      eventType: SUBSCRIPTION_EVENT_TYPE.CREATED,
      fromTier: null,
      toTier: tier,
      fromStatus: null,
      toStatus: status,
      reason: reason || "New subscription created",
      changedBy,
      effectiveDate: new Date(),
      periodStart: currentPeriodStart,
      periodEnd: currentPeriodEnd,
    });

    return subscription;
  }

  async updateSubscription(
    params: UpdateSubscriptionParams,
  ): Promise<Subscription> {
    const {
      userId,
      tier,
      status,
      paymentProvider,
      paymentProviderCustomerId,
      externalSubscriptionId,
      externalPriceId,
      externalProductId,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd,
      canceledAt,
      reason,
      changedBy = "system",
      eventType,
      amount,
      currency,
      externalInvoiceId,
      externalEventId,
    } = params;

    // Obtener suscripción actual
    const currentSubscription = await this.storage.findSubscription(userId);

    if (!currentSubscription) {
      throw new Error("Subscription not found");
    }

    // Preparar datos de actualización (solo campos que cambiaron)
    const updateData: Partial<
      Omit<Subscription, "userId" | "createdAt" | "updatedAt">
    > = {};
    if (tier !== undefined) updateData.tier = tier;
    if (status !== undefined) updateData.status = status;
    if (paymentProvider !== undefined)
      updateData.paymentProvider = paymentProvider;
    if (paymentProviderCustomerId !== undefined)
      updateData.paymentProviderCustomerId = paymentProviderCustomerId;
    if (externalSubscriptionId !== undefined)
      updateData.externalSubscriptionId = externalSubscriptionId;
    if (externalPriceId !== undefined)
      updateData.externalPriceId = externalPriceId;
    if (externalProductId !== undefined)
      updateData.externalProductId = externalProductId;
    if (currentPeriodStart !== undefined)
      updateData.currentPeriodStart = currentPeriodStart;
    if (currentPeriodEnd !== undefined)
      updateData.currentPeriodEnd = currentPeriodEnd;
    if (cancelAtPeriodEnd !== undefined)
      updateData.cancelAtPeriodEnd = cancelAtPeriodEnd;
    if (canceledAt !== undefined) updateData.canceledAt = canceledAt;

    // Actualizar suscripción
    const updatedSubscription = await this.storage.updateSubscription(
      userId,
      updateData,
    );

    // Determinar tipo de evento automáticamente si no se especificó
    let finalEventType =
      eventType ||
      determineEventType(
        currentSubscription.tier,
        tier || currentSubscription.tier,
        currentSubscription.status,
        status || currentSubscription.status,
      );

    // Registrar en historial
    await this.storage.createSubscriptionHistory({
      userId,
      eventType: finalEventType,
      fromTier: currentSubscription.tier,
      toTier: tier || currentSubscription.tier,
      fromStatus: currentSubscription.status,
      toStatus: status || currentSubscription.status,
      reason,
      changedBy,
      effectiveDate: new Date(),
      periodStart: currentPeriodStart || currentSubscription.currentPeriodStart,
      periodEnd: currentPeriodEnd || currentSubscription.currentPeriodEnd,
      amount,
      currency,
      externalInvoiceId,
      externalEventId,
    });

    return updatedSubscription;
  }

  async cancelSubscription(
    userId: string,
    options: {
      immediate?: boolean;
      reason: string;
      changedBy?: string;
    },
  ): Promise<Subscription> {
    const { immediate = false, reason, changedBy = "user" } = options;

    if (immediate) {
      // Cancelación inmediata
      return this.updateSubscription({
        userId,
        tier: "FREE",
        status: "canceled",
        canceledAt: new Date(),
        reason,
        changedBy,
        eventType: SUBSCRIPTION_EVENT_TYPE.CANCELED,
      });
    } else {
      // Cancelación al final del período
      return this.updateSubscription({
        userId,
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
        reason,
        changedBy,
        eventType: SUBSCRIPTION_EVENT_TYPE.CANCELED,
      });
    }
  }

  async reactivateSubscription(
    userId: string,
    options: {
      reason: string;
      changedBy?: string;
    },
  ): Promise<Subscription> {
    const { reason, changedBy = "user" } = options;

    return this.updateSubscription({
      userId,
      status: "active",
      cancelAtPeriodEnd: false,
      canceledAt: null,
      reason,
      changedBy,
      eventType: SUBSCRIPTION_EVENT_TYPE.REACTIVATED,
    });
  }

  async getUserSubscription(userId: string): Promise<Subscription | null> {
    return this.storage.findSubscription(userId);
  }

  async getSubscriptionHistory(
    userId: string,
  ): Promise<SubscriptionHistoryEntry[]> {
    return this.storage.findSubscriptionHistory(userId);
  }

  async createDefaultEventForUser(userId: string): Promise<Event> {
    const baseSlug = "mi-evento";
    let counter = 0;
    let slug = generateUniqueSlug(baseSlug, counter);

    // Buscar un slug disponible
    while (await this.storage.findEventBySlug(slug)) {
      counter++;
      slug = generateUniqueSlug(baseSlug, counter);
    }

    // Crear el evento por defecto
    const event = await this.storage.createEvent({
      name: "Mi Evento",
      slug,
      description: "Tu primer evento. ¡Personalízalo a tu gusto!",
      ownerId: userId,
      activeTheme: "classic",
      sections: [
        { key: "hero", order: 1, isEnabled: true },
        { key: "date", order: 2, isEnabled: true },
        { key: "ceremony", order: 3, isEnabled: true },
        { key: "celebration", order: 4, isEnabled: true },
        { key: "rsvp", order: 5, isEnabled: true },
      ],
    });

    return event;
  }

  async getSubscriptionStats(): Promise<{
    total: number;
    byTier: Record<string, number>;
    byStatus: Record<string, number>;
    recentUpgrades: number;
    recentCancellations: number;
  }> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      total,
      byTierArray,
      byStatusArray,
      recentUpgrades,
      recentCancellations,
    ] = await Promise.all([
      this.storage.countSubscriptions(),
      this.storage.groupSubscriptionsByTier(),
      this.storage.groupSubscriptionsByStatus(),
      this.storage.countRecentUpgrades(thirtyDaysAgo),
      this.storage.countRecentCancellations(thirtyDaysAgo),
    ]);

    return {
      total,
      byTier: byTierArray.reduce(
        (acc, item) => {
          acc[item.tier] = item._count;
          return acc;
        },
        {} as Record<string, number>,
      ),
      byStatus: byStatusArray.reduce(
        (acc, item) => {
          acc[item.status] = item._count;
          return acc;
        },
        {} as Record<string, number>,
      ),
      recentUpgrades,
      recentCancellations,
    };
  }
}
