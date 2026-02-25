/**
 * Tests for lib/sanitize.ts
 *
 * Critical security functions - XSS prevention and input sanitization
 */

import { describe, it, expect } from "vitest";
import {
  sanitizeString,
  sanitizePhone,
  sanitizeText,
  sanitizeName,
  sanitizeObject,
} from "@/lib/sanitize";

describe("sanitize", () => {
  describe("sanitizeString", () => {
    it("should return empty string for non-string input", () => {
      expect(sanitizeString(null as any)).toBe("");
      expect(sanitizeString(undefined as any)).toBe("");
      expect(sanitizeString(123 as any)).toBe("");
      expect(sanitizeString({} as any)).toBe("");
      expect(sanitizeString([] as any)).toBe("");
    });

    it("should remove null bytes", () => {
      expect(sanitizeString("hello\0world")).toBe("helloworld");
      expect(sanitizeString("\0\0\0")).toBe("");
    });

    it("should remove control characters except whitespace", () => {
      // Control characters: \x00-\x08, \x0B, \x0C, \x0E-\x1F, \x7F
      expect(sanitizeString("hello\x00world")).toBe("helloworld");
      expect(sanitizeString("test\x1Bvalue")).toBe("testvalue");
      expect(sanitizeString("foo\x7Fbar")).toBe("foobar");
    });

    it("should preserve normal whitespace", () => {
      expect(sanitizeString("hello world")).toBe("hello world");
      expect(sanitizeString("line1\nline2")).toBe("line1\nline2");
      expect(sanitizeString("tab\there")).toBe("tab\there");
    });

    it("should trim whitespace", () => {
      expect(sanitizeString("  hello  ")).toBe("hello");
      expect(sanitizeString("\n\ntest\n\n")).toBe("test");
      expect(sanitizeString("\t\tvalue\t\t")).toBe("value");
    });

    it("should preserve letters, numbers, and common punctuation", () => {
      expect(sanitizeString("Hello World 123!")).toBe("Hello World 123!");
      expect(sanitizeString("Test-value_2024")).toBe("Test-value_2024");
      expect(sanitizeString("price: $50.00")).toBe("price: $50.00");
      expect(sanitizeString("email@example.com")).toBe("email@example.com");
    });

    it("should preserve unicode letters", () => {
      expect(sanitizeString("Ñoño español")).toBe("Ñoño español");
      expect(sanitizeString("日本語")).toBe("日本語");
      expect(sanitizeString("Привет мир")).toBe("Привет мир");
      expect(sanitizeString("café naïve résumé")).toBe("café naïve résumé");
    });

    it("should handle empty strings", () => {
      expect(sanitizeString("")).toBe("");
      expect(sanitizeString("   ")).toBe("");
    });

    it("should handle XSS attempts", () => {
      // Note: React escapes JSX content, but we sanitize anyway for defense in depth
      expect(sanitizeString("<script>alert('xss')</script>")).toBe(
        "<script>alert('xss')</script>",
      );
      // Control characters removed, safe HTML tags preserved
      expect(sanitizeString('"><img src=x onerror=alert(1)>')).toBe(
        '"><img src=x onerror=alert(1)>',
      );
    });
  });

  describe("sanitizePhone", () => {
    it("should return empty string for non-string input", () => {
      expect(sanitizePhone(null as any)).toBe("");
      expect(sanitizePhone(undefined as any)).toBe("");
      expect(sanitizePhone(123 as any)).toBe("");
    });

    it("should preserve valid phone characters", () => {
      expect(sanitizePhone("+1 (555) 123-4567")).toBe("+1 (555) 123-4567");
      expect(sanitizePhone("555-1234")).toBe("555-1234");
      expect(sanitizePhone("+54 11 1234-5678")).toBe("+54 11 1234-5678");
    });

    it("should remove invalid characters", () => {
      expect(sanitizePhone("555-CALL-NOW")).toBe("555--");
      expect(sanitizePhone("123abc456")).toBe("123456");
      expect(sanitizePhone("phone: 555-1234")).toBe(" 555-1234");
    });

    it("should trim whitespace", () => {
      expect(sanitizePhone("  555-1234  ")).toBe("555-1234");
    });

    it("should limit to 50 characters", () => {
      const longPhone = "1".repeat(100);
      expect(sanitizePhone(longPhone)).toHaveLength(50);
    });

    it("should handle empty strings", () => {
      expect(sanitizePhone("")).toBe("");
      expect(sanitizePhone("   ")).toBe("");
    });
  });

  describe("sanitizeText", () => {
    it("should delegate to sanitizeString", () => {
      expect(sanitizeText("hello world")).toBe("hello world");
      expect(sanitizeText("test\x00value")).toBe("testvalue");
    });

    it("should limit to default 500 characters", () => {
      const longText = "a".repeat(1000);
      expect(sanitizeText(longText)).toHaveLength(500);
    });

    it("should allow custom max length", () => {
      const text = "a".repeat(100);
      expect(sanitizeText(text, 50)).toHaveLength(50);
      expect(sanitizeText(text, 200)).toHaveLength(100);
    });

    it("should handle empty strings", () => {
      expect(sanitizeText("")).toBe("");
    });
  });

  describe("sanitizeName", () => {
    it("should return empty string for non-string input", () => {
      expect(sanitizeName(null as any)).toBe("");
      expect(sanitizeName(undefined as any)).toBe("");
      expect(sanitizeName(123 as any)).toBe("");
    });

    it("should preserve letters, numbers, spaces, hyphens, apostrophes", () => {
      expect(sanitizeName("John Doe")).toBe("John Doe");
      expect(sanitizeName("Mary-Jane")).toBe("Mary-Jane");
      expect(sanitizeName("O'Brien")).toBe("O'Brien");
      expect(sanitizeName("José García")).toBe("José García");
      expect(sanitizeName("Suite 123")).toBe("Suite 123");
    });

    it("should remove special characters", () => {
      expect(sanitizeName("John@Doe")).toBe("JohnDoe");
      expect(sanitizeName("Test#123")).toBe("Test123");
      expect(sanitizeName("Name (alias)")).toBe("Name alias");
    });

    it("should trim whitespace", () => {
      expect(sanitizeName("  John Doe  ")).toBe("John Doe");
    });

    it("should limit to default 100 characters", () => {
      const longName = "a".repeat(200);
      expect(sanitizeName(longName)).toHaveLength(100);
    });

    it("should allow custom max length", () => {
      const name = "a".repeat(50);
      expect(sanitizeName(name, 30)).toHaveLength(30);
      expect(sanitizeName(name, 100)).toHaveLength(50);
    });

    it("should handle empty strings", () => {
      expect(sanitizeName("")).toBe("");
      expect(sanitizeName("   ")).toBe("");
    });

    it("should preserve unicode names", () => {
      expect(sanitizeName("Ñoño")).toBe("Ñoño");
      expect(sanitizeName("François")).toBe("François");
      expect(sanitizeName("Müller")).toBe("Müller");
    });
  });

  describe("sanitizeObject", () => {
    it("should sanitize string values", () => {
      const input = {
        name: "hello\x00world",
        email: "test@example.com",
      };
      const result = sanitizeObject(input);
      expect(result.name).toBe("helloworld");
      expect(result.email).toBe("test@example.com");
    });

    it("should preserve non-string primitives", () => {
      const input = {
        count: 42,
        active: true,
        price: 19.99,
        nothing: null,
        missing: undefined,
      };
      const result = sanitizeObject(input);
      expect(result.count).toBe(42);
      expect(result.active).toBe(true);
      expect(result.price).toBe(19.99);
      expect(result.nothing).toBeNull();
      expect(result.missing).toBeUndefined();
    });

    it("should sanitize nested objects", () => {
      const input = {
        user: {
          name: "hello\x00world",
          address: {
            street: "test\x00value",
          },
        },
      };
      const result = sanitizeObject(input);
      expect(result.user.name).toBe("helloworld");
      expect(result.user.address.street).toBe("testvalue");
    });

    it("should sanitize string arrays", () => {
      const input = {
        tags: ["hello\x00world", "test\x00value", "clean"],
      };
      const result = sanitizeObject(input);
      expect(result.tags).toEqual(["helloworld", "testvalue", "clean"]);
    });

    it("should preserve non-string arrays", () => {
      const input = {
        numbers: [1, 2, 3],
        bools: [true, false, true],
      };
      const result = sanitizeObject(input);
      expect(result.numbers).toEqual([1, 2, 3]);
      expect(result.bools).toEqual([true, false, true]);
    });

    it("should sanitize arrays of objects", () => {
      const input = {
        users: [{ name: "hello\x00world" }, { name: "test\x00value" }],
      };
      const result = sanitizeObject(input);
      expect(result.users[0].name).toBe("helloworld");
      expect(result.users[1].name).toBe("testvalue");
    });

    it("should handle mixed arrays", () => {
      const input = {
        mixed: ["string\x00test", 123, { name: "nested\x00value" }, true],
      };
      const result = sanitizeObject(input);
      expect(result.mixed[0]).toBe("stringtest");
      expect(result.mixed[1]).toBe(123);
      expect((result.mixed[2] as any).name).toBe("nestedvalue");
      expect(result.mixed[3]).toBe(true);
    });

    it("should handle empty objects", () => {
      const result = sanitizeObject({});
      expect(result).toEqual({});
    });

    it("should handle deeply nested structures", () => {
      const input = {
        level1: {
          level2: {
            level3: {
              value: "deep\x00value",
            },
          },
        },
      };
      const result = sanitizeObject(input);
      expect(result.level1.level2.level3.value).toBe("deepvalue");
    });

    it("should preserve object structure", () => {
      const input = {
        a: "test",
        b: { c: "nested" },
        d: [1, 2, 3],
      };
      const result = sanitizeObject(input);
      expect(Object.keys(result)).toEqual(["a", "b", "d"]);
      expect(Object.keys(result.b)).toEqual(["c"]);
    });
  });
});
