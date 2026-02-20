import { describe, it, expect } from "vitest";
import {
  normalizeGuestCount,
  getGuestCountForStatusChange,
  parseGuestCountInput,
  validateGuestCountForMaxGuests,
  InvitationStatus,
} from "@/lib/invitation-status-utils";

// ---------------------------------------------------------------------------
// normalizeGuestCount() tests
// ---------------------------------------------------------------------------

describe("normalizeGuestCount", () => {
  describe("valid range", () => {
    it("returns count when within range [1, maxGuests]", () => {
      expect(normalizeGuestCount(3, 10)).toBe(3);
      expect(normalizeGuestCount(1, 5)).toBe(1);
      expect(normalizeGuestCount(5, 5)).toBe(5);
    });

    it("handles maxGuests = 1", () => {
      expect(normalizeGuestCount(1, 1)).toBe(1);
    });

    it("handles maxGuests = 100 (large number)", () => {
      expect(normalizeGuestCount(50, 100)).toBe(50);
      expect(normalizeGuestCount(100, 100)).toBe(100);
    });
  });

  describe("clamping to minimum (1)", () => {
    it("clamps 0 to 1", () => {
      expect(normalizeGuestCount(0, 10)).toBe(1);
    });

    it("clamps negative numbers to 1", () => {
      expect(normalizeGuestCount(-5, 10)).toBe(1);
      expect(normalizeGuestCount(-1, 5)).toBe(1);
      expect(normalizeGuestCount(-100, 20)).toBe(1);
    });

    it("clamps very large negative to 1", () => {
      expect(normalizeGuestCount(-999999, 10)).toBe(1);
    });
  });

  describe("clamping to maximum (maxGuests)", () => {
    it("clamps count > maxGuests to maxGuests", () => {
      expect(normalizeGuestCount(10, 5)).toBe(5);
      expect(normalizeGuestCount(100, 10)).toBe(10);
      expect(normalizeGuestCount(6, 5)).toBe(5);
    });

    it("clamps very large count to maxGuests", () => {
      expect(normalizeGuestCount(999999, 10)).toBe(10);
    });

    it("clamps count = maxGuests + 1", () => {
      expect(normalizeGuestCount(11, 10)).toBe(10);
    });
  });

  describe("edge cases", () => {
    it("handles maxGuests = 0 (edge case, clamps to 1)", () => {
      // Even if maxGuests is 0, we enforce minimum of 1
      expect(normalizeGuestCount(5, 0)).toBe(1);
      expect(normalizeGuestCount(0, 0)).toBe(1);
    });

    it("handles negative maxGuests (edge case, clamps to 1)", () => {
      expect(normalizeGuestCount(5, -10)).toBe(1);
    });
  });
});

// ---------------------------------------------------------------------------
// getGuestCountForStatusChange() tests
// ---------------------------------------------------------------------------

describe("getGuestCountForStatusChange", () => {
  describe("status = NOT_ATTENDING", () => {
    it("returns 1 regardless of current count", () => {
      expect(
        getGuestCountForStatusChange(InvitationStatus.NOT_ATTENDING, 5, 10),
      ).toBe(1);
      expect(
        getGuestCountForStatusChange(InvitationStatus.NOT_ATTENDING, 100, 50),
      ).toBe(1);
      expect(
        getGuestCountForStatusChange(InvitationStatus.NOT_ATTENDING, 1, 1),
      ).toBe(1);
    });

    it("returns 1 even with invalid current count", () => {
      expect(
        getGuestCountForStatusChange(InvitationStatus.NOT_ATTENDING, 0, 10),
      ).toBe(1);
      expect(
        getGuestCountForStatusChange(InvitationStatus.NOT_ATTENDING, -5, 10),
      ).toBe(1);
    });
  });

  describe("status = PENDING", () => {
    it("returns 1 regardless of current count", () => {
      expect(
        getGuestCountForStatusChange(InvitationStatus.PENDING, 5, 10),
      ).toBe(1);
      expect(getGuestCountForStatusChange(InvitationStatus.PENDING, 3, 3)).toBe(
        1,
      );
    });

    it("returns 1 even with invalid current count", () => {
      expect(
        getGuestCountForStatusChange(InvitationStatus.PENDING, 0, 10),
      ).toBe(1);
      expect(
        getGuestCountForStatusChange(InvitationStatus.PENDING, -10, 5),
      ).toBe(1);
    });
  });

  describe("status = ATTENDING", () => {
    it("returns normalized count when within range", () => {
      expect(
        getGuestCountForStatusChange(InvitationStatus.ATTENDING, 3, 10),
      ).toBe(3);
      expect(
        getGuestCountForStatusChange(InvitationStatus.ATTENDING, 1, 5),
      ).toBe(1);
      expect(
        getGuestCountForStatusChange(InvitationStatus.ATTENDING, 5, 5),
      ).toBe(5);
    });

    it("clamps count to maxGuests when exceeding", () => {
      expect(
        getGuestCountForStatusChange(InvitationStatus.ATTENDING, 10, 5),
      ).toBe(5);
      expect(
        getGuestCountForStatusChange(InvitationStatus.ATTENDING, 100, 10),
      ).toBe(10);
    });

    it("clamps count to 1 when below minimum", () => {
      expect(
        getGuestCountForStatusChange(InvitationStatus.ATTENDING, 0, 10),
      ).toBe(1);
      expect(
        getGuestCountForStatusChange(InvitationStatus.ATTENDING, -5, 10),
      ).toBe(1);
    });

    it("handles maxGuests = 1", () => {
      expect(
        getGuestCountForStatusChange(InvitationStatus.ATTENDING, 5, 1),
      ).toBe(1);
      expect(
        getGuestCountForStatusChange(InvitationStatus.ATTENDING, 1, 1),
      ).toBe(1);
    });
  });

  describe("unknown status (edge case)", () => {
    it("treats unknown status as non-attending (returns 1)", () => {
      expect(getGuestCountForStatusChange("unknown", 5, 10)).toBe(1);
      expect(getGuestCountForStatusChange("", 10, 20)).toBe(1);
      expect(getGuestCountForStatusChange("invalid_status", 3, 5)).toBe(1);
    });
  });

  describe("realistic scenarios", () => {
    it("switching from pending to attending keeps valid count", () => {
      // User had pending with count 1, now attending with max 10
      expect(
        getGuestCountForStatusChange(InvitationStatus.ATTENDING, 1, 10),
      ).toBe(1);
    });

    it("switching from attending to not_attending resets to 1", () => {
      expect(
        getGuestCountForStatusChange(InvitationStatus.NOT_ATTENDING, 5, 10),
      ).toBe(1);
    });

    it("switching from not_attending to attending normalizes count", () => {
      // User had not_attending (count irrelevant), now attending
      expect(
        getGuestCountForStatusChange(InvitationStatus.ATTENDING, 1, 10),
      ).toBe(1);
    });

    it("user increases count beyond max when switching to attending", () => {
      // User had count 20, maxGuests is 5, switches to attending
      expect(
        getGuestCountForStatusChange(InvitationStatus.ATTENDING, 20, 5),
      ).toBe(5);
    });
  });
});

// ---------------------------------------------------------------------------
// parseGuestCountInput() tests
// ---------------------------------------------------------------------------

describe("parseGuestCountInput", () => {
  describe("valid input", () => {
    it("parses positive integer strings", () => {
      expect(parseGuestCountInput("5")).toBe(5);
      expect(parseGuestCountInput("1")).toBe(1);
      expect(parseGuestCountInput("100")).toBe(100);
    });

    it("parses single digit", () => {
      expect(parseGuestCountInput("3")).toBe(3);
    });

    it("parses large numbers", () => {
      expect(parseGuestCountInput("999")).toBe(999);
    });
  });

  describe("invalid input (NaN)", () => {
    it("returns 1 for empty string", () => {
      expect(parseGuestCountInput("")).toBe(1);
    });

    it("returns 1 for non-numeric strings", () => {
      expect(parseGuestCountInput("abc")).toBe(1);
      expect(parseGuestCountInput("hello")).toBe(1);
      expect(parseGuestCountInput("NaN")).toBe(1);
    });

    it("returns 1 for special characters", () => {
      expect(parseGuestCountInput("@#$")).toBe(1);
      expect(parseGuestCountInput("!!!")).toBe(1);
    });

    it("returns 1 for whitespace only", () => {
      expect(parseGuestCountInput("   ")).toBe(1);
      expect(parseGuestCountInput("\t")).toBe(1);
      expect(parseGuestCountInput("\n")).toBe(1);
    });
  });

  describe("negative input", () => {
    it("returns 1 for negative numbers", () => {
      expect(parseGuestCountInput("-5")).toBe(1);
      expect(parseGuestCountInput("-1")).toBe(1);
      expect(parseGuestCountInput("-100")).toBe(1);
    });
  });

  describe("zero input", () => {
    it("returns 1 for zero", () => {
      expect(parseGuestCountInput("0")).toBe(1);
    });
  });

  describe("edge cases", () => {
    it("parses decimal strings (parseInt truncates)", () => {
      expect(parseGuestCountInput("5.7")).toBe(5);
      expect(parseGuestCountInput("3.14")).toBe(3);
    });

    it("handles leading zeros", () => {
      expect(parseGuestCountInput("007")).toBe(7);
      expect(parseGuestCountInput("00123")).toBe(123);
    });

    it("handles leading/trailing whitespace", () => {
      expect(parseGuestCountInput(" 5 ")).toBe(5);
      expect(parseGuestCountInput("\t10\n")).toBe(10);
    });

    it("handles mixed valid/invalid (parseInt stops at first invalid)", () => {
      expect(parseGuestCountInput("5abc")).toBe(5);
      expect(parseGuestCountInput("10xyz")).toBe(10);
    });

    it("handles scientific notation", () => {
      expect(parseGuestCountInput("1e2")).toBe(1); // "1e2" → parseInt sees "1"
      expect(parseGuestCountInput("2e10")).toBe(2);
    });
  });

  describe("boundary values", () => {
    it("handles very large numbers", () => {
      expect(parseGuestCountInput("999999")).toBe(999999);
    });

    it("handles Number.MAX_SAFE_INTEGER", () => {
      const maxSafe = Number.MAX_SAFE_INTEGER.toString();
      expect(parseGuestCountInput(maxSafe)).toBe(Number.MAX_SAFE_INTEGER);
    });
  });
});

// ---------------------------------------------------------------------------
// validateGuestCountForMaxGuests() tests
// ---------------------------------------------------------------------------

describe("validateGuestCountForMaxGuests", () => {
  describe("status = ATTENDING", () => {
    it("returns needsAdjustment = true when count > maxGuests", () => {
      const result = validateGuestCountForMaxGuests("attending", 10, 5);
      expect(result.needsAdjustment).toBe(true);
      expect(result.adjustedCount).toBe(5);
    });

    it("returns needsAdjustment = false when count <= maxGuests", () => {
      const result = validateGuestCountForMaxGuests("attending", 3, 10);
      expect(result.needsAdjustment).toBe(false);
      expect(result.adjustedCount).toBe(3);
    });

    it("returns needsAdjustment = false when count = maxGuests", () => {
      const result = validateGuestCountForMaxGuests("attending", 5, 5);
      expect(result.needsAdjustment).toBe(false);
      expect(result.adjustedCount).toBe(5);
    });

    it("adjusts count = maxGuests + 1 to maxGuests", () => {
      const result = validateGuestCountForMaxGuests("attending", 6, 5);
      expect(result.needsAdjustment).toBe(true);
      expect(result.adjustedCount).toBe(5);
    });

    it("handles very large count exceeding maxGuests", () => {
      const result = validateGuestCountForMaxGuests("attending", 999, 10);
      expect(result.needsAdjustment).toBe(true);
      expect(result.adjustedCount).toBe(10);
    });
  });

  describe("status = NOT_ATTENDING", () => {
    it("does not validate (returns original count)", () => {
      const result = validateGuestCountForMaxGuests("not_attending", 10, 2);
      expect(result.needsAdjustment).toBe(false);
      expect(result.adjustedCount).toBe(10); // Not adjusted
    });

    it("ignores count even if exceeding maxGuests", () => {
      const result = validateGuestCountForMaxGuests("not_attending", 100, 5);
      expect(result.needsAdjustment).toBe(false);
      expect(result.adjustedCount).toBe(100);
    });
  });

  describe("status = PENDING", () => {
    it("does not validate (returns original count)", () => {
      const result = validateGuestCountForMaxGuests("pending", 50, 10);
      expect(result.needsAdjustment).toBe(false);
      expect(result.adjustedCount).toBe(50);
    });

    it("ignores invalid count", () => {
      const result = validateGuestCountForMaxGuests("pending", 0, 5);
      expect(result.needsAdjustment).toBe(false);
      expect(result.adjustedCount).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("handles maxGuests = 0 (attending)", () => {
      const result = validateGuestCountForMaxGuests("attending", 5, 0);
      expect(result.needsAdjustment).toBe(true);
      expect(result.adjustedCount).toBe(0);
    });

    it("handles negative maxGuests (attending)", () => {
      const result = validateGuestCountForMaxGuests("attending", 5, -10);
      expect(result.needsAdjustment).toBe(true);
      expect(result.adjustedCount).toBe(-10);
    });

    it("handles count = 0 with attending", () => {
      const result = validateGuestCountForMaxGuests("attending", 0, 10);
      expect(result.needsAdjustment).toBe(false);
      expect(result.adjustedCount).toBe(0);
    });
  });

  describe("realistic scenarios", () => {
    it("maxGuests reduced from 10 to 5, count = 8", () => {
      const result = validateGuestCountForMaxGuests("attending", 8, 5);
      expect(result.needsAdjustment).toBe(true);
      expect(result.adjustedCount).toBe(5);
    });

    it("maxGuests increased from 5 to 10, count = 3", () => {
      const result = validateGuestCountForMaxGuests("attending", 3, 10);
      expect(result.needsAdjustment).toBe(false);
      expect(result.adjustedCount).toBe(3);
    });

    it("maxGuests = 1, count = 5 (should adjust to 1)", () => {
      const result = validateGuestCountForMaxGuests("attending", 5, 1);
      expect(result.needsAdjustment).toBe(true);
      expect(result.adjustedCount).toBe(1);
    });

    it("user not attending, count can be anything", () => {
      const result = validateGuestCountForMaxGuests("not_attending", 999, 1);
      expect(result.needsAdjustment).toBe(false);
      expect(result.adjustedCount).toBe(999);
    });
  });
});
