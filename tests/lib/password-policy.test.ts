/**
 * Tests for lib/password-policy.ts
 *
 * CRITICAL: Only testing PURE logic (password validation)
 */

import { describe, it, expect } from "vitest";
import {
  validatePasswordStrength,
  getPasswordRequirements,
} from "@/lib/password-policy";

describe("password-policy", () => {
  describe("validatePasswordStrength", () => {
    it("should accept valid password with all requirements", () => {
      const result = validatePasswordStrength("Password123!");

      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it("should accept password with multiple special characters", () => {
      const result = validatePasswordStrength("P@ssw0rd!#$");

      expect(result.valid).toBe(true);
    });

    it("should reject password without uppercase", () => {
      const result = validatePasswordStrength("password123!");

      expect(result.valid).toBe(false);
      expect(result.message).toBe(
        "La contraseña debe incluir mayúsculas, minúsculas, números y caracteres especiales",
      );
    });

    it("should reject password without lowercase", () => {
      const result = validatePasswordStrength("PASSWORD123!");

      expect(result.valid).toBe(false);
      expect(result.message).toBe(
        "La contraseña debe incluir mayúsculas, minúsculas, números y caracteres especiales",
      );
    });

    it("should reject password without numbers", () => {
      const result = validatePasswordStrength("Password!");

      expect(result.valid).toBe(false);
      expect(result.message).toBe(
        "La contraseña debe incluir mayúsculas, minúsculas, números y caracteres especiales",
      );
    });

    it("should reject password without special characters", () => {
      const result = validatePasswordStrength("Password123");

      expect(result.valid).toBe(false);
      expect(result.message).toBe(
        "La contraseña debe incluir mayúsculas, minúsculas, números y caracteres especiales",
      );
    });

    it("should reject password with only one requirement missing", () => {
      const passwords = [
        "password123!", // No uppercase
        "PASSWORD123!", // No lowercase
        "Password!", // No number
        "Password123", // No special char
      ];

      passwords.forEach((pwd) => {
        const result = validatePasswordStrength(pwd);
        expect(result.valid).toBe(false);
      });
    });

    it("should accept password with unicode special characters", () => {
      const result = validatePasswordStrength("Pässw0rd™");

      expect(result.valid).toBe(true);
    });

    it("should accept very long password with all requirements", () => {
      const result = validatePasswordStrength(
        "ThisIsAVeryLongPassword123!WithSpecialChars",
      );

      expect(result.valid).toBe(true);
    });

    it("should reject empty string", () => {
      const result = validatePasswordStrength("");

      expect(result.valid).toBe(false);
    });

    it("should reject password with spaces but no other requirements", () => {
      const result = validatePasswordStrength("password 123");

      expect(result.valid).toBe(false);
    });
  });

  describe("getPasswordRequirements", () => {
    it("should return all true for valid password", () => {
      const result = getPasswordRequirements("Password123!");

      expect(result).toEqual({
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSpecial: true,
      });
    });

    it("should detect missing uppercase", () => {
      const result = getPasswordRequirements("password123!");

      expect(result.hasUppercase).toBe(false);
      expect(result.hasLowercase).toBe(true);
      expect(result.hasNumber).toBe(true);
      expect(result.hasSpecial).toBe(true);
    });

    it("should detect missing lowercase", () => {
      const result = getPasswordRequirements("PASSWORD123!");

      expect(result.hasUppercase).toBe(true);
      expect(result.hasLowercase).toBe(false);
      expect(result.hasNumber).toBe(true);
      expect(result.hasSpecial).toBe(true);
    });

    it("should detect missing number", () => {
      const result = getPasswordRequirements("Password!");

      expect(result.hasUppercase).toBe(true);
      expect(result.hasLowercase).toBe(true);
      expect(result.hasNumber).toBe(false);
      expect(result.hasSpecial).toBe(true);
    });

    it("should detect missing special character", () => {
      const result = getPasswordRequirements("Password123");

      expect(result.hasUppercase).toBe(true);
      expect(result.hasLowercase).toBe(true);
      expect(result.hasNumber).toBe(true);
      expect(result.hasSpecial).toBe(false);
    });

    it("should return all false for weak password", () => {
      const result = getPasswordRequirements("abc");

      expect(result).toEqual({
        hasUppercase: false,
        hasLowercase: true,
        hasNumber: false,
        hasSpecial: false,
      });
    });

    it("should detect multiple uppercase letters", () => {
      const result = getPasswordRequirements("PASSWORD");

      expect(result.hasUppercase).toBe(true);
      expect(result.hasLowercase).toBe(false);
    });

    it("should detect multiple numbers", () => {
      const result = getPasswordRequirements("123456");

      expect(result.hasNumber).toBe(true);
      expect(result.hasUppercase).toBe(false);
      expect(result.hasLowercase).toBe(false);
    });

    it("should detect multiple special characters", () => {
      const result = getPasswordRequirements("!@#$%^&*()");

      expect(result.hasSpecial).toBe(true);
      expect(result.hasUppercase).toBe(false);
      expect(result.hasLowercase).toBe(false);
      expect(result.hasNumber).toBe(false);
    });

    it("should handle empty string", () => {
      const result = getPasswordRequirements("");

      expect(result).toEqual({
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecial: false,
      });
    });
  });
});
