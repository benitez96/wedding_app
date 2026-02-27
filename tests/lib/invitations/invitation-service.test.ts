import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  validateGuestCount,
  prepareInvitationData,
  prepareInvitationUpdateData,
} from "@/lib/invitations/invitation-service";

describe("invitation-service", () => {
  describe("validateGuestCount", () => {
    it("should return valid when not attending", () => {
      const result = validateGuestCount({
        isAttending: false,
        guestCount: null,
        maxGuests: 5,
      });

      expect(result.valid).toBe(true);
    });

    it("should return invalid when attending without guestCount", () => {
      const result = validateGuestCount({
        isAttending: true,
        guestCount: null,
        maxGuests: 5,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Debe indicar al menos 1 asistente");
    });

    it("should return invalid when guestCount is 0", () => {
      const result = validateGuestCount({
        isAttending: true,
        guestCount: 0,
        maxGuests: 5,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Debe indicar al menos 1 asistente");
    });

    it("should return invalid when guestCount exceeds maxGuests", () => {
      const result = validateGuestCount({
        isAttending: true,
        guestCount: 10,
        maxGuests: 5,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain("no puede exceder el máximo permitido");
    });

    it("should return valid when guestCount is within range", () => {
      const result = validateGuestCount({
        isAttending: true,
        guestCount: 3,
        maxGuests: 5,
      });

      expect(result.valid).toBe(true);
    });

    it("should return valid when guestCount equals maxGuests", () => {
      const result = validateGuestCount({
        isAttending: true,
        guestCount: 5,
        maxGuests: 5,
      });

      expect(result.valid).toBe(true);
    });
  });

  describe("prepareInvitationData", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-02-26T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should prepare data for invitation not responded", () => {
      const result = prepareInvitationData("event-123", {
        guestName: "Juan Pérez",
        guestNickname: "Juancho",
        guestPhone: "+541123456789",
        maxGuests: 5,
        hasResponded: false,
        isAttending: false,
        guestCount: null,
      });

      expect(result).toEqual({
        eventId: "event-123",
        guestName: "Juan Pérez",
        guestNickname: "Juancho",
        guestPhone: "+541123456789",
        maxGuests: 5,
        hasResponded: false,
        isAttending: null, // ✅ Not responded → isAttending is null
        guestCount: null,
        respondedAt: null,
      });
    });

    it("should prepare data for invitation attending", () => {
      const result = prepareInvitationData("event-123", {
        guestName: "María García",
        guestNickname: "", // Zod transform → ""
        guestPhone: "",
        maxGuests: 3,
        hasResponded: true,
        isAttending: true,
        guestCount: 2,
      });

      expect(result).toEqual({
        eventId: "event-123",
        guestName: "María García",
        guestNickname: null,
        guestPhone: null,
        maxGuests: 3,
        hasResponded: true,
        isAttending: true, // ✅ Responded + attending
        guestCount: 2,
        respondedAt: new Date("2026-02-26T12:00:00Z"),
      });
    });

    it("should prepare data for invitation declining", () => {
      const result = prepareInvitationData("event-123", {
        guestName: "Pedro López",
        guestNickname: "", // After Zod transform: ""
        guestPhone: "",
        maxGuests: 2,
        hasResponded: true,
        isAttending: false,
        guestCount: null,
      });

      expect(result).toEqual({
        eventId: "event-123",
        guestName: "Pedro López",
        guestNickname: null, // "" → null
        guestPhone: null,
        maxGuests: 2,
        hasResponded: true,
        isAttending: false, // ✅ Responded + declining
        guestCount: null, // ✅ Declining → guestCount is null
        respondedAt: new Date("2026-02-26T12:00:00Z"),
      });
    });

    it("should handle empty string fields correctly", () => {
      const result = prepareInvitationData("event-123", {
        guestName: "Test User",
        guestNickname: "", // Zod transforms to ""
        guestPhone: "",
        maxGuests: 1,
        hasResponded: false,
        isAttending: false,
        guestCount: null,
      });

      expect(result.guestNickname).toBeNull(); // "" → null
      expect(result.guestPhone).toBeNull(); // "" → null
      expect(result.hasResponded).toBe(false);
    });
  });

  describe("prepareInvitationUpdateData", () => {
    it("should prepare update data with same logic as create", () => {
      const result = prepareInvitationUpdateData({
        guestName: "Updated Name",
        guestNickname: "Nick",
        guestPhone: "+541199999999",
        maxGuests: 4,
        hasResponded: true,
        isAttending: true,
        guestCount: 3,
      });

      expect(result).toMatchObject({
        guestName: "Updated Name",
        guestNickname: "Nick",
        guestPhone: "+541199999999",
        maxGuests: 4,
        hasResponded: true,
        isAttending: true,
        guestCount: 3,
      });

      // Should not include eventId
      expect("eventId" in result).toBe(false);
    });
  });
});
