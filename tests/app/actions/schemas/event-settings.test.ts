import { describe, it, expect } from "vitest";
import { updateEventSettingsSchema } from "@/app/actions/schemas/event-settings";

describe("updateEventSettingsSchema", () => {
  describe("eventName validation", () => {
    it("should accept valid event names", () => {
      const result = updateEventSettingsSchema.safeParse({
        eventName: "Boda de Ana y Juan",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.eventName).toBe("Boda de Ana y Juan");
      }
    });

    it("should trim whitespace", () => {
      const result = updateEventSettingsSchema.safeParse({
        eventName: "  Mi Evento  ",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.eventName).toBe("Mi Evento");
      }
    });

    it("should reject empty names", () => {
      const result = updateEventSettingsSchema.safeParse({
        eventName: "",
      });

      expect(result.success).toBe(false);
    });

    it("should reject names with only whitespace", () => {
      const result = updateEventSettingsSchema.safeParse({
        eventName: "   ",
      });

      expect(result.success).toBe(false);
    });

    it("should reject names shorter than 3 characters", () => {
      const result = updateEventSettingsSchema.safeParse({
        eventName: "AB",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("al menos 3");
      }
    });

    it("should reject names longer than 100 characters", () => {
      const longName = "a".repeat(101);
      const result = updateEventSettingsSchema.safeParse({
        eventName: longName,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("100 caracteres");
      }
    });

    it("should accept names exactly 100 characters", () => {
      const exactName = "a".repeat(100);
      const result = updateEventSettingsSchema.safeParse({
        eventName: exactName,
      });

      expect(result.success).toBe(true);
    });

    it("should handle special characters and emojis", () => {
      const result = updateEventSettingsSchema.safeParse({
        eventName: "Boda 💒 de José & María!!!",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("eventDescription validation", () => {
    it("should accept valid descriptions", () => {
      const result = updateEventSettingsSchema.safeParse({
        eventName: "Mi Evento",
        eventDescription: "Una descripción muy bonita",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.eventDescription).toBe("Una descripción muy bonita");
      }
    });

    it("should trim whitespace", () => {
      const result = updateEventSettingsSchema.safeParse({
        eventName: "Mi Evento",
        eventDescription: "  Descripción  ",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.eventDescription).toBe("Descripción");
      }
    });

    it("should convert empty string to null", () => {
      const result = updateEventSettingsSchema.safeParse({
        eventName: "Mi Evento",
        eventDescription: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // transform convierte "" a null antes de optional
        expect(result.data.eventDescription).toBe(null);
      }
    });

    it("should be optional (undefined when not provided)", () => {
      const result = updateEventSettingsSchema.safeParse({
        eventName: "Mi Evento",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Cuando no se provee, Zod deja el campo como undefined (no aplica el transform)
        expect(result.data.eventDescription).toBeUndefined();
      }
    });

    it("should convert whitespace-only to null", () => {
      const result = updateEventSettingsSchema.safeParse({
        eventName: "Mi Evento",
        eventDescription: "   ",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // trim() convierte "   " a "", luego transform lo convierte a null
        expect(result.data.eventDescription).toBe(null);
      }
    });

    it("should reject descriptions longer than 1000 characters", () => {
      const longDesc = "a".repeat(1001);
      const result = updateEventSettingsSchema.safeParse({
        eventName: "Mi Evento",
        eventDescription: longDesc,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("1000 caracteres");
      }
    });

    it("should accept descriptions exactly 1000 characters", () => {
      const exactDesc = "a".repeat(1000);
      const result = updateEventSettingsSchema.safeParse({
        eventName: "Mi Evento",
        eventDescription: exactDesc,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("checkinStrategy validation", () => {
    it("should accept valid strategies", () => {
      const strategies = ["IDB_FIRST", "SERVER_FIRST", "HYBRID_SMART"];

      strategies.forEach((strategy) => {
        const result = updateEventSettingsSchema.safeParse({
          eventName: "Mi Evento",
          checkinStrategy: strategy,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.checkinStrategy).toBe(strategy);
        }
      });
    });

    it("should reject invalid strategies", () => {
      const result = updateEventSettingsSchema.safeParse({
        eventName: "Mi Evento",
        checkinStrategy: "INVALID_STRATEGY",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("inválida");
      }
    });

    it("should default to HYBRID_SMART when not provided", () => {
      const result = updateEventSettingsSchema.safeParse({
        eventName: "Mi Evento",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.checkinStrategy).toBe("HYBRID_SMART");
      }
    });

    it("should be optional", () => {
      const result = updateEventSettingsSchema.safeParse({
        eventName: "Mi Evento",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("security and edge cases", () => {
    it("should handle SQL injection attempts", () => {
      const result = updateEventSettingsSchema.safeParse({
        eventName: "'; DROP TABLE events; --",
      });

      // Should accept it (Prisma handles SQL injection, not Zod)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.eventName).toBe("'; DROP TABLE events; --");
      }
    });

    it("should handle XSS attempts", () => {
      const result = updateEventSettingsSchema.safeParse({
        eventName: "<script>alert('XSS')</script>",
      });

      // Should accept it (XSS prevention is at render time, not validation)
      expect(result.success).toBe(true);
    });

    it("should handle unicode and emojis", () => {
      const result = updateEventSettingsSchema.safeParse({
        eventName: "Boda 👰🤵 2024",
        eventDescription: "Una celebración 🎉 increíble",
      });

      expect(result.success).toBe(true);
    });

    it("should handle null/undefined gracefully", () => {
      const result = updateEventSettingsSchema.safeParse({
        eventName: null,
      });

      expect(result.success).toBe(false);
    });

    it("should handle very long whitespace", () => {
      const result = updateEventSettingsSchema.safeParse({
        eventName: " ".repeat(1000) + "Evento" + " ".repeat(1000),
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.eventName).toBe("Evento");
      }
    });
  });
});
