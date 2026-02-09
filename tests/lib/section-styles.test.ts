/**
 * Tests for lib/section-styles.ts
 *
 * Tests styling utilities for sections with alternate backgrounds.
 * Ensures correct Tailwind classes and HeroUI button props are returned.
 */

import { describe, it, expect } from "vitest";
import { getAlternateBgClasses } from "@/lib/section-styles";

describe("getAlternateBgClasses", () => {
  describe("with alternate background enabled", () => {
    it("should return secondary background classes", () => {
      const result = getAlternateBgClasses(true);

      expect(result.container).toBe("bg-secondary text-secondary-foreground");
    });

    it("should return secondary foreground text class", () => {
      const result = getAlternateBgClasses(true);

      expect(result.text).toBe("text-secondary-foreground");
    });

    it("should return primary button color", () => {
      const result = getAlternateBgClasses(true);

      expect(result.buttonColor).toBe("primary");
    });

    it("should return bordered button variant", () => {
      const result = getAlternateBgClasses(true);

      expect(result.buttonVariant).toBe("bordered");
    });

    it("should return correct button className with hover states", () => {
      const result = getAlternateBgClasses(true);

      expect(result.buttonClassName).toBe(
        "border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary",
      );
    });

    it("should return all required properties", () => {
      const result = getAlternateBgClasses(true);

      expect(result).toHaveProperty("container");
      expect(result).toHaveProperty("text");
      expect(result).toHaveProperty("buttonColor");
      expect(result).toHaveProperty("buttonVariant");
      expect(result).toHaveProperty("buttonClassName");
    });
  });

  describe("with alternate background disabled (default)", () => {
    it("should return empty container class", () => {
      const result = getAlternateBgClasses(false);

      expect(result.container).toBe("");
    });

    it("should return empty text class", () => {
      const result = getAlternateBgClasses(false);

      expect(result.text).toBe("");
    });

    it("should return primary button color", () => {
      const result = getAlternateBgClasses(false);

      expect(result.buttonColor).toBe("primary");
    });

    it("should return solid button variant", () => {
      const result = getAlternateBgClasses(false);

      expect(result.buttonVariant).toBe("solid");
    });

    it("should return empty button className", () => {
      const result = getAlternateBgClasses(false);

      expect(result.buttonClassName).toBe("");
    });

    it("should return all required properties", () => {
      const result = getAlternateBgClasses(false);

      expect(result).toHaveProperty("container");
      expect(result).toHaveProperty("text");
      expect(result).toHaveProperty("buttonColor");
      expect(result).toHaveProperty("buttonVariant");
      expect(result).toHaveProperty("buttonClassName");
    });
  });

  describe("consistency and type safety", () => {
    it("should always return same structure for true", () => {
      const result1 = getAlternateBgClasses(true);
      const result2 = getAlternateBgClasses(true);

      expect(result1).toEqual(result2);
    });

    it("should always return same structure for false", () => {
      const result1 = getAlternateBgClasses(false);
      const result2 = getAlternateBgClasses(false);

      expect(result1).toEqual(result2);
    });

    it("should return different objects for true vs false", () => {
      const resultTrue = getAlternateBgClasses(true);
      const resultFalse = getAlternateBgClasses(false);

      expect(resultTrue).not.toEqual(resultFalse);
    });

    it("should have consistent button color (primary) regardless of background", () => {
      const resultTrue = getAlternateBgClasses(true);
      const resultFalse = getAlternateBgClasses(false);

      expect(resultTrue.buttonColor).toBe("primary");
      expect(resultFalse.buttonColor).toBe("primary");
    });

    it("should have different button variants for alternate vs default", () => {
      const resultTrue = getAlternateBgClasses(true);
      const resultFalse = getAlternateBgClasses(false);

      expect(resultTrue.buttonVariant).toBe("bordered");
      expect(resultFalse.buttonVariant).toBe("solid");
    });
  });

  describe("Tailwind class validation", () => {
    it("should use valid Tailwind background classes", () => {
      const result = getAlternateBgClasses(true);

      // Check for valid Tailwind prefixes
      expect(result.container).toMatch(/^(bg-|text-)/);
    });

    it("should use valid Tailwind text color classes", () => {
      const result = getAlternateBgClasses(true);

      expect(result.text).toMatch(/^text-/);
    });

    it("should use valid Tailwind utility classes in button", () => {
      const result = getAlternateBgClasses(true);

      // Should contain border, text, and hover utilities
      expect(result.buttonClassName).toContain("border-");
      expect(result.buttonClassName).toContain("text-");
      expect(result.buttonClassName).toContain("hover:");
    });

    it("should not have trailing or leading spaces in classes", () => {
      const resultTrue = getAlternateBgClasses(true);
      const resultFalse = getAlternateBgClasses(false);

      expect(resultTrue.container.trim()).toBe(resultTrue.container);
      expect(resultTrue.text.trim()).toBe(resultTrue.text);
      expect(resultTrue.buttonClassName.trim()).toBe(
        resultTrue.buttonClassName,
      );

      expect(resultFalse.container.trim()).toBe(resultFalse.container);
      expect(resultFalse.text.trim()).toBe(resultFalse.text);
      expect(resultFalse.buttonClassName.trim()).toBe(
        resultFalse.buttonClassName,
      );
    });
  });

  describe("HeroUI button props validation", () => {
    it("should return valid HeroUI button color", () => {
      const resultTrue = getAlternateBgClasses(true);
      const resultFalse = getAlternateBgClasses(false);

      // HeroUI valid colors: default, primary, secondary, success, warning, danger
      const validColors = [
        "default",
        "primary",
        "secondary",
        "success",
        "warning",
        "danger",
      ];

      expect(validColors).toContain(resultTrue.buttonColor);
      expect(validColors).toContain(resultFalse.buttonColor);
    });

    it("should return valid HeroUI button variant", () => {
      const resultTrue = getAlternateBgClasses(true);
      const resultFalse = getAlternateBgClasses(false);

      // HeroUI valid variants: solid, bordered, light, flat, faded, shadow, ghost
      const validVariants = [
        "solid",
        "bordered",
        "light",
        "flat",
        "faded",
        "shadow",
        "ghost",
      ];

      expect(validVariants).toContain(resultTrue.buttonVariant);
      expect(validVariants).toContain(resultFalse.buttonVariant);
    });
  });

  describe("edge cases and type coercion", () => {
    it("should handle truthy values as true", () => {
      const result = getAlternateBgClasses(1 as any);

      expect(result.container).toBe("bg-secondary text-secondary-foreground");
    });

    it("should handle falsy values as false", () => {
      const result = getAlternateBgClasses(0 as any);

      expect(result.container).toBe("");
    });

    it("should handle string 'true' as truthy", () => {
      const result = getAlternateBgClasses("true" as any);

      expect(result.container).toBe("bg-secondary text-secondary-foreground");
    });

    it("should handle empty string as falsy", () => {
      const result = getAlternateBgClasses("" as any);

      expect(result.container).toBe("");
    });

    it("should handle null as falsy", () => {
      const result = getAlternateBgClasses(null as any);

      expect(result.container).toBe("");
    });

    it("should handle undefined as falsy", () => {
      const result = getAlternateBgClasses(undefined as any);

      expect(result.container).toBe("");
    });
  });

  describe("integration scenarios", () => {
    it("should provide classes that can be combined with cn()", () => {
      const result = getAlternateBgClasses(true);

      // All classes should be space-separated strings or empty
      expect(typeof result.container).toBe("string");
      expect(typeof result.text).toBe("string");
      expect(typeof result.buttonClassName).toBe("string");
    });

    it("should work in a realistic component scenario", () => {
      const hasAlternateBg = true;
      const styles = getAlternateBgClasses(hasAlternateBg);

      // Simulate using these in a component
      const containerClass = `min-h-screen ${styles.container}`;
      const titleClass = `text-4xl font-bold ${styles.text}`;

      expect(containerClass).toContain("bg-secondary");
      expect(titleClass).toContain("text-secondary-foreground");
    });

    it("should provide consistent styling across multiple calls", () => {
      const styles1 = getAlternateBgClasses(true);
      const styles2 = getAlternateBgClasses(true);
      const styles3 = getAlternateBgClasses(true);

      expect(styles1).toEqual(styles2);
      expect(styles2).toEqual(styles3);
    });
  });
});
