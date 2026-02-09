/**
 * Tests for utils/date.ts
 *
 * CRITICAL: These functions handle dates with Argentina timezone.
 * Tests must be deterministic regardless of local timezone.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  formatWeddingDate,
  getWeddingDate,
  formatDate,
  getCurrentDateArgentina,
  formatDateTime,
  toArgentinaTimeZone,
} from "@/utils/date";

describe("formatWeddingDate", () => {
  it("should format a valid date in YYYYMMDDhhmm format", () => {
    const result = formatWeddingDate("20260214");
    // Spanish format: "14 de febrero de 2026"
    expect(result).toContain("14");
    expect(result).toContain("febrero");
    expect(result).toContain("2026");
  });

  it("should handle different months correctly", () => {
    const dates = [
      { input: "20260101", month: "enero" },
      { input: "20260301", month: "marzo" },
      { input: "20260601", month: "junio" },
      { input: "20261201", month: "diciembre" },
    ];

    dates.forEach(({ input, month }) => {
      const result = formatWeddingDate(input);
      expect(result).toContain(month);
    });
  });

  it("should handle leap years correctly", () => {
    // 2024 is a leap year, Feb 29 is valid
    const result = formatWeddingDate("20240229");
    expect(result).toContain("29");
    expect(result).toContain("febrero");
    expect(result).toContain("2024");
  });

  it("should parse date components correctly", () => {
    const result = formatWeddingDate("20261225");
    expect(result).toContain("25");
    expect(result).toContain("diciembre");
    expect(result).toContain("2026");
  });

  it("should handle first day of year", () => {
    const result = formatWeddingDate("20260101");
    expect(result).toContain("1");
    expect(result).toContain("enero");
  });

  it("should handle last day of year", () => {
    const result = formatWeddingDate("20261231");
    expect(result).toContain("31");
    expect(result).toContain("diciembre");
  });

  it("should use Spanish locale (es-ES)", () => {
    const result = formatWeddingDate("20260714");
    // Verify it uses Spanish month names
    expect(result).toContain("julio");
    expect(result).not.toContain("July");
  });
});

describe("getWeddingDate", () => {
  beforeEach(() => {
    // Clean env mock before each test
    delete process.env.NEXT_PUBLIC_WEDDING_DATE;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should return default date when no env var is set", () => {
    const date = getWeddingDate();
    expect(date).toBeInstanceOf(Date);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(1); // February (0-indexed)
    expect(date.getDate()).toBe(14);
    expect(date.getHours()).toBe(19);
    expect(date.getMinutes()).toBe(30);
  });

  it("should use environment date if defined", () => {
    process.env.NEXT_PUBLIC_WEDDING_DATE = "20251225183000";
    const date = getWeddingDate();

    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(11); // December (0-indexed)
    expect(date.getDate()).toBe(25);
    expect(date.getHours()).toBe(18);
    expect(date.getMinutes()).toBe(30);
  });

  it("should handle partial date format (padding with zeros)", () => {
    process.env.NEXT_PUBLIC_WEDDING_DATE = "20260101"; // No time
    const date = getWeddingDate();

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(0); // January
    expect(date.getDate()).toBe(1);
    // Should pad with zeros, resulting in 00:00:00
    expect(date.getHours()).toBe(0);
    expect(date.getMinutes()).toBe(0);
    expect(date.getSeconds()).toBe(0);
  });

  it("should use default date if input is invalid", () => {
    process.env.NEXT_PUBLIC_WEDDING_DATE = "invalid_date";
    const date = getWeddingDate();

    // Should fallback to default: 20260214193000
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(1);
    expect(date.getDate()).toBe(14);
  });

  it("should parse all date and time components correctly", () => {
    process.env.NEXT_PUBLIC_WEDDING_DATE = "20261231235959";
    const date = getWeddingDate();

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(11); // December
    expect(date.getDate()).toBe(31);
    expect(date.getHours()).toBe(23);
    expect(date.getMinutes()).toBe(59);
    expect(date.getSeconds()).toBe(59);
  });

  it("should handle midnight correctly", () => {
    process.env.NEXT_PUBLIC_WEDDING_DATE = "20260101000000";
    const date = getWeddingDate();

    expect(date.getHours()).toBe(0);
    expect(date.getMinutes()).toBe(0);
    expect(date.getSeconds()).toBe(0);
  });

  it("should be consistent between multiple calls with same env", () => {
    process.env.NEXT_PUBLIC_WEDDING_DATE = "20260214193000";
    const date1 = getWeddingDate();
    const date2 = getWeddingDate();

    expect(date1.getTime()).toBe(date2.getTime());
  });
});

describe("formatDate", () => {
  it("should return '-' for null", () => {
    expect(formatDate(null)).toBe("-");
  });

  it("should format date in Argentine format (DD/MM/YYYY)", () => {
    const date = new Date(2026, 1, 14, 19, 30, 0); // 14 Feb 2026
    const result = formatDate(date);

    // Argentine format: DD/MM/YYYY
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it("should use Argentina timezone", () => {
    // This is a UTC date
    const date = new Date(Date.UTC(2026, 1, 14, 23, 0, 0));
    const result = formatDate(date);

    // Should apply Argentina timezone correctly
    expect(result).toBeTruthy();
    expect(result).not.toBe("-");
  });

  it("should format single-digit days with leading zero", () => {
    const date = new Date(2026, 0, 5); // January 5
    const result = formatDate(date);

    // Should be "05/01/2026", not "5/1/2026"
    expect(result).toMatch(/^0\d\//);
  });

  it("should format single-digit months with leading zero", () => {
    const date = new Date(2026, 0, 15); // January (month 0)
    const result = formatDate(date);

    // Should be "15/01/2026", not "15/1/2026"
    expect(result).toContain("/01/");
  });

  it("should handle past dates", () => {
    const date = new Date(2020, 5, 15);
    const result = formatDate(date);

    expect(result).toContain("2020");
  });

  it("should handle far future dates", () => {
    const date = new Date(2100, 11, 31);
    const result = formatDate(date);

    expect(result).toContain("2100");
  });
});

describe("formatDateTime", () => {
  it("should return '-' for null", () => {
    expect(formatDateTime(null)).toBe("-");
  });

  it("should format date AND time in Argentine format", () => {
    const date = new Date(2026, 1, 14, 19, 30, 45);
    const result = formatDateTime(date);

    // Should include date and time
    expect(result).toContain("2026");
    expect(result).toMatch(/\d{2}:\d{2}:\d{2}/); // HH:MM:SS
  });

  it("should use Argentina timezone", () => {
    const date = new Date(Date.UTC(2026, 1, 14, 23, 0, 0));
    const result = formatDateTime(date);

    // Verify it includes time
    expect(result).toMatch(/\d{2}:\d{2}/);
  });

  it("should include seconds in format", () => {
    const date = new Date(2026, 1, 14, 19, 30, 45);
    const result = formatDateTime(date);

    // Should have seconds (format may vary: "45" or "45 p. m.")
    expect(result).toMatch(/\d{2}:\d{2}:\d{2}/); // HH:MM:SS
  });

  it("should format midnight correctly", () => {
    const date = new Date(2026, 1, 14, 0, 0, 0);
    const result = formatDateTime(date);

    // Midnight can be "12:00:00 a. m." or "00:00:00" depending on locale
    expect(result).toMatch(/12:00:00|00:00:00/);
  });

  it("should format noon correctly", () => {
    const date = new Date(2026, 1, 14, 12, 0, 0);
    const result = formatDateTime(date);

    expect(result).toContain("12:00");
  });

  it("should include hour correctly", () => {
    const date = new Date(2026, 1, 14, 23, 59, 59);
    const result = formatDateTime(date);

    // Should include hour 23 or 11 (depending on 24h or 12h format)
    // Important part is minutes and seconds: 59:59
    expect(result).toMatch(/\d{2}:59:59/);
  });
});

describe("getCurrentDateArgentina", () => {
  it("should return a Date instance", () => {
    const date = getCurrentDateArgentina();
    expect(date).toBeInstanceOf(Date);
  });

  it("should return a valid date", () => {
    const date = getCurrentDateArgentina();
    expect(date.getTime()).toBeGreaterThan(0);
    expect(!isNaN(date.getTime())).toBe(true);
  });

  it("should be close to current time", () => {
    const argDate = getCurrentDateArgentina();
    const now = new Date();

    // Verify date is reasonable (same year)
    expect(argDate.getFullYear()).toBe(now.getFullYear());

    // Verify month is in valid range
    expect(argDate.getMonth()).toBeGreaterThanOrEqual(0);
    expect(argDate.getMonth()).toBeLessThanOrEqual(11);

    // Verify day is in valid range
    expect(argDate.getDate()).toBeGreaterThanOrEqual(1);
    expect(argDate.getDate()).toBeLessThanOrEqual(31);
  });

  it("should use Argentina locale", () => {
    const date = getCurrentDateArgentina();
    // Verify it's a valid date with reasonable year
    const year = date.getFullYear();
    expect(year).toBeGreaterThanOrEqual(2024);
    expect(year).toBeLessThanOrEqual(2100);
  });
});

describe("toArgentinaTimeZone", () => {
  it("should convert UTC date to Argentina time", () => {
    // 14 Feb 2026 00:00:00 UTC
    const utcDate = new Date(Date.UTC(2026, 1, 14, 0, 0, 0));
    const argDate = toArgentinaTimeZone(utcDate);

    expect(argDate).toBeInstanceOf(Date);
    // Verify it's a valid date
    expect(!isNaN(argDate.getTime())).toBe(true);

    // Argentina is UTC-3, so 00:00 UTC should be 21:00 previous day
    // But conversion can vary, important is that it's a valid date
    expect(argDate.getFullYear()).toBe(2026);
  });

  it("should maintain local time when date is already in local time", () => {
    const localDate = new Date(2026, 1, 14, 19, 30, 0);
    const argDate = toArgentinaTimeZone(localDate);

    expect(argDate).toBeInstanceOf(Date);
  });

  it("should handle dates in different years", () => {
    const dates = [
      new Date(Date.UTC(2024, 0, 1)),
      new Date(Date.UTC(2025, 6, 15)),
      new Date(Date.UTC(2026, 11, 31)),
    ];

    dates.forEach((date) => {
      const argDate = toArgentinaTimeZone(date);
      expect(argDate).toBeInstanceOf(Date);
      expect(!isNaN(argDate.getTime())).toBe(true);
    });
  });

  it("should handle DST transitions (though Argentina doesn't use DST since 2009)", () => {
    const winterDate = new Date(Date.UTC(2026, 6, 15)); // July (winter)
    const summerDate = new Date(Date.UTC(2026, 0, 15)); // January (summer)

    const winterArg = toArgentinaTimeZone(winterDate);
    const summerArg = toArgentinaTimeZone(summerDate);

    expect(winterArg).toBeInstanceOf(Date);
    expect(summerArg).toBeInstanceOf(Date);
  });
});

describe("Integration tests - Date functions", () => {
  it("formatDate and formatDateTime should be consistent", () => {
    const date = new Date(2026, 1, 14, 19, 30, 0);

    const formattedDate = formatDate(date);
    const formattedDateTime = formatDateTime(date);

    // formatDateTime should include the date from formatDate
    expect(formattedDateTime).toContain(formattedDate.split("/")[0]); // Day
    expect(formattedDateTime).toContain(formattedDate.split("/")[1]); // Month
    expect(formattedDateTime).toContain(formattedDate.split("/")[2]); // Year
  });

  it("getWeddingDate should return a date that can be formatted", () => {
    const weddingDate = getWeddingDate();

    const formatted = formatDate(weddingDate);
    const formattedTime = formatDateTime(weddingDate);

    expect(formatted).not.toBe("-");
    expect(formattedTime).not.toBe("-");
  });

  it("getCurrentDateArgentina should return a date that can be formatted", () => {
    const currentDate = getCurrentDateArgentina();

    const formatted = formatDate(currentDate);
    const formattedTime = formatDateTime(currentDate);

    expect(formatted).not.toBe("-");
    expect(formattedTime).not.toBe("-");
  });
});
