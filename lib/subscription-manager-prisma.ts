/**
 * Prisma implementation of SubscriptionStorage
 */

import "server-only";

import prisma from "@/lib/prisma";
import { SUBSCRIPTION_EVENT_TYPE } from "@/types/subscription";
import type {
  SubscriptionStorage,
  Subscription,
  SubscriptionHistoryEntry,
  Event,
  CreateSubscriptionParams,
  UpdateSubscriptionParams,
} from "@/lib/subscription-manager";
import { SubscriptionManagerService } from "@/lib/subscription-manager";

/**
 * Implementación de SubscriptionStorage usando Prisma
 */
export class PrismaSubscriptionStorage implements SubscriptionStorage {
  async createSubscription(
    data: Omit<Subscription, "createdAt" | "updatedAt">,
  ): Promise<Subscription> {
    return prisma.subscription.create({
      data: {
        userId: data.userId,
        tier: data.tier,
        status: data.status,
        paymentProvider: data.paymentProvider,
        paymentProviderCustomerId: data.paymentProviderCustomerId,
        externalSubscriptionId: data.externalSubscriptionId,
        externalPriceId: data.externalPriceId,
        externalProductId: data.externalProductId,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
        trialStart: data.trialStart,
        trialEnd: data.trialEnd,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd,
        canceledAt: data.canceledAt,
      },
    }) as any;
  }

  async createSubscriptionHistory(
    data: SubscriptionHistoryEntry,
  ): Promise<void> {
    await prisma.subscriptionHistory.create({
      data: {
        userId: data.userId,
        eventType: data.eventType,
        fromTier: data.fromTier,
        toTier: data.toTier,
        fromStatus: data.fromStatus,
        toStatus: data.toStatus,
        reason: data.reason,
        changedBy: data.changedBy,
        effectiveDate: data.effectiveDate,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        amount: data.amount,
        currency: data.currency,
        externalInvoiceId: data.externalInvoiceId,
        externalEventId: data.externalEventId,
      },
    });
  }

  async findSubscription(userId: string): Promise<Subscription | null> {
    return prisma.subscription.findUnique({
      where: { userId },
    }) as any;
  }

  async updateSubscription(
    userId: string,
    data: Partial<Omit<Subscription, "userId" | "createdAt" | "updatedAt">>,
  ): Promise<Subscription> {
    return prisma.subscription.update({
      where: { userId },
      data,
    }) as any;
  }

  async findSubscriptionHistory(
    userId: string,
  ): Promise<SubscriptionHistoryEntry[]> {
    return prisma.subscriptionHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }) as any;
  }

  async findEventBySlug(slug: string): Promise<{ slug: string } | null> {
    return prisma.event.findUnique({
      where: { slug },
      select: { slug: true },
    });
  }

  async createEvent(data: {
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
  }): Promise<Event> {
    return prisma.event.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        ownerId: data.ownerId,
        activeTheme: data.activeTheme,
        sections: {
          create: data.sections,
        },
      },
      include: {
        sections: true,
      },
    }) as any;
  }

  async countSubscriptions(): Promise<number> {
    return prisma.subscription.count();
  }

  async groupSubscriptionsByTier(): Promise<
    Array<{ tier: string; _count: number }>
  > {
    const result = await prisma.subscription.groupBy({
      by: ["tier"],
      _count: true,
    });
    return result.map((item) => ({
      tier: item.tier,
      _count: item._count,
    }));
  }

  async groupSubscriptionsByStatus(): Promise<
    Array<{ status: string; _count: number }>
  > {
    const result = await prisma.subscription.groupBy({
      by: ["status"],
      _count: true,
    });
    return result.map((item) => ({
      status: item.status,
      _count: item._count,
    }));
  }

  async countRecentUpgrades(since: Date): Promise<number> {
    return prisma.subscriptionHistory.count({
      where: {
        eventType: SUBSCRIPTION_EVENT_TYPE.UPGRADED,
        createdAt: {
          gte: since,
        },
      },
    });
  }

  async countRecentCancellations(since: Date): Promise<number> {
    return prisma.subscriptionHistory.count({
      where: {
        eventType: SUBSCRIPTION_EVENT_TYPE.CANCELED,
        createdAt: {
          gte: since,
        },
      },
    });
  }
}

/**
 * Singleton instance del service con Prisma storage
 */
const prismaStorage = new PrismaSubscriptionStorage();
export const subscriptionManagerService = new SubscriptionManagerService(
  prismaStorage,
);

// Re-export service methods para backward compatibility
export async function createSubscription(
  params: CreateSubscriptionParams,
): Promise<Subscription> {
  return subscriptionManagerService.createSubscription(params);
}

export async function updateSubscription(
  params: UpdateSubscriptionParams,
): Promise<Subscription> {
  return subscriptionManagerService.updateSubscription(params);
}

export async function cancelSubscription(
  userId: string,
  options: {
    immediate?: boolean;
    reason: string;
    changedBy?: string;
  },
): Promise<Subscription> {
  return subscriptionManagerService.cancelSubscription(userId, options);
}

export async function reactivateSubscription(
  userId: string,
  options: {
    reason: string;
    changedBy?: string;
  },
): Promise<Subscription> {
  return subscriptionManagerService.reactivateSubscription(userId, options);
}

export async function getUserSubscription(
  userId: string,
): Promise<Subscription | null> {
  return subscriptionManagerService.getUserSubscription(userId);
}

export async function getSubscriptionHistory(
  userId: string,
): Promise<SubscriptionHistoryEntry[]> {
  return subscriptionManagerService.getSubscriptionHistory(userId);
}

export async function createDefaultEventForUser(
  userId: string,
): Promise<Event> {
  return subscriptionManagerService.createDefaultEventForUser(userId);
}

export async function getSubscriptionStats(): Promise<{
  total: number;
  byTier: Record<string, number>;
  byStatus: Record<string, number>;
  recentUpgrades: number;
  recentCancellations: number;
}> {
  return subscriptionManagerService.getSubscriptionStats();
}
