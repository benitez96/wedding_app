/**
 * Tests for app/actions/schemas.ts
 *
 * CRITICAL: Only testing validation schemas (pure logic)
 */

import { describe, it, expect } from "vitest";
import {
  createEventSchema,
  addSectionSchema,
  removeSectionSchema,
  updateSectionSettingsSchema,
  updateSectionsOrderSchema,
  createCheckInSchema,
  scanQRSchema,
  getInvitationsCacheSchema,
  themeIdSchema,
} from "@/app/actions/schemas";
import { THEME_IDS } from "@/types/theme";

describe("action schemas", () => {
  describe("createEventSchema", () => {
    it("should accept valid event data", () => {
      const result = createEventSchema.safeParse({
        name: "My Wedding",
        description: "Beautiful ceremony",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("My Wedding");
        expect(result.data.description).toBe("Beautiful ceremony");
      }
    });

    it("should trim name", () => {
      const result = createEventSchema.safeParse({
        name: "  Padded Name  ",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Padded Name");
      }
    });

    it("should trim description", () => {
      const result = createEventSchema.safeParse({
        name: "Event",
        description: "  Padded description  ",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe("Padded description");
      }
    });

    it("should convert empty description to null", () => {
      const result = createEventSchema.safeParse({
        name: "Event",
        description: "   ",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe(null);
      }
    });

    it("should reject empty name", () => {
      const result = createEventSchema.safeParse({
        name: "",
      });

      expect(result.success).toBe(false);
    });

    it("should reject name exceeding 100 characters", () => {
      const result = createEventSchema.safeParse({
        name: "a".repeat(101),
      });

      expect(result.success).toBe(false);
    });

    it("should reject description exceeding 500 characters", () => {
      const result = createEventSchema.safeParse({
        name: "Event",
        description: "a".repeat(501),
      });

      expect(result.success).toBe(false);
    });

    it("should accept name with exactly 100 characters", () => {
      const result = createEventSchema.safeParse({
        name: "a".repeat(100),
      });

      expect(result.success).toBe(true);
    });
  });

  describe("addSectionSchema", () => {
    it("should accept valid section key", () => {
      const result = addSectionSchema.safeParse({
        key: "hero",
      });

      expect(result.success).toBe(true);
    });

    it("should reject invalid section key", () => {
      const result = addSectionSchema.safeParse({
        key: "invalid_key",
      });

      expect(result.success).toBe(false);
    });

    it("should reject empty key", () => {
      const result = addSectionSchema.safeParse({
        key: "",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("removeSectionSchema", () => {
    it("should accept valid CUID", () => {
      const result = removeSectionSchema.safeParse({
        id: "clabcdef1234567890",
      });

      expect(result.success).toBe(true);
    });

    it("should reject invalid CUID format", () => {
      const result = removeSectionSchema.safeParse({
        id: "not-a-cuid",
      });

      expect(result.success).toBe(false);
    });

    it("should reject empty id", () => {
      const result = removeSectionSchema.safeParse({
        id: "",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("updateSectionSettingsSchema", () => {
    it("should accept valid id and key", () => {
      const result = updateSectionSettingsSchema.safeParse({
        id: "clabcdef1234567890",
        key: "hero",
      });

      expect(result.success).toBe(true);
    });

    it("should reject invalid CUID", () => {
      const result = updateSectionSettingsSchema.safeParse({
        id: "invalid",
        key: "hero",
      });

      expect(result.success).toBe(false);
    });

    it("should reject invalid section key", () => {
      const result = updateSectionSettingsSchema.safeParse({
        id: "clabcdef1234567890",
        key: "invalid_key",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("updateSectionsOrderSchema", () => {
    it("should accept valid sections array", () => {
      const result = updateSectionsOrderSchema.safeParse([
        { id: "clabcdef1234567890", order: 0, isEnabled: true },
        { id: "clabcdef1234567891", order: 1, isEnabled: false },
      ]);

      expect(result.success).toBe(true);
    });

    it("should reject empty array", () => {
      const result = updateSectionsOrderSchema.safeParse([]);

      expect(result.success).toBe(false);
    });

    it("should reject array exceeding 50 items", () => {
      const sections = Array.from({ length: 51 }, (_, i) => ({
        id: `clabcdef123456789${i}`,
        order: i,
        isEnabled: true,
      }));

      const result = updateSectionsOrderSchema.safeParse(sections);

      expect(result.success).toBe(false);
    });

    it("should reject negative order", () => {
      const result = updateSectionsOrderSchema.safeParse([
        { id: "clabcdef1234567890", order: -1, isEnabled: true },
      ]);

      expect(result.success).toBe(false);
    });

    it("should reject non-integer order", () => {
      const result = updateSectionsOrderSchema.safeParse([
        { id: "clabcdef1234567890", order: 1.5, isEnabled: true },
      ]);

      expect(result.success).toBe(false);
    });
  });

  describe("createCheckInSchema", () => {
    it("should accept valid check-in data", () => {
      const result = createCheckInSchema.safeParse({
        invitationId: "clabcdef1234567890",
        guestsCount: 2,
        deviceId: "device-123",
        clientId: "client-123",
      });

      expect(result.success).toBe(true);
    });

    it("should accept without optional fields", () => {
      const result = createCheckInSchema.safeParse({
        invitationId: "clabcdef1234567890",
        guestsCount: 1,
      });

      expect(result.success).toBe(true);
    });

    it("should reject invalid CUID invitation ID", () => {
      const result = createCheckInSchema.safeParse({
        invitationId: "not-a-cuid",
        guestsCount: 1,
      });

      expect(result.success).toBe(false);
    });

    it("should reject guestsCount less than 1", () => {
      const result = createCheckInSchema.safeParse({
        invitationId: "clabcdef1234567890",
        guestsCount: 0,
      });

      expect(result.success).toBe(false);
    });

    it("should reject guestsCount exceeding 20", () => {
      const result = createCheckInSchema.safeParse({
        invitationId: "clabcdef1234567890",
        guestsCount: 21,
      });

      expect(result.success).toBe(false);
    });

    it("should reject non-integer guestsCount", () => {
      const result = createCheckInSchema.safeParse({
        invitationId: "clabcdef1234567890",
        guestsCount: 2.5,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("scanQRSchema", () => {
    it("should accept valid QR data", () => {
      const result = scanQRSchema.safeParse({
        tokenId: "abc123",
        eventId: "clabcdef1234567890",
      });

      expect(result.success).toBe(true);
    });

    it("should reject empty tokenId", () => {
      const result = scanQRSchema.safeParse({
        tokenId: "",
        eventId: "clabcdef1234567890",
      });

      expect(result.success).toBe(false);
    });

    it("should reject invalid CUID event ID", () => {
      const result = scanQRSchema.safeParse({
        tokenId: "abc123",
        eventId: "not-a-cuid",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("getInvitationsCacheSchema", () => {
    it("should accept valid event ID", () => {
      const result = getInvitationsCacheSchema.safeParse({
        eventId: "clabcdef1234567890",
      });

      expect(result.success).toBe(true);
    });

    it("should reject invalid CUID", () => {
      const result = getInvitationsCacheSchema.safeParse({
        eventId: "not-a-cuid",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("themeIdSchema", () => {
    it("should accept CLASSIC theme", () => {
      const result = themeIdSchema.safeParse(THEME_IDS.CLASSIC);

      expect(result.success).toBe(true);
    });

    it("should accept WARM theme", () => {
      const result = themeIdSchema.safeParse(THEME_IDS.WARM);

      expect(result.success).toBe(true);
    });

    it("should accept PASTEL_GREEN theme", () => {
      const result = themeIdSchema.safeParse(THEME_IDS.PASTEL_GREEN);

      expect(result.success).toBe(true);
    });

    it("should reject invalid theme ID", () => {
      const result = themeIdSchema.safeParse("invalid-theme");

      expect(result.success).toBe(false);
    });

    it("should reject empty string", () => {
      const result = themeIdSchema.safeParse("");

      expect(result.success).toBe(false);
    });
  });
});
