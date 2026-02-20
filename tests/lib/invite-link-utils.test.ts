import { describe, it, expect } from "vitest";
import {
  convertDaysToHours,
  parseMaxUses,
  buildInviteLinkUrl,
  formatLinkDescription,
} from "@/lib/invite-link-utils";

// ---------------------------------------------------------------------------
// convertDaysToHours() tests
// ---------------------------------------------------------------------------

describe("convertDaysToHours", () => {
  describe("valid conversions", () => {
    it("converts 1 day to 24 hours", () => {
      expect(convertDaysToHours(1)).toBe(24);
    });

    it("converts 7 days to 168 hours", () => {
      expect(convertDaysToHours(7)).toBe(168);
    });

    it("converts 30 days to 720 hours", () => {
      expect(convertDaysToHours(30)).toBe(720);
    });

    it("converts 14 days to 336 hours", () => {
      expect(convertDaysToHours(14)).toBe(336);
    });
  });

  describe("edge cases", () => {
    it("converts 0 days to 0 hours", () => {
      expect(convertDaysToHours(0)).toBe(0);
    });

    it("handles negative days", () => {
      expect(convertDaysToHours(-1)).toBe(-24);
      expect(convertDaysToHours(-7)).toBe(-168);
    });

    it("handles fractional days", () => {
      expect(convertDaysToHours(0.5)).toBe(12);
      expect(convertDaysToHours(1.5)).toBe(36);
    });

    it("handles very large numbers", () => {
      expect(convertDaysToHours(365)).toBe(8760);
      expect(convertDaysToHours(1000)).toBe(24000);
    });
  });
});

// ---------------------------------------------------------------------------
// parseMaxUses() tests
// ---------------------------------------------------------------------------

describe("parseMaxUses", () => {
  describe("unlimited uses", () => {
    it("returns undefined when isUnlimited is true", () => {
      expect(parseMaxUses("5", true)).toBeUndefined();
      expect(parseMaxUses("10", true)).toBeUndefined();
      expect(parseMaxUses("1", true)).toBeUndefined();
    });

    it("ignores input value when unlimited", () => {
      expect(parseMaxUses("999", true)).toBeUndefined();
      expect(parseMaxUses("", true)).toBeUndefined();
      expect(parseMaxUses("abc", true)).toBeUndefined();
    });
  });

  describe("limited uses (valid input)", () => {
    it("parses positive integers", () => {
      expect(parseMaxUses("1", false)).toBe(1);
      expect(parseMaxUses("5", false)).toBe(5);
      expect(parseMaxUses("10", false)).toBe(10);
      expect(parseMaxUses("999", false)).toBe(999);
    });

    it("handles leading zeros", () => {
      expect(parseMaxUses("05", false)).toBe(5);
      expect(parseMaxUses("010", false)).toBe(10);
    });

    it("handles leading/trailing whitespace", () => {
      expect(parseMaxUses(" 5 ", false)).toBe(5);
      expect(parseMaxUses("\t10\n", false)).toBe(10);
    });
  });

  describe("limited uses (invalid input)", () => {
    it("returns 1 for empty string", () => {
      expect(parseMaxUses("", false)).toBe(1);
    });

    it("returns 1 for non-numeric strings", () => {
      expect(parseMaxUses("abc", false)).toBe(1);
      expect(parseMaxUses("hello", false)).toBe(1);
      expect(parseMaxUses("NaN", false)).toBe(1);
    });

    it("returns 1 for zero", () => {
      expect(parseMaxUses("0", false)).toBe(1);
    });

    it("returns 1 for negative numbers", () => {
      expect(parseMaxUses("-5", false)).toBe(1);
      expect(parseMaxUses("-1", false)).toBe(1);
    });

    it("returns 1 for special characters", () => {
      expect(parseMaxUses("@#$", false)).toBe(1);
      expect(parseMaxUses("!!!", false)).toBe(1);
    });
  });

  describe("edge cases", () => {
    it("truncates decimal strings (parseInt behavior)", () => {
      expect(parseMaxUses("5.7", false)).toBe(5);
      expect(parseMaxUses("10.99", false)).toBe(10);
    });

    it("handles mixed valid/invalid characters", () => {
      expect(parseMaxUses("5abc", false)).toBe(5);
      expect(parseMaxUses("10xyz", false)).toBe(10);
    });

    it("handles very large numbers", () => {
      expect(parseMaxUses("999999", false)).toBe(999999);
    });
  });
});

// ---------------------------------------------------------------------------
// buildInviteLinkUrl() tests
// ---------------------------------------------------------------------------

describe("buildInviteLinkUrl", () => {
  describe("with explicit baseUrl", () => {
    it("builds URL with HTTPS domain", () => {
      const url = buildInviteLinkUrl("abc123", "https://example.com");
      expect(url).toBe("https://example.com/join/abc123");
    });

    it("builds URL with HTTP domain", () => {
      const url = buildInviteLinkUrl("xyz789", "http://localhost:3000");
      expect(url).toBe("http://localhost:3000/join/xyz789");
    });

    it("handles trailing slash in baseUrl", () => {
      const url = buildInviteLinkUrl("token123", "https://example.com/");
      expect(url).toBe("https://example.com//join/token123");
    });

    it("handles different token formats", () => {
      expect(buildInviteLinkUrl("short", "https://example.com")).toBe(
        "https://example.com/join/short",
      );
      expect(
        buildInviteLinkUrl(
          "very-long-token-with-dashes",
          "https://example.com",
        ),
      ).toBe("https://example.com/join/very-long-token-with-dashes");
    });
  });

  describe("without explicit baseUrl", () => {
    it("uses fallback from env or window.location.origin", () => {
      const url = buildInviteLinkUrl("token123");
      // In test environment (jsdom), window.location.origin is available
      // In production, NEXT_PUBLIC_APP_URL or window.location.origin is used
      expect(url).toMatch(/\/join\/token123$/);
    });
  });

  describe("edge cases", () => {
    it("handles empty token", () => {
      const url = buildInviteLinkUrl("", "https://example.com");
      expect(url).toBe("https://example.com/join/");
    });

    it("handles special characters in token", () => {
      const url = buildInviteLinkUrl("token@#$", "https://example.com");
      expect(url).toBe("https://example.com/join/token@#$");
    });

    it("handles URL with port", () => {
      const url = buildInviteLinkUrl("token123", "http://localhost:3000");
      expect(url).toBe("http://localhost:3000/join/token123");
    });

    it("handles subdomain", () => {
      const url = buildInviteLinkUrl("token123", "https://app.example.com");
      expect(url).toBe("https://app.example.com/join/token123");
    });
  });
});

// ---------------------------------------------------------------------------
// formatLinkDescription() tests
// ---------------------------------------------------------------------------

describe("formatLinkDescription", () => {
  describe("expiration text", () => {
    it("uses singular for 1 day", () => {
      const desc = formatLinkDescription(1, "1", false);
      expect(desc).toContain("El link expira en 1 día.");
    });

    it("uses plural for multiple days", () => {
      const desc = formatLinkDescription(7, "5", false);
      expect(desc).toContain("El link expira en 7 días.");
    });

    it("handles 0 days", () => {
      const desc = formatLinkDescription(0, "1", false);
      expect(desc).toContain("El link expira en 0 días.");
    });

    it("handles large number of days", () => {
      const desc = formatLinkDescription(365, "1", false);
      expect(desc).toContain("El link expira en 365 días.");
    });
  });

  describe("uses text (limited)", () => {
    it("uses singular for 1 use", () => {
      const desc = formatLinkDescription(7, "1", false);
      expect(desc).toContain("Máximo 1 uso.");
    });

    it("uses plural for multiple uses", () => {
      const desc = formatLinkDescription(7, "5", false);
      expect(desc).toContain("Máximo 5 usos.");
    });

    it("handles 2 uses (boundary)", () => {
      const desc = formatLinkDescription(7, "2", false);
      expect(desc).toContain("Máximo 2 usos.");
    });

    it("handles large number of uses", () => {
      const desc = formatLinkDescription(7, "999", false);
      expect(desc).toContain("Máximo 999 usos.");
    });
  });

  describe("uses text (unlimited)", () => {
    it("shows unlimited text when isUnlimited is true", () => {
      const desc = formatLinkDescription(7, "5", true);
      expect(desc).toContain("Usos ilimitados.");
    });

    it("ignores maxUses input when unlimited", () => {
      const desc = formatLinkDescription(7, "999", true);
      expect(desc).toContain("Usos ilimitados.");
      expect(desc).not.toContain("999");
    });
  });

  describe("full format", () => {
    it("combines expiration and uses (1 day, 1 use)", () => {
      const desc = formatLinkDescription(1, "1", false);
      expect(desc).toBe("El link expira en 1 día. Máximo 1 uso.");
    });

    it("combines expiration and uses (7 days, 5 uses)", () => {
      const desc = formatLinkDescription(7, "5", false);
      expect(desc).toBe("El link expira en 7 días. Máximo 5 usos.");
    });

    it("combines expiration and unlimited uses", () => {
      const desc = formatLinkDescription(14, "10", true);
      expect(desc).toBe("El link expira en 14 días. Usos ilimitados.");
    });

    it("includes space between sentences", () => {
      const desc = formatLinkDescription(7, "5", false);
      expect(desc).toMatch(/\.\s+[A-Z]/); // Period followed by space and capital letter
    });
  });

  describe("edge cases", () => {
    it("handles invalid maxUses string (NaN)", () => {
      const desc = formatLinkDescription(7, "abc", false);
      // parseInt("abc") = NaN, should show "Máximo NaN usos"
      expect(desc).toContain("Máximo NaN usos.");
    });

    it("handles empty maxUses string", () => {
      const desc = formatLinkDescription(7, "", false);
      // parseInt("") = NaN
      expect(desc).toContain("Máximo NaN usos.");
    });

    it("handles 0 uses", () => {
      const desc = formatLinkDescription(7, "0", false);
      expect(desc).toContain("Máximo 0 usos.");
    });

    it("handles negative uses", () => {
      const desc = formatLinkDescription(7, "-5", false);
      expect(desc).toContain("Máximo -5 usos.");
    });
  });

  describe("realistic scenarios", () => {
    it("formats typical 7-day, 1-use link", () => {
      const desc = formatLinkDescription(7, "1", false);
      expect(desc).toBe("El link expira en 7 días. Máximo 1 uso.");
    });

    it("formats typical 3-day, unlimited link", () => {
      const desc = formatLinkDescription(3, "1", true);
      expect(desc).toBe("El link expira en 3 días. Usos ilimitados.");
    });

    it("formats 30-day, 10-uses link", () => {
      const desc = formatLinkDescription(30, "10", false);
      expect(desc).toBe("El link expira en 30 días. Máximo 10 usos.");
    });

    it("formats same-day expiration (1 day)", () => {
      const desc = formatLinkDescription(1, "5", false);
      expect(desc).toBe("El link expira en 1 día. Máximo 5 usos.");
    });
  });
});
