import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  generateTokenId,
  calculateDefaultExpiration,
  calculateExpiration,
} from "@/lib/invitations/token-service";

describe("token-service", () => {
  describe("generateTokenId", () => {
    it("should generate 21-character base64url token", async () => {
      const token = await generateTokenId();

      expect(token).toHaveLength(21);
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/); // base64url charset
    });

    it("should generate unique tokens", async () => {
      const token1 = await generateTokenId();
      const token2 = await generateTokenId();
      const token3 = await generateTokenId();

      expect(token1).not.toBe(token2);
      expect(token2).not.toBe(token3);
      expect(token1).not.toBe(token3);
    });

    it("should have high entropy (16 bytes = 128 bits)", async () => {
      // Generate 100 tokens and ensure no collisions
      const tokens = new Set<string>();

      for (let i = 0; i < 100; i++) {
        const token = await generateTokenId();
        tokens.add(token);
      }

      expect(tokens.size).toBe(100); // All unique
    });
  });

  describe("calculateDefaultExpiration", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-02-26T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should calculate expiration 1 year from now", () => {
      const expiration = calculateDefaultExpiration();

      const expected = new Date("2027-02-26T12:00:00Z");
      expect(expiration.getTime()).toBe(expected.getTime());
    });

    it("should return Date object", () => {
      const expiration = calculateDefaultExpiration();

      expect(expiration).toBeInstanceOf(Date);
    });
  });

  describe("calculateExpiration", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-02-26T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should calculate expiration N days from now", () => {
      const expiration7Days = calculateExpiration(7);
      const expiration30Days = calculateExpiration(30);
      const expiration365Days = calculateExpiration(365);

      expect(expiration7Days.getTime()).toBe(
        new Date("2026-03-05T12:00:00Z").getTime(),
      );
      expect(expiration30Days.getTime()).toBe(
        new Date("2026-03-28T12:00:00Z").getTime(),
      );
      expect(expiration365Days.getTime()).toBe(
        new Date("2027-02-26T12:00:00Z").getTime(),
      );
    });

    it("should handle 0 days", () => {
      const expiration = calculateExpiration(0);

      expect(expiration.getTime()).toBe(
        new Date("2026-02-26T12:00:00Z").getTime(),
      );
    });

    it("should handle negative days (past)", () => {
      const expiration = calculateExpiration(-7);

      expect(expiration.getTime()).toBe(
        new Date("2026-02-19T12:00:00Z").getTime(),
      );
    });
  });
});
