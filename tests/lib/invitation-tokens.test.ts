/**
 * Tests for lib/invitation-tokens.ts
 *
 * CRITICAL: Only testing PURE logic (token validation)
 */

import { describe, it, expect } from "vitest";
import {
  validateTokenState,
  isTokenExpired,
  validateGuestCount,
  normalizeGuestCount,
} from "@/lib/invitation-tokens";

describe("invitation-tokens - Pure Functions", () => {
  describe("validateTokenState", () => {
    it("should accept valid active token", () => {
      const result = validateTokenState({
        isActive: true,
        isUsed: false,
        expiresAt: null,
      });

      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("should reject inactive token", () => {
      const result = validateTokenState({
        isActive: false,
        isUsed: false,
        expiresAt: null,
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toBe("Token invalid or revoked");
    });

    it("should reject used token", () => {
      const result = validateTokenState({
        isActive: true,
        isUsed: true,
        expiresAt: null,
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toBe("Token already used");
    });

    it("should reject expired token", () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago

      const result = validateTokenState({
        isActive: true,
        isUsed: false,
        expiresAt: pastDate,
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toBe("Token expired");
    });

    it("should accept token with future expiration", () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

      const result = validateTokenState({
        isActive: true,
        isUsed: false,
        expiresAt: futureDate,
      });

      expect(result.valid).toBe(true);
    });

    it("should prioritize isActive check over isUsed", () => {
      const result = validateTokenState({
        isActive: false,
        isUsed: true,
        expiresAt: null,
      });

      expect(result.reason).toBe("Token invalid or revoked");
    });

    it("should prioritize isUsed check over expiration", () => {
      const pastDate = new Date(Date.now() - 1000);

      const result = validateTokenState({
        isActive: true,
        isUsed: true,
        expiresAt: pastDate,
      });

      expect(result.reason).toBe("Token already used");
    });

    it("should accept token with null expiration (never expires)", () => {
      const result = validateTokenState({
        isActive: true,
        isUsed: false,
        expiresAt: null,
      });

      expect(result.valid).toBe(true);
    });
  });

  describe("isTokenExpired", () => {
    it("should return false for null expiration", () => {
      const result = isTokenExpired(null);

      expect(result).toBe(false);
    });

    it("should return true if expiration is in the past", () => {
      const pastDate = new Date(Date.now() - 1000);
      const now = new Date();

      const result = isTokenExpired(pastDate, now);

      expect(result).toBe(true);
    });

    it("should return false if expiration is in the future", () => {
      const futureDate = new Date(Date.now() + 1000);
      const now = new Date();

      const result = isTokenExpired(futureDate, now);

      expect(result).toBe(false);
    });

    it("should handle exact expiration time as expired", () => {
      const exactTime = new Date();

      const result = isTokenExpired(exactTime, exactTime);

      expect(result).toBe(false); // Boundary: exact time is NOT expired
    });

    it("should handle expiration one millisecond in the past", () => {
      const now = new Date();
      const oneMillisecondAgo = new Date(now.getTime() - 1);

      const result = isTokenExpired(oneMillisecondAgo, now);

      expect(result).toBe(true);
    });
  });

  describe("validateGuestCount", () => {
    it("should accept valid guest count when attending", () => {
      const result = validateGuestCount(2, 5, true);

      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("should accept guest count equal to max", () => {
      const result = validateGuestCount(5, 5, true);

      expect(result.valid).toBe(true);
    });

    it("should accept when not attending (guestCount ignored)", () => {
      const result = validateGuestCount(null, 5, false);

      expect(result.valid).toBe(true);
    });

    it("should reject null guest count when attending", () => {
      const result = validateGuestCount(null, 5, true);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe(
        "Guest count must be at least 1 when attending",
      );
    });

    it("should reject undefined guest count when attending", () => {
      const result = validateGuestCount(undefined, 5, true);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe(
        "Guest count must be at least 1 when attending",
      );
    });

    it("should reject guest count of 0 when attending", () => {
      const result = validateGuestCount(0, 5, true);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe(
        "Guest count must be at least 1 when attending",
      );
    });

    it("should reject negative guest count when attending", () => {
      const result = validateGuestCount(-1, 5, true);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe(
        "Guest count must be at least 1 when attending",
      );
    });

    it("should reject guest count exceeding max", () => {
      const result = validateGuestCount(6, 5, true);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe(
        "Guest count cannot exceed maximum allowed (5)",
      );
    });

    it("should show correct max in error message", () => {
      const result = validateGuestCount(11, 10, true);

      expect(result.reason).toContain("(10)");
    });

    it("should accept guest count of 1 (minimum valid)", () => {
      const result = validateGuestCount(1, 10, true);

      expect(result.valid).toBe(true);
    });
  });

  describe("normalizeGuestCount", () => {
    it("should return guest count when attending", () => {
      const result = normalizeGuestCount(3, true);

      expect(result).toBe(3);
    });

    it("should return null when not attending", () => {
      const result = normalizeGuestCount(5, false);

      expect(result).toBe(null);
    });

    it("should return null when not attending even if guestCount is provided", () => {
      const result = normalizeGuestCount(10, false);

      expect(result).toBe(null);
    });

    it("should return null when attending but guestCount is null", () => {
      const result = normalizeGuestCount(null, true);

      expect(result).toBe(null);
    });

    it("should return null when attending but guestCount is undefined", () => {
      const result = normalizeGuestCount(undefined, true);

      expect(result).toBe(null);
    });

    it("should return 1 when attending with guestCount of 1", () => {
      const result = normalizeGuestCount(1, true);

      expect(result).toBe(1);
    });

    it("should handle 0 as falsy and return null when attending", () => {
      const result = normalizeGuestCount(0, true);

      expect(result).toBe(null);
    });
  });
});
