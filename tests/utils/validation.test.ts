/**
 * Tests for utils/validation.ts
 *
 * CRITICAL: These functions handle data sanitization and validation.
 * Tests cover XSS prevention, SQL injection protection, and schema validation.
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  sanitizeString,
  sanitizeHtml,
  sanitizeName,
  sanitizePhone,
  sanitizeId,
  sanitizeSearch,
  validateAndSanitize,
  invitationSchema,
  invitationResponseSchema,
  adminLoginSchema,
  searchSchema,
  messageSchema,
  invitationIdSchema,
  tokenSchema,
} from "@/utils/validation";

describe("sanitizeString", () => {
  it("should remove extra spaces", () => {
    expect(sanitizeString("  hello   world  ")).toBe("hello world");
  });

  it("should remove dangerous HTML characters", () => {
    expect(sanitizeString("<script>alert('xss')</script>")).toBe(
      "scriptalert('xss')/script",
    );
  });

  it("should normalize multiple spaces", () => {
    expect(sanitizeString("test    multiple     spaces")).toBe(
      "test multiple spaces",
    );
  });

  it("should handle empty strings", () => {
    expect(sanitizeString("")).toBe("");
  });

  it("should handle strings with only spaces", () => {
    expect(sanitizeString("     ")).toBe("");
  });
});

describe("sanitizeHtml", () => {
  it("should escape all HTML characters", () => {
    expect(sanitizeHtml("<script>")).toBe("&lt;script&gt;");
  });

  it("should escape ampersands", () => {
    expect(sanitizeHtml("Tom & Jerry")).toBe("Tom &amp; Jerry");
  });

  it("should escape quotes", () => {
    expect(sanitizeHtml('"Hello"')).toBe("&quot;Hello&quot;");
  });

  it("should escape apostrophes", () => {
    expect(sanitizeHtml("It's")).toBe("It&#x27;s");
  });

  it("should escape slashes", () => {
    expect(sanitizeHtml("a/b")).toBe("a&#x2F;b");
  });

  it("should handle strings with multiple dangerous characters", () => {
    expect(sanitizeHtml('<a href="/test">Link</a>')).toBe(
      "&lt;a href=&quot;&#x2F;test&quot;&gt;Link&lt;&#x2F;a&gt;",
    );
  });
});

describe("sanitizeName", () => {
  it("should remove dangerous characters", () => {
    expect(sanitizeName('John "The Boss" Doe')).toBe("John The Boss Doe");
  });

  it("should limit length to 100 characters", () => {
    const longName = "a".repeat(150);
    expect(sanitizeName(longName)).toBe("a".repeat(100));
  });

  it("should normalize spaces", () => {
    expect(sanitizeName("Mary   Jane   Watson")).toBe("Mary Jane Watson");
  });

  it("should remove < and >", () => {
    expect(sanitizeName("John <script>")).toBe("John script");
  });

  it("should preserve valid characters", () => {
    expect(sanitizeName("María José López-Pérez")).toBe(
      "María José López-Pérez",
    );
  });

  it("should handle names with accents and special characters", () => {
    expect(sanitizeName("François O'Connor")).toBe("François OConnor");
  });
});

describe("sanitizePhone", () => {
  it("should allow numbers and valid characters", () => {
    expect(sanitizePhone("+54 11 1234-5678")).toBe("+54 11 1234-5678");
  });

  it("should remove letters", () => {
    expect(sanitizePhone("123abc456")).toBe("123456");
  });

  it("should allow parentheses", () => {
    expect(sanitizePhone("(011) 1234-5678")).toBe("(011) 1234-5678");
  });

  it("should limit to 20 characters", () => {
    const longPhone = "1".repeat(30);
    expect(sanitizePhone(longPhone)).toBe("1".repeat(20));
  });

  it("should remove dangerous special characters", () => {
    expect(sanitizePhone("123<>456")).toBe("123456");
  });

  it("should handle international format", () => {
    expect(sanitizePhone("+1-555-123-4567")).toBe("+1-555-123-4567");
  });
});

describe("sanitizeId", () => {
  it("should allow alphanumerics and hyphens", () => {
    expect(sanitizeId("user-123_test")).toBe("user-123_test");
  });

  it("should remove spaces", () => {
    expect(sanitizeId("user 123")).toBe("user123");
  });

  it("should remove special characters", () => {
    expect(sanitizeId("user@123#test")).toBe("user123test");
  });

  it("should limit to 50 characters", () => {
    const longId = "a".repeat(100);
    expect(sanitizeId(longId)).toBe("a".repeat(50));
  });

  it("should preserve case", () => {
    expect(sanitizeId("UserId-123_TEST")).toBe("UserId-123_TEST");
  });
});

describe("sanitizeSearch", () => {
  it("should remove dangerous characters", () => {
    expect(sanitizeSearch("<script>alert('xss')</script>")).toBe(
      "scriptalert(xss)script",
    );
  });

  it("should normalize spaces", () => {
    expect(sanitizeSearch("search   with    spaces")).toBe(
      "search with spaces",
    );
  });

  it("should limit to 100 characters", () => {
    const longSearch = "a".repeat(150);
    expect(sanitizeSearch(longSearch)).toBe("a".repeat(100));
  });

  it("should remove percent signs (SQL injection protection)", () => {
    expect(sanitizeSearch("%SELECT%")).toBe("SELECT");
  });

  it("should remove semicolons (SQL injection protection)", () => {
    expect(sanitizeSearch("test; DROP TABLE")).toBe("test DROP TABLE");
  });

  it("should remove backslashes", () => {
    expect(sanitizeSearch("test\\escape")).toBe("testescape");
  });

  it("should remove ampersands", () => {
    expect(sanitizeSearch("Tom & Jerry")).toBe("Tom Jerry");
  });

  it("should remove quotes", () => {
    expect(sanitizeSearch(`"test" 'value'`)).toBe("test value");
  });

  it("should remove forward slashes", () => {
    expect(sanitizeSearch("path/to/file")).toBe("pathtofile");
  });
});

describe("validateAndSanitize", () => {
  it("should return success true when data is valid", () => {
    const result = validateAndSanitize(searchSchema, {
      searchTerm: "John Doe",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.searchTerm).toBe("John Doe");
    }
  });

  it("should return success false when data is invalid", () => {
    const result = validateAndSanitize(searchSchema, {
      searchTerm: "123<>invalid",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
    }
  });

  it("should return error when required field is missing", () => {
    const result = validateAndSanitize(invitationSchema, {
      maxGuests: 5,
    });
    expect(result.success).toBe(false);
  });

  it("should handle nested validation errors", () => {
    const result = validateAndSanitize(invitationSchema, {
      guestName: "",
      maxGuests: 0,
    });
    expect(result.success).toBe(false);
  });

  it("should handle ZodError with empty issues array", () => {
    // Edge case: ZodError with no issues (shouldn't happen but defensive)
    const mockSchema = z.string().refine(() => {
      const error = new z.ZodError([]);
      throw error;
    });

    const result = validateAndSanitize(mockSchema, "test");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Invalid input data");
    }
  });

  it("should handle non-Zod errors", () => {
    const mockSchema = z.string().refine(() => {
      throw new Error("Regular error");
    });

    const result = validateAndSanitize(mockSchema, "test");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Unknown validation error");
    }
  });
});

describe("invitationSchema", () => {
  it("should validate a valid invitation", () => {
    const data = {
      guestName: "John Doe",
      maxGuests: 5,
    };
    const result = invitationSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("should trim guest name", () => {
    const data = {
      guestName: "  John Doe  ",
      maxGuests: 5,
    };
    const result = invitationSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.guestName).toBe("John Doe");
    }
  });

  it("should reject empty names", () => {
    const data = {
      guestName: "",
      maxGuests: 5,
    };
    const result = invitationSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("should reject very long names", () => {
    const data = {
      guestName: "a".repeat(101),
      maxGuests: 5,
    };
    const result = invitationSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("should accept maxGuests between 1 and 10", () => {
    for (let i = 1; i <= 10; i++) {
      const result = invitationSchema.safeParse({
        guestName: "Test",
        maxGuests: i,
      });
      expect(result.success).toBe(true);
    }
  });

  it("should reject maxGuests < 1", () => {
    const result = invitationSchema.safeParse({
      guestName: "Test",
      maxGuests: 0,
    });
    expect(result.success).toBe(false);
  });

  it("should reject maxGuests > 10", () => {
    const result = invitationSchema.safeParse({
      guestName: "Test",
      maxGuests: 11,
    });
    expect(result.success).toBe(false);
  });

  it("should coerce string maxGuests to number", () => {
    const result = invitationSchema.safeParse({
      guestName: "Test",
      maxGuests: "5",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.maxGuests).toBe(5);
    }
  });

  it("should handle optional fields", () => {
    const result = invitationSchema.safeParse({
      guestName: "Test",
      maxGuests: 5,
      guestNickname: "Tester",
      guestPhone: "+1234567890",
    });
    expect(result.success).toBe(true);
  });
});

describe("invitationResponseSchema", () => {
  it("should validate attendance response", () => {
    const data = {
      isAttending: true,
      guestCount: 3,
      message: "We'll be there!",
    };
    const result = invitationResponseSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("should accept response without message", () => {
    const data = {
      isAttending: false,
    };
    const result = invitationResponseSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("should reject very long messages", () => {
    const data = {
      isAttending: true,
      message: "a".repeat(501),
    };
    const result = invitationResponseSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("should accept declining without guest count", () => {
    const result = invitationResponseSchema.safeParse({
      isAttending: false,
    });
    expect(result.success).toBe(true);
  });
});

describe("adminLoginSchema", () => {
  it("should validate valid credentials", () => {
    const data = {
      username: "admin123",
      password: "securePassword123!",
    };
    const result = adminLoginSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("should reject short usernames", () => {
    const data = {
      username: "ab",
      password: "password123",
    };
    const result = adminLoginSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("should reject long usernames", () => {
    const data = {
      username: "a".repeat(51),
      password: "password123",
    };
    const result = adminLoginSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("should reject usernames with invalid characters", () => {
    const data = {
      username: "admin@123",
      password: "password123",
    };
    const result = adminLoginSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("should accept hyphens and underscores in username", () => {
    const data = {
      username: "admin_test-123",
      password: "password123",
    };
    const result = adminLoginSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("should reject short passwords", () => {
    const data = {
      username: "admin",
      password: "short",
    };
    const result = adminLoginSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("should accept optional honeypot", () => {
    const data = {
      username: "admin",
      password: "password123",
      honeypotValue: "",
    };
    const result = adminLoginSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});

describe("messageSchema", () => {
  it("should validate a valid message", () => {
    const data = {
      message: "Congratulations to the newlyweds!",
      type: "wish" as const,
    };
    const result = messageSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("should reject empty messages", () => {
    const data = {
      message: "",
    };
    const result = messageSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("should reject messages with HTML", () => {
    const data = {
      message: "<script>alert('xss')</script>",
    };
    const result = messageSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("should accept messages without type", () => {
    const data = {
      message: "A random message",
    };
    const result = messageSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("should validate allowed types", () => {
    const types = ["wish", "memory", "advice"] as const;
    types.forEach((type) => {
      const result = messageSchema.safeParse({
        message: "Test",
        type,
      });
      expect(result.success).toBe(true);
    });
  });
});

describe("invitationIdSchema", () => {
  it("should validate alphanumeric IDs with hyphens", () => {
    const result = invitationIdSchema.safeParse("inv-123_test");
    expect(result.success).toBe(true);
  });

  it("should reject empty IDs", () => {
    const result = invitationIdSchema.safeParse("");
    expect(result.success).toBe(false);
  });

  it("should reject IDs with special characters", () => {
    const result = invitationIdSchema.safeParse("inv@123#test");
    expect(result.success).toBe(false);
  });

  it("should reject very long IDs", () => {
    const result = invitationIdSchema.safeParse("a".repeat(51));
    expect(result.success).toBe(false);
  });
});

describe("tokenSchema", () => {
  it("should validate alphanumeric tokens", () => {
    const result = tokenSchema.safeParse("abc123-xyz_789");
    expect(result.success).toBe(true);
  });

  it("should reject empty tokens", () => {
    const result = tokenSchema.safeParse("");
    expect(result.success).toBe(false);
  });

  it("should reject tokens with spaces", () => {
    const result = tokenSchema.safeParse("abc 123");
    expect(result.success).toBe(false);
  });

  it("should reject very long tokens", () => {
    const result = tokenSchema.safeParse("a".repeat(101));
    expect(result.success).toBe(false);
  });
});
