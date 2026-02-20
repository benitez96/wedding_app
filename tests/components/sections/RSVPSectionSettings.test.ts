/**
 * Tests for RSVPSection.metadata.ts
 *
 * Covers: RSVPSectionSettingsSchema validation, per-state icon defaults,
 * step enable/disable, field limits and invalid icon rejection.
 */

import { describe, it, expect } from "vitest";
import { RSVPSectionSettingsSchema } from "@/components/sections/RSVPSection/RSVPSection.metadata";

describe("RSVPSectionSettingsSchema", () => {
  describe("defaults", () => {
    it("parses an empty object using all defaults", () => {
      const result = RSVPSectionSettingsSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("defaults showFloatingButton to true", () => {
      const result = RSVPSectionSettingsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.showFloatingButton).toBe(true);
    });

    it("defaults hasAlternateBg to false", () => {
      const result = RSVPSectionSettingsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.hasAlternateBg).toBe(false);
    });

    it("defaults menuStep.enabled to false", () => {
      const result = RSVPSectionSettingsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.menuStep.enabled).toBe(false);
    });

    it("defaults dietaryStep.enabled to false", () => {
      const result = RSVPSectionSettingsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.dietaryStep.enabled).toBe(false);
    });

    it("defaults messageStep.enabled to false", () => {
      const result = RSVPSectionSettingsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.messageStep.enabled).toBe(false);
    });
  });

  describe("per-state icon defaults", () => {
    it("pendingContent defaults icon to 'rsvp'", () => {
      const result = RSVPSectionSettingsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.pendingContent.icon).toBe("rsvp");
    });

    it("confirmedContent defaults icon to 'disco-ball'", () => {
      const result = RSVPSectionSettingsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success)
        expect(result.data.confirmedContent.icon).toBe("disco-ball");
    });

    it("declinedContent defaults icon to 'rsvp'", () => {
      const result = RSVPSectionSettingsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.declinedContent.icon).toBe("rsvp");
    });

    it("accepts a valid icon override for pendingContent", () => {
      const result = RSVPSectionSettingsSchema.safeParse({
        pendingContent: { icon: "rings-1" },
      });
      expect(result.success).toBe(true);
      if (result.success)
        expect(result.data.pendingContent.icon).toBe("rings-1");
    });

    it("accepts a valid icon override for confirmedContent", () => {
      const result = RSVPSectionSettingsSchema.safeParse({
        confirmedContent: { icon: "celebration-1" },
      });
      expect(result.success).toBe(true);
      if (result.success)
        expect(result.data.confirmedContent.icon).toBe("celebration-1");
    });

    it("accepts a valid icon override for declinedContent", () => {
      const result = RSVPSectionSettingsSchema.safeParse({
        declinedContent: { icon: "gift-1" },
      });
      expect(result.success).toBe(true);
      if (result.success)
        expect(result.data.declinedContent.icon).toBe("gift-1");
    });

    it("rejects an invalid icon for pendingContent", () => {
      const result = RSVPSectionSettingsSchema.safeParse({
        pendingContent: { icon: "unicorn" },
      });
      expect(result.success).toBe(false);
    });

    it("rejects an invalid icon for confirmedContent", () => {
      const result = RSVPSectionSettingsSchema.safeParse({
        confirmedContent: { icon: "not-an-icon" },
      });
      expect(result.success).toBe(false);
    });

    it("each state can have a different icon independently", () => {
      const result = RSVPSectionSettingsSchema.safeParse({
        pendingContent: { icon: "rings-1" },
        confirmedContent: { icon: "disco-ball" },
        declinedContent: { icon: "gift-2" },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pendingContent.icon).toBe("rings-1");
        expect(result.data.confirmedContent.icon).toBe("disco-ball");
        expect(result.data.declinedContent.icon).toBe("gift-2");
      }
    });
  });

  describe("menuStep", () => {
    it("accepts enabled menuStep with options", () => {
      const result = RSVPSectionSettingsSchema.safeParse({
        menuStep: {
          enabled: true,
          question: "¿Qué preferís comer?",
          options: ["Carne", "Vegano"],
        },
      });
      expect(result.success).toBe(true);
    });

    it("rejects menuStep with empty options array", () => {
      const result = RSVPSectionSettingsSchema.safeParse({
        menuStep: {
          enabled: true,
          question: "¿Qué preferís?",
          options: [],
        },
      });
      expect(result.success).toBe(false);
    });

    it("rejects menuStep with more than 10 options", () => {
      const result = RSVPSectionSettingsSchema.safeParse({
        menuStep: {
          enabled: true,
          question: "¿Qué preferís?",
          options: Array.from({ length: 11 }, (_, i) => `Option ${i}`),
        },
      });
      expect(result.success).toBe(false);
    });

    it("accepts menuStep with exactly 10 options", () => {
      const result = RSVPSectionSettingsSchema.safeParse({
        menuStep: {
          enabled: true,
          question: "¿Qué preferís?",
          options: Array.from({ length: 10 }, (_, i) => `Option ${i}`),
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("decoration fields", () => {
    it("defaults decorationSvg to 'none'", () => {
      const result = RSVPSectionSettingsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.decorationSvg).toBe("none");
    });

    it("rejects invalid decorationSvg", () => {
      const result = RSVPSectionSettingsSchema.safeParse({
        decorationSvg: "invalid-svg",
      });
      expect(result.success).toBe(false);
    });

    it("rejects decorationOpacity below 0", () => {
      const result = RSVPSectionSettingsSchema.safeParse({
        decorationOpacity: -1,
      });
      expect(result.success).toBe(false);
    });

    it("rejects decorationOpacity above 100", () => {
      const result = RSVPSectionSettingsSchema.safeParse({
        decorationOpacity: 101,
      });
      expect(result.success).toBe(false);
    });

    it("rejects decorationSize below 20", () => {
      const result = RSVPSectionSettingsSchema.safeParse({
        decorationSize: 19,
      });
      expect(result.success).toBe(false);
    });

    it("rejects decorationSize above 200", () => {
      const result = RSVPSectionSettingsSchema.safeParse({
        decorationSize: 201,
      });
      expect(result.success).toBe(false);
    });
  });
});
