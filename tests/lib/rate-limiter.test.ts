/**
 * Tests for lib/rate-limiter.ts
 *
 * CRITICAL: Only testing PURE logic (no DB)
 * Prisma adapter is tested separately or with integration tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  RATE_LIMIT_CONFIGS,
  isWithinWindow,
  calculateRemainingAttempts,
  shouldBlock,
  calculateBlockedUntil,
  calculateWindowStart,
  generateBlockReason,
  calculateHoneypotBlockDuration,
  generateHoneypotReason,
  RateLimiterService,
  type RateLimitStorage,
} from "@/lib/rate-limiter";

describe("rate-limiter - Pure Functions", () => {
  describe("isWithinWindow", () => {
    it("should return true if attempt is within window", () => {
      const now = new Date("2024-01-01T12:00:00Z");
      const attemptDate = new Date("2024-01-01T11:50:00Z"); // 10 min ago
      const windowMs = 15 * 60 * 1000; // 15 minutes

      expect(isWithinWindow(attemptDate, now, windowMs)).toBe(true);
    });

    it("should return false if attempt is outside window", () => {
      const now = new Date("2024-01-01T12:00:00Z");
      const attemptDate = new Date("2024-01-01T11:30:00Z"); // 30 min ago
      const windowMs = 15 * 60 * 1000; // 15 minutes

      expect(isWithinWindow(attemptDate, now, windowMs)).toBe(false);
    });

    it("should return false if attempt is exactly at limit", () => {
      const now = new Date("2024-01-01T12:00:00Z");
      const attemptDate = new Date("2024-01-01T11:45:00Z"); // Exactly 15 min
      const windowMs = 15 * 60 * 1000;

      expect(isWithinWindow(attemptDate, now, windowMs)).toBe(false);
    });

    it("should return true if attempt is at same moment", () => {
      const now = new Date("2024-01-01T12:00:00Z");
      const attemptDate = new Date("2024-01-01T12:00:00Z");
      const windowMs = 15 * 60 * 1000;

      expect(isWithinWindow(attemptDate, now, windowMs)).toBe(true);
    });
  });

  describe("calculateRemainingAttempts", () => {
    it("should calculate remaining attempts correctly", () => {
      expect(calculateRemainingAttempts(3, 10)).toBe(7);
    });

    it("should return 0 if no attempts remaining", () => {
      expect(calculateRemainingAttempts(10, 10)).toBe(0);
    });

    it("should return 0 if limit exceeded", () => {
      expect(calculateRemainingAttempts(12, 10)).toBe(0);
    });

    it("should return max if no attempts made", () => {
      expect(calculateRemainingAttempts(0, 10)).toBe(10);
    });

    it("should handle small limits", () => {
      expect(calculateRemainingAttempts(1, 1)).toBe(0);
    });
  });

  describe("shouldBlock", () => {
    it("should return true if limit reached", () => {
      expect(shouldBlock(10, 10)).toBe(true);
    });

    it("should return true if limit exceeded", () => {
      expect(shouldBlock(12, 10)).toBe(true);
    });

    it("should return false if limit not reached", () => {
      expect(shouldBlock(9, 10)).toBe(false);
    });

    it("should return false if no attempts", () => {
      expect(shouldBlock(0, 10)).toBe(false);
    });

    it("should handle limit of 1 attempt", () => {
      expect(shouldBlock(1, 1)).toBe(true);
      expect(shouldBlock(0, 1)).toBe(false);
    });
  });

  describe("calculateBlockedUntil", () => {
    it("should calculate block date correctly", () => {
      const now = new Date("2024-01-01T12:00:00Z");
      const blockDurationMs = 24 * 60 * 60 * 1000; // 24 hours

      const result = calculateBlockedUntil(now, blockDurationMs);

      expect(result).toEqual(new Date("2024-01-02T12:00:00Z"));
    });

    it("should handle short durations", () => {
      const now = new Date("2024-01-01T12:00:00Z");
      const blockDurationMs = 60 * 1000; // 1 minute

      const result = calculateBlockedUntil(now, blockDurationMs);

      expect(result).toEqual(new Date("2024-01-01T12:01:00Z"));
    });

    it("should handle long durations", () => {
      const now = new Date("2024-01-01T12:00:00Z");
      const blockDurationMs = 7 * 24 * 60 * 60 * 1000; // 7 days

      const result = calculateBlockedUntil(now, blockDurationMs);

      expect(result).toEqual(new Date("2024-01-08T12:00:00Z"));
    });
  });

  describe("calculateWindowStart", () => {
    it("should calculate window start correctly", () => {
      const now = new Date("2024-01-01T12:00:00Z");
      const windowMs = 15 * 60 * 1000; // 15 minutes

      const result = calculateWindowStart(now, windowMs);

      expect(result).toEqual(new Date("2024-01-01T11:45:00Z"));
    });

    it("should handle 1 hour windows", () => {
      const now = new Date("2024-01-01T12:00:00Z");
      const windowMs = 60 * 60 * 1000; // 1 hour

      const result = calculateWindowStart(now, windowMs);

      expect(result).toEqual(new Date("2024-01-01T11:00:00Z"));
    });

    it("should handle very short windows", () => {
      const now = new Date("2024-01-01T12:00:00Z");
      const windowMs = 1000; // 1 second

      const result = calculateWindowStart(now, windowMs);

      expect(result).toEqual(new Date("2024-01-01T11:59:59Z"));
    });
  });

  describe("generateBlockReason", () => {
    it("should generate block message with correct minutes", () => {
      const maxAttempts = 10;
      const windowMs = 15 * 60 * 1000; // 15 minutes

      const result = generateBlockReason(maxAttempts, windowMs);

      expect(result).toBe("Excedió límite de 10 intentos en 15 minutos");
    });

    it("should handle 1 hour windows", () => {
      const maxAttempts = 50;
      const windowMs = 60 * 60 * 1000; // 60 minutes

      const result = generateBlockReason(maxAttempts, windowMs);

      expect(result).toBe("Excedió límite de 50 intentos en 60 minutos");
    });

    it("should format decimal numbers correctly", () => {
      const maxAttempts = 10;
      const windowMs = 90 * 1000; // 1.5 minutes

      const result = generateBlockReason(maxAttempts, windowMs);

      expect(result).toBe("Excedió límite de 10 intentos en 1.5 minutos");
    });
  });

  describe("calculateHoneypotBlockDuration", () => {
    it("should calculate 7 days from now", () => {
      const now = new Date("2024-01-01T12:00:00Z");

      const result = calculateHoneypotBlockDuration(now);

      expect(result).toEqual(new Date("2024-01-08T12:00:00Z"));
    });

    it("should handle end of month dates", () => {
      const now = new Date("2024-01-31T12:00:00Z");

      const result = calculateHoneypotBlockDuration(now);

      expect(result).toEqual(new Date("2024-02-07T12:00:00Z"));
    });

    it("should handle year change", () => {
      const now = new Date("2024-12-30T12:00:00Z");

      const result = calculateHoneypotBlockDuration(now);

      expect(result).toEqual(new Date("2025-01-06T12:00:00Z"));
    });
  });

  describe("generateHoneypotReason", () => {
    it("should generate message without details", () => {
      const result = generateHoneypotReason();

      expect(result).toBe("Honeypot activado");
    });

    it("should generate message with details", () => {
      const result = generateHoneypotReason("Hidden field completed");

      expect(result).toBe("Honeypot activado: Hidden field completed");
    });

    it("should handle empty details", () => {
      const result = generateHoneypotReason("");

      expect(result).toBe("Honeypot activado");
    });
  });

  describe("RATE_LIMIT_CONFIGS", () => {
    it("should have config for invitation-token", () => {
      expect(RATE_LIMIT_CONFIGS["invitation-token"]).toBeDefined();
      expect(RATE_LIMIT_CONFIGS["invitation-token"].maxAttempts).toBe(10);
      expect(RATE_LIMIT_CONFIGS["invitation-token"].windowMs).toBe(
        15 * 60 * 1000,
      );
      expect(RATE_LIMIT_CONFIGS["invitation-token"].blockDurationMs).toBe(
        24 * 60 * 60 * 1000,
      );
    });

    it("should have config for invitation-actions", () => {
      expect(RATE_LIMIT_CONFIGS["invitation-actions"]).toBeDefined();
      expect(RATE_LIMIT_CONFIGS["invitation-actions"].maxAttempts).toBe(50);
      expect(RATE_LIMIT_CONFIGS["invitation-actions"].windowMs).toBe(
        60 * 60 * 1000,
      );
      expect(RATE_LIMIT_CONFIGS["invitation-actions"].blockDurationMs).toBe(
        2 * 60 * 60 * 1000,
      );
    });
  });
});

describe("RateLimiterService", () => {
  let mockStorage: RateLimitStorage;
  let service: RateLimiterService;

  beforeEach(() => {
    mockStorage = {
      findActiveBlock: vi.fn(),
      deleteOldAttempts: vi.fn(),
      countAttemptsInWindow: vi.fn(),
      createAttempt: vi.fn(),
      createBlock: vi.fn(),
      logSecurityEvent: vi.fn().mockResolvedValue(undefined),
      deleteOldAttemptsGlobal: vi.fn(),
      deleteExpiredBlocks: vi.fn(),
    };
    service = new RateLimiterService(mockStorage);
  });

  describe("isIPBlocked", () => {
    it("should return blocked true when active block exists", async () => {
      const blockedUntil = new Date("2024-01-02T12:00:00Z");
      vi.mocked(mockStorage.findActiveBlock).mockResolvedValue({
        blockedUntil,
      });

      const result = await service.isIPBlocked(
        "192.168.1.1",
        "invitation-token",
      );

      expect(result.blocked).toBe(true);
      expect(result.block?.blockedUntil).toEqual(blockedUntil);
    });

    it("should return blocked false when no block exists", async () => {
      vi.mocked(mockStorage.findActiveBlock).mockResolvedValue(null);

      const result = await service.isIPBlocked(
        "192.168.1.1",
        "invitation-token",
      );

      expect(result.blocked).toBe(false);
      expect(result.block).toBeNull();
    });
  });

  describe("recordAttempt", () => {
    it("should allow attempt if not blocked and not exceeding limit", async () => {
      vi.mocked(mockStorage.findActiveBlock).mockResolvedValue(null);
      vi.mocked(mockStorage.countAttemptsInWindow).mockResolvedValue(5);

      const result = await service.recordAttempt(
        "192.168.1.1",
        "invitation-token",
        false,
      );

      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBeGreaterThan(0);
      expect(mockStorage.createAttempt).toHaveBeenCalledWith(
        "192.168.1.1",
        "invitation-token",
        false,
      );
    });

    it("should block if limit exceeded", async () => {
      vi.mocked(mockStorage.findActiveBlock).mockResolvedValue(null);
      vi.mocked(mockStorage.countAttemptsInWindow).mockResolvedValue(10);

      const result = await service.recordAttempt(
        "192.168.1.1",
        "invitation-token",
        false,
      );

      expect(result.allowed).toBe(false);
      expect(result.remainingAttempts).toBe(0);
      expect(result.blockedUntil).toBeDefined();
      expect(mockStorage.createBlock).toHaveBeenCalled();
      expect(mockStorage.logSecurityEvent).toHaveBeenCalledWith(
        "rate_limit_triggered",
        "192.168.1.1",
        expect.any(Object),
      );
    });

    it("should reject immediately if already blocked", async () => {
      const blockedUntil = new Date("2024-01-02T12:00:00Z");
      vi.mocked(mockStorage.findActiveBlock).mockResolvedValue({
        blockedUntil,
      });

      const result = await service.recordAttempt(
        "192.168.1.1",
        "invitation-token",
        false,
      );

      expect(result.allowed).toBe(false);
      expect(result.remainingAttempts).toBe(0);
      expect(result.blockedUntil).toEqual(blockedUntil);
      expect(mockStorage.createAttempt).not.toHaveBeenCalled();
    });

    it("should clean old attempts before counting", async () => {
      vi.mocked(mockStorage.findActiveBlock).mockResolvedValue(null);
      vi.mocked(mockStorage.countAttemptsInWindow).mockResolvedValue(3);

      await service.recordAttempt("192.168.1.1", "invitation-token", false);

      expect(mockStorage.deleteOldAttempts).toHaveBeenCalled();
    });
  });

  describe("checkRateLimit", () => {
    it("should return allowed true if not exceeding limit", async () => {
      vi.mocked(mockStorage.findActiveBlock).mockResolvedValue(null);
      vi.mocked(mockStorage.countAttemptsInWindow).mockResolvedValue(5);

      const result = await service.checkRateLimit(
        "192.168.1.1",
        "invitation-token",
      );

      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(5);
    });

    it("should return allowed false if blocked", async () => {
      const blockedUntil = new Date("2024-01-02T12:00:00Z");
      vi.mocked(mockStorage.findActiveBlock).mockResolvedValue({
        blockedUntil,
      });

      const result = await service.checkRateLimit(
        "192.168.1.1",
        "invitation-token",
      );

      expect(result.allowed).toBe(false);
      expect(result.remainingAttempts).toBe(0);
      expect(result.blockedUntil).toEqual(blockedUntil);
    });

    it("should NOT record attempt (only check)", async () => {
      vi.mocked(mockStorage.findActiveBlock).mockResolvedValue(null);
      vi.mocked(mockStorage.countAttemptsInWindow).mockResolvedValue(5);

      await service.checkRateLimit("192.168.1.1", "invitation-token");

      expect(mockStorage.createAttempt).not.toHaveBeenCalled();
    });
  });

  describe("blockIPForHoneypot", () => {
    it("should create 7-day block", async () => {
      await service.blockIPForHoneypot(
        "192.168.1.1",
        "invitation-token",
        "Hidden field completed",
      );

      expect(mockStorage.createBlock).toHaveBeenCalledWith(
        "192.168.1.1",
        "invitation-token",
        expect.any(Date),
        "Honeypot activado: Hidden field completed",
      );
    });

    it("should log security event", async () => {
      await service.blockIPForHoneypot("192.168.1.1", "invitation-token");

      expect(mockStorage.logSecurityEvent).toHaveBeenCalledWith(
        "honeypot_triggered",
        "192.168.1.1",
        expect.objectContaining({
          actionType: "invitation-token",
        }),
      );
    });
  });

  describe("cleanupOldRateLimitData", () => {
    it("should cleanup old attempts and expired blocks", async () => {
      await service.cleanupOldRateLimitData();

      expect(mockStorage.deleteOldAttemptsGlobal).toHaveBeenCalledWith(
        expect.any(Date),
      );
      expect(mockStorage.deleteExpiredBlocks).toHaveBeenCalledWith(
        expect.any(Date),
      );
    });
  });
});
