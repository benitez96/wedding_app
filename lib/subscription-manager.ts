import "server-only";

import prisma from "@/lib/prisma";
import {
  SUBSCRIPTION_EVENT_TYPE,
  type SubscriptionTier,
  type SubscriptionEventType,
} from "@/types/subscription";

/**
 * Gestión de suscripciones con auditoría automática
 *
 * TODAS las operaciones que modifiquen suscripciones DEBEN pasar por aquí
 * para garantizar que se registre en el historial
 */

interface CreateSubscriptionParams {
  userId: string;
  tier: SubscriptionTier;
  status?: string;

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

/**
 * Crea una nueva suscripción y registra en el historial
 */
export async function createSubscription(params: CreateSubscriptionParams) {
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
  const subscription = await prisma.subscription.create({
    data: {
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
    },
  });

  // Registrar en historial
  await prisma.subscriptionHistory.create({
    data: {
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
    },
  });

  return subscription;
}

interface UpdateSubscriptionParams {
  userId: string;
  tier?: SubscriptionTier;
  status?: string;

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

/**
 * Actualiza una suscripción existente y registra en el historial
 */
export async function updateSubscription(params: UpdateSubscriptionParams) {
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
  const currentSubscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!currentSubscription) {
    throw new Error("Subscription not found");
  }

  // Preparar datos de actualización (solo campos que cambiaron)
  const updateData: Record<string, unknown> = {};
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
  const updatedSubscription = await prisma.subscription.update({
    where: { userId },
    data: updateData,
  });

  // Determinar tipo de evento automáticamente si no se especificó
  let finalEventType = eventType;
  if (!finalEventType) {
    if (tier && tier !== currentSubscription.tier) {
      // Cambio de tier → upgrade o downgrade
      const tierOrder = { FREE: 0, BASIC: 1, COMPANY: 2 };
      const currentTierLevel =
        tierOrder[currentSubscription.tier as keyof typeof tierOrder];
      const newTierLevel = tierOrder[tier as keyof typeof tierOrder];

      finalEventType =
        newTierLevel > currentTierLevel
          ? SUBSCRIPTION_EVENT_TYPE.UPGRADED
          : SUBSCRIPTION_EVENT_TYPE.DOWNGRADED;
    } else if (status === "canceled") {
      finalEventType = SUBSCRIPTION_EVENT_TYPE.CANCELED;
    } else if (
      status === "active" &&
      currentSubscription.status === "canceled"
    ) {
      finalEventType = SUBSCRIPTION_EVENT_TYPE.REACTIVATED;
    } else {
      // Default: renovación
      finalEventType = SUBSCRIPTION_EVENT_TYPE.RENEWED;
    }
  }

  // Registrar en historial
  await prisma.subscriptionHistory.create({
    data: {
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
    },
  });

  return updatedSubscription;
}

/**
 * Cancela una suscripción
 */
export async function cancelSubscription(
  userId: string,
  options: {
    immediate?: boolean; // Si es true, cancela inmediatamente. Si es false, cancela al final del período
    reason: string;
    changedBy?: string;
  },
) {
  const { immediate = false, reason, changedBy = "user" } = options;

  if (immediate) {
    // Cancelación inmediata
    return updateSubscription({
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
    return updateSubscription({
      userId,
      cancelAtPeriodEnd: true,
      canceledAt: new Date(),
      reason,
      changedBy,
      eventType: SUBSCRIPTION_EVENT_TYPE.CANCELED,
    });
  }
}

/**
 * Reactiva una suscripción cancelada
 */
export async function reactivateSubscription(
  userId: string,
  options: {
    reason: string;
    changedBy?: string;
  },
) {
  const { reason, changedBy = "user" } = options;

  return updateSubscription({
    userId,
    status: "active",
    cancelAtPeriodEnd: false,
    canceledAt: null,
    reason,
    changedBy,
    eventType: SUBSCRIPTION_EVENT_TYPE.REACTIVATED,
  });
}

/**
 * Obtiene la suscripción actual de un usuario
 */
export async function getUserSubscription(userId: string) {
  return prisma.subscription.findUnique({
    where: { userId },
  });
}

/**
 * Obtiene el historial completo de suscripciones de un usuario
 */
export async function getSubscriptionHistory(userId: string) {
  return prisma.subscriptionHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Crea el evento por defecto para un usuario nuevo (tier FREE)
 * Se llama automáticamente cuando un usuario se registra
 */
export async function createDefaultEventForUser(userId: string) {
  // Generar un slug único basado en el usuario
  const baseSlug = "mi-evento";
  let slug = baseSlug;
  let counter = 1;

  // Buscar un slug disponible
  while (
    await prisma.event.findUnique({
      where: { slug },
    })
  ) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  // Crear el evento por defecto
  const event = await prisma.event.create({
    data: {
      name: "Mi Evento",
      slug,
      description: "Tu primer evento. ¡Personalízalo a tu gusto!",
      ownerId: userId,
      activeTheme: "classic",
      // Crear configuración de secciones por defecto
      sections: {
        create: [
          {
            key: "hero",
            order: 1,
            isEnabled: true,
          },
          {
            key: "date",
            order: 2,
            isEnabled: true,
          },
          {
            key: "ceremony",
            order: 3,
            isEnabled: true,
          },
          {
            key: "celebration",
            order: 4,
            isEnabled: true,
          },
          {
            key: "rsvp",
            order: 5,
            isEnabled: true,
          },
        ],
      },
    },
    include: {
      sections: true,
    },
  });

  return event;
}

/**
 * Obtiene estadísticas de suscripciones (para admin/analytics)
 */
export async function getSubscriptionStats() {
  const [total, byTier, byStatus, recentUpgrades, recentCancellations] =
    await Promise.all([
      // Total de suscripciones activas
      prisma.subscription.count(),

      // Por tier
      prisma.subscription.groupBy({
        by: ["tier"],
        _count: true,
      }),

      // Por status
      prisma.subscription.groupBy({
        by: ["status"],
        _count: true,
      }),

      // Upgrades recientes (últimos 30 días)
      prisma.subscriptionHistory.count({
        where: {
          eventType: SUBSCRIPTION_EVENT_TYPE.UPGRADED,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Cancelaciones recientes (últimos 30 días)
      prisma.subscriptionHistory.count({
        where: {
          eventType: SUBSCRIPTION_EVENT_TYPE.CANCELED,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

  return {
    total,
    byTier: byTier.reduce(
      (acc, item) => {
        acc[item.tier] = item._count;
        return acc;
      },
      {} as Record<string, number>,
    ),
    byStatus: byStatus.reduce(
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
