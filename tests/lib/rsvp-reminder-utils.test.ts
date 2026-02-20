import { describe, it, expect } from "vitest";
import {
  calculateDaysRemaining,
  shouldShowReminder,
  type ReminderCheckParams,
} from "@/lib/rsvp-reminder-utils";

// ---------------------------------------------------------------------------
// Test Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a date in the future/past relative to a base date
 * @param baseDateStr - ISO date string for base (e.g., "2026-02-14")
 * @param offsetDays - Days to add (positive = future, negative = past)
 */
function createDate(baseDateStr: string, offsetDays: number = 0): Date {
  const date = new Date(baseDateStr);
  date.setDate(date.getDate() + offsetDays);
  return date;
}

/**
 * Converts date to timestamp (ms)
 */
function toTimestamp(date: Date): number {
  return date.getTime();
}

// Wedding date: Feb 14, 2026 at 19:30 (Argentina timezone)
const WEDDING_DATE_STR = "2026-02-14T19:30:00";
const WEDDING_TIMESTAMP = new Date(WEDDING_DATE_STR).getTime();

// ---------------------------------------------------------------------------
// calculateDaysRemaining() tests
// ---------------------------------------------------------------------------

describe("calculateDaysRemaining", () => {
  describe("exact date calculations", () => {
    it("returns 0 when current date equals wedding date", () => {
      const wedding = createDate("2026-02-14");
      const current = createDate("2026-02-14");
      const days = calculateDaysRemaining(toTimestamp(wedding), current);
      expect(days).toBe(0);
    });

    it("returns 1 when wedding is tomorrow", () => {
      const wedding = createDate("2026-02-14");
      const current = createDate("2026-02-13");
      const days = calculateDaysRemaining(toTimestamp(wedding), current);
      expect(days).toBe(1);
    });

    it("returns 7 when wedding is in one week", () => {
      const wedding = createDate("2026-02-14");
      const current = createDate("2026-02-07");
      const days = calculateDaysRemaining(toTimestamp(wedding), current);
      expect(days).toBe(7);
    });

    it("returns 30 when wedding is in one month", () => {
      const wedding = createDate("2026-02-14");
      const current = createDate("2026-01-15");
      const days = calculateDaysRemaining(toTimestamp(wedding), current);
      expect(days).toBe(30);
    });

    it("returns 365 when wedding is in one year", () => {
      const wedding = createDate("2026-02-14");
      const current = createDate("2025-02-14");
      const days = calculateDaysRemaining(toTimestamp(wedding), current);
      expect(days).toBe(365);
    });
  });

  describe("past dates", () => {
    it("returns -1 when wedding was yesterday", () => {
      const wedding = createDate("2026-02-14");
      const current = createDate("2026-02-15");
      const days = calculateDaysRemaining(toTimestamp(wedding), current);
      expect(days).toBe(-1);
    });

    it("returns -7 when wedding was last week", () => {
      const wedding = createDate("2026-02-14");
      const current = createDate("2026-02-21");
      const days = calculateDaysRemaining(toTimestamp(wedding), current);
      expect(days).toBe(-7);
    });

    it("returns negative for dates in the past", () => {
      const wedding = createDate("2026-02-14");
      const current = createDate("2026-03-01");
      const days = calculateDaysRemaining(toTimestamp(wedding), current);
      expect(days).toBeLessThan(0);
    });
  });

  describe("edge cases", () => {
    it("handles same day but different times (uses ceiling)", () => {
      const wedding = new Date("2026-02-14T23:59:59");
      const current = new Date("2026-02-14T00:00:00");
      const days = calculateDaysRemaining(toTimestamp(wedding), current);
      // Same day, but Math.ceil on fractional day = 1
      expect(days).toBe(1);
    });

    it("uses current date when not provided", () => {
      const futureWedding = toTimestamp(createDate("2030-12-31"));
      const days = calculateDaysRemaining(futureWedding);
      expect(days).toBeGreaterThan(0); // Wedding is in the future
    });

    it("handles very large date differences", () => {
      const wedding = createDate("2050-01-01");
      const current = createDate("2026-01-01");
      const days = calculateDaysRemaining(toTimestamp(wedding), current);
      expect(days).toBeGreaterThan(8000); // ~24 years
    });

    it("handles timestamps at epoch (1970-01-01)", () => {
      const wedding = new Date("1970-01-01T00:00:00Z");
      const current = new Date("1970-01-02T00:00:00Z");
      const days = calculateDaysRemaining(toTimestamp(wedding), current);
      expect(days).toBe(-1);
    });
  });
});

// ---------------------------------------------------------------------------
// shouldShowReminder() tests
// ---------------------------------------------------------------------------

describe("shouldShowReminder", () => {
  describe("user has already responded", () => {
    it("does not show reminder even if within threshold", () => {
      const params: ReminderCheckParams = {
        weddingTimestamp: WEDDING_TIMESTAMP,
        remindRestingDays: 30,
        hasResponded: true,
        currentDate: createDate("2026-02-01"), // ~14 days before wedding (with time)
      };
      const result = shouldShowReminder(params);
      expect(result.shouldShow).toBe(false);
      expect(result.daysRemaining).toBe(14);
    });

    it("does not show reminder even on wedding day", () => {
      const params: ReminderCheckParams = {
        weddingTimestamp: WEDDING_TIMESTAMP,
        remindRestingDays: 1,
        hasResponded: true,
        currentDate: createDate("2026-02-14"), // wedding day
      };
      const result = shouldShowReminder(params);
      expect(result.shouldShow).toBe(false);
    });

    it("does not show reminder even if wedding passed", () => {
      const params: ReminderCheckParams = {
        weddingTimestamp: WEDDING_TIMESTAMP,
        remindRestingDays: 30,
        hasResponded: true,
        currentDate: createDate("2026-03-01"), // after wedding
      };
      const result = shouldShowReminder(params);
      expect(result.shouldShow).toBe(false);
    });
  });

  describe("user has NOT responded", () => {
    describe("within threshold (should show)", () => {
      it("shows reminder when days remaining < threshold", () => {
        const params: ReminderCheckParams = {
          weddingTimestamp: WEDDING_TIMESTAMP,
          remindRestingDays: 30,
          hasResponded: false,
          currentDate: createDate("2026-02-01"), // ~14 days before (with time difference)
        };
        const result = shouldShowReminder(params);
        expect(result.shouldShow).toBe(true);
        expect(result.daysRemaining).toBe(14);
      });

      it("shows reminder when days remaining < threshold - 1", () => {
        const params: ReminderCheckParams = {
          weddingTimestamp: WEDDING_TIMESTAMP,
          remindRestingDays: 10,
          hasResponded: false,
          currentDate: createDate("2026-02-06"), // ~8 days before
        };
        const result = shouldShowReminder(params);
        expect(result.shouldShow).toBe(true);
        expect(result.daysRemaining).toBe(9);
      });

      it("shows reminder 1-2 days before wedding", () => {
        const params: ReminderCheckParams = {
          weddingTimestamp: WEDDING_TIMESTAMP,
          remindRestingDays: 30,
          hasResponded: false,
          currentDate: createDate("2026-02-13"),
        };
        const result = shouldShowReminder(params);
        expect(result.shouldShow).toBe(true);
        expect(result.daysRemaining).toBe(2); // Math.ceil rounds up with time component
      });

      it("shows reminder with threshold = 1 day", () => {
        const params: ReminderCheckParams = {
          weddingTimestamp: WEDDING_TIMESTAMP,
          remindRestingDays: 1,
          hasResponded: false,
          currentDate: createDate("2026-02-14"), // wedding day (0 days)
        };
        const result = shouldShowReminder(params);
        expect(result.shouldShow).toBe(false); // 0 is NOT > 0
      });
    });

    describe("outside threshold (should NOT show)", () => {
      it("does not show when days remaining > threshold", () => {
        const params: ReminderCheckParams = {
          weddingTimestamp: WEDDING_TIMESTAMP,
          remindRestingDays: 10,
          hasResponded: false,
          currentDate: createDate("2026-01-15"), // 30 days before
        };
        const result = shouldShowReminder(params);
        expect(result.shouldShow).toBe(false);
        expect(result.daysRemaining).toBe(31); // Math.ceil: Jan 15 00:00 → Feb 14 19:30 = 30.8 days
      });

      it("does not show when days remaining = threshold (boundary)", () => {
        const params: ReminderCheckParams = {
          weddingTimestamp: WEDDING_TIMESTAMP,
          remindRestingDays: 10,
          hasResponded: false,
          currentDate: createDate("2026-02-04"), // exactly 10 days
        };
        const result = shouldShowReminder(params);
        expect(result.shouldShow).toBe(false); // 11 is NOT < 10
        expect(result.daysRemaining).toBe(11); // Math.ceil: Feb 4 00:00 → Feb 14 19:30 = 10.8 days
      });

      it("does not show very far in advance", () => {
        const params: ReminderCheckParams = {
          weddingTimestamp: WEDDING_TIMESTAMP,
          remindRestingDays: 30,
          hasResponded: false,
          currentDate: createDate("2025-02-14"), // 1 year before
        };
        const result = shouldShowReminder(params);
        expect(result.shouldShow).toBe(false);
        expect(result.daysRemaining).toBe(366); // Math.ceil: Feb 14 2025 00:00 → Feb 14 2026 19:30 = 365.8 days
      });
    });

    describe("wedding date passed (should NOT show)", () => {
      it("does not show on wedding day (0 days)", () => {
        const params: ReminderCheckParams = {
          weddingTimestamp: WEDDING_TIMESTAMP,
          remindRestingDays: 30,
          hasResponded: false,
          currentDate: new Date("2026-02-14T19:30:00"), // Same time as wedding
        };
        const result = shouldShowReminder(params);
        expect(result.shouldShow).toBe(false);
        expect(result.daysRemaining).toBe(0);
      });

      it("does not show after wedding passed", () => {
        const params: ReminderCheckParams = {
          weddingTimestamp: WEDDING_TIMESTAMP,
          remindRestingDays: 30,
          hasResponded: false,
          currentDate: createDate("2026-03-01"),
        };
        const result = shouldShowReminder(params);
        expect(result.shouldShow).toBe(false);
        expect(result.daysRemaining).toBeLessThan(0);
      });

      it("does not show 1 day after wedding", () => {
        const params: ReminderCheckParams = {
          weddingTimestamp: WEDDING_TIMESTAMP,
          remindRestingDays: 30,
          hasResponded: false,
          currentDate: createDate("2026-02-15"),
        };
        const result = shouldShowReminder(params);
        expect(result.shouldShow).toBe(false);
        expect(result.daysRemaining).toBe(0); // Math.ceil: Feb 15 00:00 → Feb 14 19:30 = -0.2 days → ceil(-0.2) = 0
      });
    });
  });

  describe("edge cases", () => {
    it("handles threshold = 0 (never shows)", () => {
      const params: ReminderCheckParams = {
        weddingTimestamp: WEDDING_TIMESTAMP,
        remindRestingDays: 0,
        hasResponded: false,
        currentDate: createDate("2026-02-13"), // 1 day before
      };
      const result = shouldShowReminder(params);
      expect(result.shouldShow).toBe(false); // 1 is NOT < 0
    });

    it("handles very large threshold", () => {
      const params: ReminderCheckParams = {
        weddingTimestamp: WEDDING_TIMESTAMP,
        remindRestingDays: 1000,
        hasResponded: false,
        currentDate: createDate("2025-02-14"), // 365 days before
      };
      const result = shouldShowReminder(params);
      expect(result.shouldShow).toBe(true); // 366 < 1000
      expect(result.daysRemaining).toBe(366); // Math.ceil: Feb 14 2025 00:00 → Feb 14 2026 19:30 = 365.8 days
    });

    it("uses current date when not provided", () => {
      const futureWedding = toTimestamp(createDate("2030-12-31"));
      const params: ReminderCheckParams = {
        weddingTimestamp: futureWedding,
        remindRestingDays: 30,
        hasResponded: false,
        // currentDate omitted - uses new Date()
      };
      const result = shouldShowReminder(params);
      expect(result.daysRemaining).toBeGreaterThan(0);
      expect(result.shouldShow).toBe(false); // Way in the future
    });

    it("handles negative threshold (never shows)", () => {
      const params: ReminderCheckParams = {
        weddingTimestamp: WEDDING_TIMESTAMP,
        remindRestingDays: -10,
        hasResponded: false,
        currentDate: createDate("2026-02-01"),
      };
      const result = shouldShowReminder(params);
      expect(result.shouldShow).toBe(false); // days will never be < -10
    });
  });

  describe("realistic scenarios", () => {
    it("shows reminder 7 days before with 30-day threshold", () => {
      const params: ReminderCheckParams = {
        weddingTimestamp: WEDDING_TIMESTAMP,
        remindRestingDays: 30,
        hasResponded: false,
        currentDate: createDate("2026-02-07"),
      };
      const result = shouldShowReminder(params);
      expect(result.shouldShow).toBe(true);
      expect(result.daysRemaining).toBe(8); // Math.ceil: Feb 7 00:00 → Feb 14 19:30 = 7.8 days
    });

    it("does not show reminder 35 days before with 30-day threshold", () => {
      const params: ReminderCheckParams = {
        weddingTimestamp: WEDDING_TIMESTAMP,
        remindRestingDays: 30,
        hasResponded: false,
        currentDate: createDate("2026-01-10"),
      };
      const result = shouldShowReminder(params);
      expect(result.shouldShow).toBe(false);
      expect(result.daysRemaining).toBe(36); // Math.ceil: Jan 10 00:00 → Feb 14 19:30 = 35.8 days
    });

    it("shows reminder 14 days before with 15-day threshold", () => {
      const params: ReminderCheckParams = {
        weddingTimestamp: WEDDING_TIMESTAMP,
        remindRestingDays: 15,
        hasResponded: false,
        currentDate: createDate("2026-02-01"), // Feb 1 00:00 → Feb 14 19:30 = 13.8 days → ceil = 14
      };
      const result = shouldShowReminder(params);
      expect(result.shouldShow).toBe(true);
      expect(result.daysRemaining).toBe(14); // 14 < 15 = true
    });

    it("does not show on boundary (exactly threshold days)", () => {
      const params: ReminderCheckParams = {
        weddingTimestamp: WEDDING_TIMESTAMP,
        remindRestingDays: 15,
        hasResponded: false,
        currentDate: createDate("2026-01-30"), // exactly 15 days
      };
      const result = shouldShowReminder(params);
      expect(result.shouldShow).toBe(false); // 16 is NOT < 15
      expect(result.daysRemaining).toBe(16); // Math.ceil: Jan 30 00:00 → Feb 14 19:30 = 15.8 days
    });
  });

  describe("return value consistency", () => {
    it("always returns both shouldShow and daysRemaining", () => {
      const params: ReminderCheckParams = {
        weddingTimestamp: WEDDING_TIMESTAMP,
        remindRestingDays: 30,
        hasResponded: false,
        currentDate: createDate("2026-02-01"),
      };
      const result = shouldShowReminder(params);
      expect(result).toHaveProperty("shouldShow");
      expect(result).toHaveProperty("daysRemaining");
      expect(typeof result.shouldShow).toBe("boolean");
      expect(typeof result.daysRemaining).toBe("number");
    });

    it("returns daysRemaining even when shouldShow is false", () => {
      const params: ReminderCheckParams = {
        weddingTimestamp: WEDDING_TIMESTAMP,
        remindRestingDays: 10,
        hasResponded: true, // shouldShow = false
        currentDate: createDate("2026-02-01"),
      };
      const result = shouldShowReminder(params);
      expect(result.shouldShow).toBe(false);
      expect(result.daysRemaining).toBe(14); // Math.ceil: Feb 1 00:00 → Feb 14 19:30 = 13.8 days
    });
  });
});
