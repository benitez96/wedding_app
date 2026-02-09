/**
 * Tests for lib/subscription-manager.ts
 *
 * CRITICAL: Only testing PURE logic (no DB)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  determineEventType,
  generateUniqueSlug,
  hasUpdateData,
  SubscriptionManagerService,
  type SubscriptionStorage,
  type Subscription,
  type SubscriptionHistoryEntry,
} from "@/lib/subscription-manager";
import { SUBSCRIPTION_EVENT_TYPE } from "@/types/subscription";

describe("subscription-manager - Pure Functions", () => {
  describe("determineEventType", () => {
    it("should return UPGRADED when tier increases", () => {
      const result = determineEventType("FREE", "BASIC", "active", "active");

      expect(result).toBe(SUBSCRIPTION_EVENT_TYPE.UPGRADED);
    });

    it("should return UPGRADED from BASIC to COMPANY", () => {
      const result = determineEventType("BASIC", "COMPANY", "active", "active");

      expect(result).toBe(SUBSCRIPTION_EVENT_TYPE.UPGRADED);
    });

    it("should return UPGRADED from FREE to COMPANY", () => {
      const result = determineEventType("FREE", "COMPANY", "active", "active");

      expect(result).toBe(SUBSCRIPTION_EVENT_TYPE.UPGRADED);
    });

    it("should return DOWNGRADED when tier decreases", () => {
      const result = determineEventType("BASIC", "FREE", "active", "active");

      expect(result).toBe(SUBSCRIPTION_EVENT_TYPE.DOWNGRADED);
    });

    it("should return DOWNGRADED from COMPANY to BASIC", () => {
      const result = determineEventType("COMPANY", "BASIC", "active", "active");

      expect(result).toBe(SUBSCRIPTION_EVENT_TYPE.DOWNGRADED);
    });

    it("should return DOWNGRADED from COMPANY to FREE", () => {
      const result = determineEventType("COMPANY", "FREE", "active", "active");

      expect(result).toBe(SUBSCRIPTION_EVENT_TYPE.DOWNGRADED);
    });

    it("should return CANCELED when status changes to canceled", () => {
      const result = determineEventType("FREE", "FREE", "active", "canceled");

      expect(result).toBe(SUBSCRIPTION_EVENT_TYPE.CANCELED);
    });

    it("should prioritize tier change over status change", () => {
      const result = determineEventType("FREE", "BASIC", "active", "canceled");

      expect(result).toBe(SUBSCRIPTION_EVENT_TYPE.UPGRADED);
    });

    it("should return REACTIVATED when status changes from canceled to active", () => {
      const result = determineEventType("FREE", "FREE", "canceled", "active");

      expect(result).toBe(SUBSCRIPTION_EVENT_TYPE.REACTIVATED);
    });

    it("should return RENEWED as default when tier and status unchanged", () => {
      const result = determineEventType("FREE", "FREE", "active", "active");

      expect(result).toBe(SUBSCRIPTION_EVENT_TYPE.RENEWED);
    });

    it("should return RENEWED when status changes but not tier or canceled", () => {
      const result = determineEventType("FREE", "FREE", "past_due", "active");

      expect(result).toBe(SUBSCRIPTION_EVENT_TYPE.RENEWED);
    });
  });

  describe("generateUniqueSlug", () => {
    it("should return base slug when counter is 0", () => {
      const result = generateUniqueSlug("mi-evento", 0);

      expect(result).toBe("mi-evento");
    });

    it("should append counter when counter > 0", () => {
      const result = generateUniqueSlug("mi-evento", 1);

      expect(result).toBe("mi-evento-1");
    });

    it("should handle larger counters", () => {
      const result = generateUniqueSlug("mi-evento", 42);

      expect(result).toBe("mi-evento-42");
    });

    it("should handle different base slugs", () => {
      const result1 = generateUniqueSlug("wedding", 3);
      const result2 = generateUniqueSlug("birthday-party", 5);

      expect(result1).toBe("wedding-3");
      expect(result2).toBe("birthday-party-5");
    });
  });

  describe("hasUpdateData", () => {
    it("should return true if object has keys", () => {
      const result = hasUpdateData({ tier: "BASIC" });

      expect(result).toBe(true);
    });

    it("should return false if object is empty", () => {
      const result = hasUpdateData({});

      expect(result).toBe(false);
    });

    it("should return true for multiple keys", () => {
      const result = hasUpdateData({
        tier: "BASIC",
        status: "active",
        reason: "upgrade",
      });

      expect(result).toBe(true);
    });

    it("should count undefined values as keys", () => {
      const result = hasUpdateData({ tier: undefined });

      expect(result).toBe(true);
    });
  });
});

describe("SubscriptionManagerService", () => {
  let mockStorage: SubscriptionStorage;
  let service: SubscriptionManagerService;

  const mockSubscription: Subscription = {
    userId: "user-123",
    tier: "FREE",
    status: "active",
    paymentProvider: null,
    paymentProviderCustomerId: null,
    externalSubscriptionId: null,
    externalPriceId: null,
    externalProductId: null,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    trialStart: null,
    trialEnd: null,
    cancelAtPeriodEnd: false,
    canceledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockStorage = {
      createSubscription: vi.fn(),
      createSubscriptionHistory: vi.fn(),
      findSubscription: vi.fn(),
      updateSubscription: vi.fn(),
      findSubscriptionHistory: vi.fn(),
      findEventBySlug: vi.fn(),
      createEvent: vi.fn(),
      countSubscriptions: vi.fn(),
      groupSubscriptionsByTier: vi.fn(),
      groupSubscriptionsByStatus: vi.fn(),
      countRecentUpgrades: vi.fn(),
      countRecentCancellations: vi.fn(),
    };
    service = new SubscriptionManagerService(mockStorage);
  });

  describe("createSubscription", () => {
    it("should create subscription with default status active", async () => {
      vi.mocked(mockStorage.createSubscription).mockResolvedValue(
        mockSubscription,
      );
      vi.mocked(mockStorage.createSubscriptionHistory).mockResolvedValue();

      const result = await service.createSubscription({
        userId: "user-123",
        tier: "FREE",
      });

      expect(result).toEqual(mockSubscription);
      expect(mockStorage.createSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-123",
          tier: "FREE",
          status: "active",
        }),
      );
    });

    it("should create subscription history with CREATED event type", async () => {
      vi.mocked(mockStorage.createSubscription).mockResolvedValue(
        mockSubscription,
      );
      vi.mocked(mockStorage.createSubscriptionHistory).mockResolvedValue();

      await service.createSubscription({
        userId: "user-123",
        tier: "BASIC",
        reason: "User upgraded",
      });

      expect(mockStorage.createSubscriptionHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: SUBSCRIPTION_EVENT_TYPE.CREATED,
          fromTier: null,
          toTier: "BASIC",
          fromStatus: null,
          toStatus: "active",
          reason: "User upgraded",
        }),
      );
    });

    it("should use default reason if not provided", async () => {
      vi.mocked(mockStorage.createSubscription).mockResolvedValue(
        mockSubscription,
      );
      vi.mocked(mockStorage.createSubscriptionHistory).mockResolvedValue();

      await service.createSubscription({
        userId: "user-123",
        tier: "FREE",
      });

      expect(mockStorage.createSubscriptionHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: "New subscription created",
        }),
      );
    });

    it("should pass payment provider data", async () => {
      vi.mocked(mockStorage.createSubscription).mockResolvedValue(
        mockSubscription,
      );
      vi.mocked(mockStorage.createSubscriptionHistory).mockResolvedValue();

      await service.createSubscription({
        userId: "user-123",
        tier: "BASIC",
        paymentProvider: "stripe",
        paymentProviderCustomerId: "cus_123",
        externalSubscriptionId: "sub_123",
      });

      expect(mockStorage.createSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentProvider: "stripe",
          paymentProviderCustomerId: "cus_123",
          externalSubscriptionId: "sub_123",
        }),
      );
    });
  });

  describe("updateSubscription", () => {
    it("should throw error if subscription not found", async () => {
      vi.mocked(mockStorage.findSubscription).mockResolvedValue(null);

      await expect(
        service.updateSubscription({
          userId: "user-123",
          reason: "upgrade",
        }),
      ).rejects.toThrow("Subscription not found");
    });

    it("should update subscription tier", async () => {
      vi.mocked(mockStorage.findSubscription).mockResolvedValue(
        mockSubscription,
      );
      vi.mocked(mockStorage.updateSubscription).mockResolvedValue({
        ...mockSubscription,
        tier: "BASIC",
      });
      vi.mocked(mockStorage.createSubscriptionHistory).mockResolvedValue();

      const result = await service.updateSubscription({
        userId: "user-123",
        tier: "BASIC",
        reason: "User upgraded",
      });

      expect(result.tier).toBe("BASIC");
      expect(mockStorage.updateSubscription).toHaveBeenCalledWith(
        "user-123",
        expect.objectContaining({ tier: "BASIC" }),
      );
    });

    it("should automatically determine event type as UPGRADED", async () => {
      vi.mocked(mockStorage.findSubscription).mockResolvedValue(
        mockSubscription,
      );
      vi.mocked(mockStorage.updateSubscription).mockResolvedValue({
        ...mockSubscription,
        tier: "BASIC",
      });
      vi.mocked(mockStorage.createSubscriptionHistory).mockResolvedValue();

      await service.updateSubscription({
        userId: "user-123",
        tier: "BASIC",
        reason: "User upgraded",
      });

      expect(mockStorage.createSubscriptionHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: SUBSCRIPTION_EVENT_TYPE.UPGRADED,
          fromTier: "FREE",
          toTier: "BASIC",
        }),
      );
    });

    it("should respect explicit eventType if provided", async () => {
      vi.mocked(mockStorage.findSubscription).mockResolvedValue(
        mockSubscription,
      );
      vi.mocked(mockStorage.updateSubscription).mockResolvedValue(
        mockSubscription,
      );
      vi.mocked(mockStorage.createSubscriptionHistory).mockResolvedValue();

      await service.updateSubscription({
        userId: "user-123",
        reason: "Manual renewal",
        eventType: SUBSCRIPTION_EVENT_TYPE.RENEWED,
      });

      expect(mockStorage.createSubscriptionHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: SUBSCRIPTION_EVENT_TYPE.RENEWED,
        }),
      );
    });

    it("should only update changed fields", async () => {
      vi.mocked(mockStorage.findSubscription).mockResolvedValue(
        mockSubscription,
      );
      vi.mocked(mockStorage.updateSubscription).mockResolvedValue(
        mockSubscription,
      );
      vi.mocked(mockStorage.createSubscriptionHistory).mockResolvedValue();

      await service.updateSubscription({
        userId: "user-123",
        tier: "BASIC",
        reason: "upgrade",
      });

      expect(mockStorage.updateSubscription).toHaveBeenCalledWith(
        "user-123",
        expect.objectContaining({ tier: "BASIC" }),
      );
      expect(mockStorage.updateSubscription).toHaveBeenCalledWith(
        "user-123",
        expect.not.objectContaining({ status: expect.anything() }),
      );
    });
  });

  describe("cancelSubscription", () => {
    it("should cancel immediately if immediate = true", async () => {
      vi.mocked(mockStorage.findSubscription).mockResolvedValue(
        mockSubscription,
      );
      vi.mocked(mockStorage.updateSubscription).mockResolvedValue({
        ...mockSubscription,
        tier: "FREE",
        status: "canceled",
      });
      vi.mocked(mockStorage.createSubscriptionHistory).mockResolvedValue();

      const result = await service.cancelSubscription("user-123", {
        immediate: true,
        reason: "User requested cancellation",
      });

      expect(result.tier).toBe("FREE");
      expect(result.status).toBe("canceled");
      expect(mockStorage.updateSubscription).toHaveBeenCalledWith(
        "user-123",
        expect.objectContaining({
          tier: "FREE",
          status: "canceled",
        }),
      );
    });

    it("should set cancelAtPeriodEnd if immediate = false", async () => {
      vi.mocked(mockStorage.findSubscription).mockResolvedValue(
        mockSubscription,
      );
      vi.mocked(mockStorage.updateSubscription).mockResolvedValue({
        ...mockSubscription,
        cancelAtPeriodEnd: true,
      });
      vi.mocked(mockStorage.createSubscriptionHistory).mockResolvedValue();

      await service.cancelSubscription("user-123", {
        immediate: false,
        reason: "Cancel at period end",
      });

      expect(mockStorage.updateSubscription).toHaveBeenCalledWith(
        "user-123",
        expect.objectContaining({
          cancelAtPeriodEnd: true,
        }),
      );
      expect(mockStorage.updateSubscription).toHaveBeenCalledWith(
        "user-123",
        expect.not.objectContaining({ tier: "FREE" }),
      );
    });

    it("should default to immediate = false", async () => {
      vi.mocked(mockStorage.findSubscription).mockResolvedValue(
        mockSubscription,
      );
      vi.mocked(mockStorage.updateSubscription).mockResolvedValue(
        mockSubscription,
      );
      vi.mocked(mockStorage.createSubscriptionHistory).mockResolvedValue();

      await service.cancelSubscription("user-123", {
        reason: "Cancel",
      });

      expect(mockStorage.updateSubscription).toHaveBeenCalledWith(
        "user-123",
        expect.objectContaining({
          cancelAtPeriodEnd: true,
        }),
      );
    });
  });

  describe("reactivateSubscription", () => {
    it("should set status to active and clear cancel flags", async () => {
      vi.mocked(mockStorage.findSubscription).mockResolvedValue({
        ...mockSubscription,
        status: "canceled",
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
      });
      vi.mocked(mockStorage.updateSubscription).mockResolvedValue({
        ...mockSubscription,
        status: "active",
        cancelAtPeriodEnd: false,
        canceledAt: null,
      });
      vi.mocked(mockStorage.createSubscriptionHistory).mockResolvedValue();

      const result = await service.reactivateSubscription("user-123", {
        reason: "User reactivated",
      });

      expect(result.status).toBe("active");
      expect(result.cancelAtPeriodEnd).toBe(false);
      expect(result.canceledAt).toBe(null);
    });

    it("should create history with REACTIVATED event type", async () => {
      vi.mocked(mockStorage.findSubscription).mockResolvedValue(
        mockSubscription,
      );
      vi.mocked(mockStorage.updateSubscription).mockResolvedValue(
        mockSubscription,
      );
      vi.mocked(mockStorage.createSubscriptionHistory).mockResolvedValue();

      await service.reactivateSubscription("user-123", {
        reason: "User reactivated",
      });

      expect(mockStorage.createSubscriptionHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: SUBSCRIPTION_EVENT_TYPE.REACTIVATED,
        }),
      );
    });
  });

  describe("getUserSubscription", () => {
    it("should return subscription from storage", async () => {
      vi.mocked(mockStorage.findSubscription).mockResolvedValue(
        mockSubscription,
      );

      const result = await service.getUserSubscription("user-123");

      expect(result).toEqual(mockSubscription);
      expect(mockStorage.findSubscription).toHaveBeenCalledWith("user-123");
    });

    it("should return null if no subscription", async () => {
      vi.mocked(mockStorage.findSubscription).mockResolvedValue(null);

      const result = await service.getUserSubscription("user-123");

      expect(result).toBe(null);
    });
  });

  describe("getSubscriptionHistory", () => {
    it("should return history from storage", async () => {
      const mockHistory: SubscriptionHistoryEntry[] = [
        {
          userId: "user-123",
          eventType: SUBSCRIPTION_EVENT_TYPE.CREATED,
          fromTier: null,
          toTier: "FREE",
          fromStatus: null,
          toStatus: "active",
          reason: "Initial subscription",
          changedBy: "system",
          effectiveDate: new Date(),
        },
      ];

      vi.mocked(mockStorage.findSubscriptionHistory).mockResolvedValue(
        mockHistory,
      );

      const result = await service.getSubscriptionHistory("user-123");

      expect(result).toEqual(mockHistory);
      expect(mockStorage.findSubscriptionHistory).toHaveBeenCalledWith(
        "user-123",
      );
    });
  });

  describe("createDefaultEventForUser", () => {
    it("should create event with base slug if available", async () => {
      vi.mocked(mockStorage.findEventBySlug).mockResolvedValue(null);
      vi.mocked(mockStorage.createEvent).mockResolvedValue({
        id: "event-1",
        name: "Mi Evento",
        slug: "mi-evento",
        description: "Tu primer evento. ¡Personalízalo a tu gusto!",
        ownerId: "user-123",
        activeTheme: "classic",
      });

      const result = await service.createDefaultEventForUser("user-123");

      expect(result.slug).toBe("mi-evento");
      expect(mockStorage.findEventBySlug).toHaveBeenCalledWith("mi-evento");
    });

    it("should increment slug if base slug is taken", async () => {
      vi.mocked(mockStorage.findEventBySlug)
        .mockResolvedValueOnce({ slug: "mi-evento" })
        .mockResolvedValueOnce(null);
      vi.mocked(mockStorage.createEvent).mockResolvedValue({
        id: "event-1",
        name: "Mi Evento",
        slug: "mi-evento-1",
        description: "Tu primer evento. ¡Personalízalo a tu gusto!",
        ownerId: "user-123",
        activeTheme: "classic",
      });

      const result = await service.createDefaultEventForUser("user-123");

      expect(result.slug).toBe("mi-evento-1");
      expect(mockStorage.findEventBySlug).toHaveBeenCalledTimes(2);
    });

    it("should create event with default sections", async () => {
      vi.mocked(mockStorage.findEventBySlug).mockResolvedValue(null);
      vi.mocked(mockStorage.createEvent).mockResolvedValue({
        id: "event-1",
        name: "Mi Evento",
        slug: "mi-evento",
        description: "Tu primer evento. ¡Personalízalo a tu gusto!",
        ownerId: "user-123",
        activeTheme: "classic",
      });

      await service.createDefaultEventForUser("user-123");

      expect(mockStorage.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          sections: [
            { key: "hero", order: 1, isEnabled: true },
            { key: "date", order: 2, isEnabled: true },
            { key: "ceremony", order: 3, isEnabled: true },
            { key: "celebration", order: 4, isEnabled: true },
            { key: "rsvp", order: 5, isEnabled: true },
          ],
        }),
      );
    });
  });

  describe("getSubscriptionStats", () => {
    it("should aggregate stats from storage", async () => {
      vi.mocked(mockStorage.countSubscriptions).mockResolvedValue(100);
      vi.mocked(mockStorage.groupSubscriptionsByTier).mockResolvedValue([
        { tier: "FREE", _count: 70 },
        { tier: "BASIC", _count: 20 },
        { tier: "COMPANY", _count: 10 },
      ]);
      vi.mocked(mockStorage.groupSubscriptionsByStatus).mockResolvedValue([
        { status: "active", _count: 80 },
        { status: "canceled", _count: 20 },
      ]);
      vi.mocked(mockStorage.countRecentUpgrades).mockResolvedValue(15);
      vi.mocked(mockStorage.countRecentCancellations).mockResolvedValue(5);

      const result = await service.getSubscriptionStats();

      expect(result).toEqual({
        total: 100,
        byTier: {
          FREE: 70,
          BASIC: 20,
          COMPANY: 10,
        },
        byStatus: {
          active: 80,
          canceled: 20,
        },
        recentUpgrades: 15,
        recentCancellations: 5,
      });
    });

    it("should call all storage methods in parallel", async () => {
      vi.mocked(mockStorage.countSubscriptions).mockResolvedValue(0);
      vi.mocked(mockStorage.groupSubscriptionsByTier).mockResolvedValue([]);
      vi.mocked(mockStorage.groupSubscriptionsByStatus).mockResolvedValue([]);
      vi.mocked(mockStorage.countRecentUpgrades).mockResolvedValue(0);
      vi.mocked(mockStorage.countRecentCancellations).mockResolvedValue(0);

      await service.getSubscriptionStats();

      expect(mockStorage.countSubscriptions).toHaveBeenCalled();
      expect(mockStorage.groupSubscriptionsByTier).toHaveBeenCalled();
      expect(mockStorage.groupSubscriptionsByStatus).toHaveBeenCalled();
      expect(mockStorage.countRecentUpgrades).toHaveBeenCalled();
      expect(mockStorage.countRecentCancellations).toHaveBeenCalled();
    });
  });
});
