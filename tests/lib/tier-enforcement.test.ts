/**
 * Tests for lib/tier-enforcement.ts
 *
 * CRITICAL: Only testing PURE logic (no DB)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createTierContext,
  checkLimit,
  generateGuestLimitError,
  generateEventLimitError,
  generateCollaboratorError,
  evaluateGuestEnforcement,
  evaluateEventEnforcement,
  evaluateCollaboratorEnforcement,
  TierEnforcementService,
  type TierEnforcementStorage,
  type UserTierContext,
} from "@/lib/tier-enforcement";
import { TIER_LIMITS } from "@/types/subscription";

describe("tier-enforcement - Pure Functions", () => {
  describe("createTierContext", () => {
    it("should create context for tier FREE", () => {
      const result = createTierContext("user-123", "FREE");

      expect(result).toEqual({
        userId: "user-123",
        tier: "FREE",
        limits: TIER_LIMITS.FREE,
      });
    });

    it("should create context for tier BASIC", () => {
      const result = createTierContext("user-456", "BASIC");

      expect(result).toEqual({
        userId: "user-456",
        tier: "BASIC",
        limits: TIER_LIMITS.BASIC,
      });
    });

    it("should create context for tier COMPANY", () => {
      const result = createTierContext("user-789", "COMPANY");

      expect(result).toEqual({
        userId: "user-789",
        tier: "COMPANY",
        limits: TIER_LIMITS.COMPANY,
      });
    });
  });

  describe("checkLimit", () => {
    it("should return exceeded false if not exceeding limit", () => {
      const result = checkLimit(50, 100);

      expect(result.exceeded).toBe(false);
    });

    it("should return exceeded true if limit reached", () => {
      const result = checkLimit(100, 100);

      expect(result.exceeded).toBe(true);
    });

    it("should return exceeded true if limit exceeded", () => {
      const result = checkLimit(150, 100);

      expect(result.exceeded).toBe(true);
    });

    it("should return exceeded false if limit is null (unlimited)", () => {
      const result = checkLimit(1000000, null);

      expect(result.exceeded).toBe(false);
    });

    it("should handle limit of 0", () => {
      const result = checkLimit(1, 0);

      expect(result.exceeded).toBe(true);
    });

    it("should handle current 0", () => {
      const result = checkLimit(0, 100);

      expect(result.exceeded).toBe(false);
    });
  });

  describe("generateGuestLimitError", () => {
    it("should generate message for tier FREE", () => {
      const result = generateGuestLimitError("FREE", 5);

      expect(result).toBe("El plan FREE permite hasta 5 invitados por evento");
    });

    it("should generate message for tier BASIC", () => {
      const result = generateGuestLimitError("BASIC", 50);

      expect(result).toBe(
        "El plan BASIC permite hasta 50 invitados por evento",
      );
    });

    it("should generate message for tier COMPANY", () => {
      const result = generateGuestLimitError("COMPANY", 100);

      expect(result).toBe(
        "El plan COMPANY permite hasta 100 invitados por evento",
      );
    });
  });

  describe("generateEventLimitError", () => {
    it("should generate message for 1 event", () => {
      const result = generateEventLimitError("FREE", 1);

      expect(result).toBe("El plan FREE permite hasta 1 evento(s)");
    });

    it("should generate message for multiple events", () => {
      const result = generateEventLimitError("COMPANY", 10);

      expect(result).toBe("El plan COMPANY permite hasta 10 evento(s)");
    });
  });

  describe("generateCollaboratorError", () => {
    it("should generate error message", () => {
      const result = generateCollaboratorError();

      expect(result).toBe(
        "La funcionalidad de colaboradores requiere el plan Company",
      );
    });
  });

  describe("evaluateGuestEnforcement", () => {
    it("should allow if limit is null (unlimited)", () => {
      const context: UserTierContext = {
        userId: "user-123",
        tier: "COMPANY",
        limits: { ...TIER_LIMITS.COMPANY, maxGuestsPerEvent: null },
      };

      const result = evaluateGuestEnforcement(context, 1000);

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("should allow if not exceeding limit", () => {
      const context: UserTierContext = {
        userId: "user-123",
        tier: "FREE",
        limits: TIER_LIMITS.FREE,
      };

      const result = evaluateGuestEnforcement(context, 3);

      expect(result.allowed).toBe(true);
      expect(result.current).toBe(3);
      expect(result.limit).toBe(5);
    });

    it("should deny if limit reached", () => {
      const context: UserTierContext = {
        userId: "user-123",
        tier: "FREE",
        limits: TIER_LIMITS.FREE,
      };

      const result = evaluateGuestEnforcement(context, 5);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe(
        "El plan FREE permite hasta 5 invitados por evento",
      );
      expect(result.current).toBe(5);
      expect(result.limit).toBe(5);
    });

    it("should allow unlimited for BASIC", () => {
      const context: UserTierContext = {
        userId: "user-123",
        tier: "BASIC",
        limits: TIER_LIMITS.BASIC,
      };

      const result = evaluateGuestEnforcement(context, 500);

      expect(result.allowed).toBe(true); // BASIC has unlimited guests
    });
  });

  describe("evaluateEventEnforcement", () => {
    it("should allow if limit is null (unlimited)", () => {
      const context: UserTierContext = {
        userId: "user-123",
        tier: "COMPANY",
        limits: TIER_LIMITS.COMPANY,
      };

      const result = evaluateEventEnforcement(context, 100);

      expect(result.allowed).toBe(true);
    });

    it("should allow if not exceeding limit", () => {
      const context: UserTierContext = {
        userId: "user-123",
        tier: "FREE",
        limits: TIER_LIMITS.FREE,
      };

      const result = evaluateEventEnforcement(context, 0);

      expect(result.allowed).toBe(true);
      expect(result.current).toBe(0);
      expect(result.limit).toBe(1);
    });

    it("should deny if limit reached", () => {
      const context: UserTierContext = {
        userId: "user-123",
        tier: "FREE",
        limits: TIER_LIMITS.FREE,
      };

      const result = evaluateEventEnforcement(context, 1);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("El plan FREE permite hasta 1 evento(s)");
      expect(result.current).toBe(1);
      expect(result.limit).toBe(1);
    });
  });

  describe("evaluateCollaboratorEnforcement", () => {
    it("should allow if tier has collaborators", () => {
      const context: UserTierContext = {
        userId: "user-123",
        tier: "COMPANY",
        limits: TIER_LIMITS.COMPANY,
      };

      const result = evaluateCollaboratorEnforcement(context);

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("should deny if tier does NOT have collaborators", () => {
      const context: UserTierContext = {
        userId: "user-123",
        tier: "FREE",
        limits: TIER_LIMITS.FREE,
      };

      const result = evaluateCollaboratorEnforcement(context);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe(
        "La funcionalidad de colaboradores requiere el plan Company",
      );
    });

    it("should deny BASIC as well", () => {
      const context: UserTierContext = {
        userId: "user-123",
        tier: "BASIC",
        limits: TIER_LIMITS.BASIC,
      };

      const result = evaluateCollaboratorEnforcement(context);

      expect(result.allowed).toBe(false);
    });
  });
});

describe("TierEnforcementService", () => {
  let mockStorage: TierEnforcementStorage;
  let service: TierEnforcementService;

  beforeEach(() => {
    mockStorage = {
      getUserSubscription: vi.fn(),
      countInvitations: vi.fn(),
      countEvents: vi.fn(),
    };
    service = new TierEnforcementService(mockStorage);
  });

  describe("getUserTierContext", () => {
    it("should return context with subscription tier", async () => {
      vi.mocked(mockStorage.getUserSubscription).mockResolvedValue({
        tier: "BASIC",
      });

      const result = await service.getUserTierContext("user-123");

      expect(result).toEqual({
        userId: "user-123",
        tier: "BASIC",
        limits: TIER_LIMITS.BASIC,
      });
    });

    it("should use FREE as default if no subscription", async () => {
      vi.mocked(mockStorage.getUserSubscription).mockResolvedValue(null);

      const result = await service.getUserTierContext("user-123");

      expect(result).toEqual({
        userId: "user-123",
        tier: "FREE",
        limits: TIER_LIMITS.FREE,
      });
    });
  });

  describe("enforceGuestLimit", () => {
    it("should allow if not exceeding limit", async () => {
      vi.mocked(mockStorage.getUserSubscription).mockResolvedValue({
        tier: "FREE",
      });
      vi.mocked(mockStorage.countInvitations).mockResolvedValue(3);

      const result = await service.enforceGuestLimit("user-123", "event-456");

      expect(result.allowed).toBe(true);
      expect(result.current).toBe(3);
      expect(result.limit).toBe(5);
    });

    it("should deny if limit exceeded", async () => {
      vi.mocked(mockStorage.getUserSubscription).mockResolvedValue({
        tier: "FREE",
      });
      vi.mocked(mockStorage.countInvitations).mockResolvedValue(5);

      const result = await service.enforceGuestLimit("user-123", "event-456");

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("FREE");
    });

    it("should allow unlimited for COMPANY with null limit", async () => {
      vi.mocked(mockStorage.getUserSubscription).mockResolvedValue({
        tier: "COMPANY",
      });
      vi.mocked(mockStorage.countInvitations).mockResolvedValue(10000);

      const result = await service.enforceGuestLimit("user-123", "event-456");

      expect(result.allowed).toBe(true);
    });
  });

  describe("enforceEventLimit", () => {
    it("should allow if not exceeding limit", async () => {
      vi.mocked(mockStorage.getUserSubscription).mockResolvedValue({
        tier: "FREE",
      });
      vi.mocked(mockStorage.countEvents).mockResolvedValue(0);

      const result = await service.enforceEventLimit("user-123");

      expect(result.allowed).toBe(true);
      expect(result.current).toBe(0);
      expect(result.limit).toBe(1);
    });

    it("should deny if limit reached", async () => {
      vi.mocked(mockStorage.getUserSubscription).mockResolvedValue({
        tier: "FREE",
      });
      vi.mocked(mockStorage.countEvents).mockResolvedValue(1);

      const result = await service.enforceEventLimit("user-123");

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("El plan FREE permite hasta 1 evento(s)");
    });
  });

  describe("enforceCollaboratorAccess", () => {
    it("should allow for tier COMPANY", async () => {
      vi.mocked(mockStorage.getUserSubscription).mockResolvedValue({
        tier: "COMPANY",
      });

      const result = await service.enforceCollaboratorAccess("user-123");

      expect(result.allowed).toBe(true);
    });

    it("should deny for tier FREE", async () => {
      vi.mocked(mockStorage.getUserSubscription).mockResolvedValue({
        tier: "FREE",
      });

      const result = await service.enforceCollaboratorAccess("user-123");

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Company");
    });

    it("should deny for tier BASIC", async () => {
      vi.mocked(mockStorage.getUserSubscription).mockResolvedValue({
        tier: "BASIC",
      });

      const result = await service.enforceCollaboratorAccess("user-123");

      expect(result.allowed).toBe(false);
    });
  });

  describe("getGuestUsage", () => {
    it("should return current usage and limit for FREE", async () => {
      vi.mocked(mockStorage.getUserSubscription).mockResolvedValue({
        tier: "FREE",
      });
      vi.mocked(mockStorage.countInvitations).mockResolvedValue(3);

      const result = await service.getGuestUsage("user-123", "event-456");

      expect(result).toEqual({
        current: 3,
        limit: 5,
        tier: "FREE",
      });
    });

    it("should return null for unlimited limit (BASIC)", async () => {
      vi.mocked(mockStorage.getUserSubscription).mockResolvedValue({
        tier: "BASIC",
      });
      vi.mocked(mockStorage.countInvitations).mockResolvedValue(500);

      const result = await service.getGuestUsage("user-123", "event-456");

      expect(result).toEqual({
        current: 500,
        limit: null,
        tier: "BASIC",
      });
    });

    it("should return null for unlimited limit (COMPANY)", async () => {
      vi.mocked(mockStorage.getUserSubscription).mockResolvedValue({
        tier: "COMPANY",
      });
      vi.mocked(mockStorage.countInvitations).mockResolvedValue(1000);

      const result = await service.getGuestUsage("user-123", "event-456");

      expect(result).toEqual({
        current: 1000,
        limit: null,
        tier: "COMPANY",
      });
    });
  });
});
