import { describe, it, expect } from "vitest";
import {
  buildSteps,
  isStepValid,
  STEP,
  type StepId,
  type AttendanceValue,
} from "@/lib/rsvp-modal-utils";
import type { RSVPStepConfig } from "@/components/sections/RSVPSectionClient";

// ---------------------------------------------------------------------------
// Mock Step Config
// ---------------------------------------------------------------------------

const mockStepConfigAllEnabled: RSVPStepConfig = {
  attendanceStep: {
    question: "¿Vas a asistir a nuestra boda?",
    acceptLabel: "¡Sí, acepto!",
    acceptSubtitle: "Voy a estar ahí",
    declineLabel: "No puedo ir :(",
    declineSubtitle: "Lo siento mucho",
  },
  pendingContent: {
    icon: "rsvp",
    decorativeText: 'Decile "Si acepto" a nuestra invitacion',
    ctaLabel: "CONFIRMAR ASISTENCIA",
    footerText: "Tenes tiempo hasta el 10 de Enero!",
  },
  confirmedContent: {
    icon: "disco-ball",
    decorativeText: "¡Gracias por confirmar tu asistencia!",
    description:
      "¡Anda recargando baterías que vamos a bailar toda la noche! 🕺💃",
    footerText: "¡Prepárate para una noche inolvidable!",
    changeLabel: "Cambié de opinión",
  },
  declinedContent: {
    icon: "calendar",
    decorativeText: "Lamentamos que no puedas asistir",
    description: "Esperamos verte en otra ocasión",
    footerText: "¡Te extrañaremos!",
    changeLabel: "Cambié de opinión",
  },
  menuStep: {
    enabled: true,
    question: "¿Qué menú preferís?",
    options: ["Carne", "Pollo", "Vegetariano"],
  },
  dietaryStep: {
    enabled: true,
    question: "¿Tenés alguna restricción alimentaria?",
  },
  messageStep: {
    enabled: true,
    question: "¿Querés dejarnos un mensaje?",
  },
};

const mockStepConfigMenuOnly: RSVPStepConfig = {
  ...mockStepConfigAllEnabled,
  dietaryStep: { enabled: false, question: "" },
  messageStep: { enabled: false, question: "" },
};

const mockStepConfigNone: RSVPStepConfig = {
  ...mockStepConfigAllEnabled,
  menuStep: { enabled: false, question: "", options: [] },
  dietaryStep: { enabled: false, question: "" },
  messageStep: { enabled: false, question: "" },
};

// ---------------------------------------------------------------------------
// buildSteps() tests
// ---------------------------------------------------------------------------

describe("buildSteps", () => {
  describe("when attendance is null (not answered)", () => {
    it("returns only attendance step", () => {
      const steps = buildSteps(null, 5, mockStepConfigAllEnabled);
      expect(steps).toEqual([STEP.ATTENDANCE]);
    });
  });

  describe("when user is declining", () => {
    it("returns only attendance step regardless of config", () => {
      const steps = buildSteps("declining", 5, mockStepConfigAllEnabled);
      expect(steps).toEqual([STEP.ATTENDANCE]);
    });

    it("returns only attendance step even with maxGuests > 1", () => {
      const steps = buildSteps("declining", 10, mockStepConfigAllEnabled);
      expect(steps).toEqual([STEP.ATTENDANCE]);
    });
  });

  describe("when user is attending", () => {
    describe("with all steps enabled", () => {
      it("includes all steps for maxGuests > 1", () => {
        const steps = buildSteps("attending", 3, mockStepConfigAllEnabled);
        expect(steps).toEqual([
          STEP.ATTENDANCE,
          STEP.GUEST_COUNT,
          STEP.MENU,
          STEP.DIETARY,
          STEP.MESSAGE,
        ]);
      });

      it("excludes guest_count step when maxGuests = 1", () => {
        const steps = buildSteps("attending", 1, mockStepConfigAllEnabled);
        expect(steps).toEqual([
          STEP.ATTENDANCE,
          STEP.MENU,
          STEP.DIETARY,
          STEP.MESSAGE,
        ]);
      });
    });

    describe("with partial steps enabled", () => {
      it("includes only enabled steps (menu only)", () => {
        const steps = buildSteps("attending", 2, mockStepConfigMenuOnly);
        expect(steps).toEqual([STEP.ATTENDANCE, STEP.GUEST_COUNT, STEP.MENU]);
      });

      it("excludes all optional steps when disabled", () => {
        const steps = buildSteps("attending", 4, mockStepConfigNone);
        expect(steps).toEqual([STEP.ATTENDANCE, STEP.GUEST_COUNT]);
      });

      it("excludes all optional steps when maxGuests = 1 and steps disabled", () => {
        const steps = buildSteps("attending", 1, mockStepConfigNone);
        expect(steps).toEqual([STEP.ATTENDANCE]);
      });
    });

    describe("edge cases", () => {
      it("handles maxGuests = 0 (treats as single guest)", () => {
        const steps = buildSteps("attending", 0, mockStepConfigAllEnabled);
        expect(steps).not.toContain(STEP.GUEST_COUNT);
      });

      it("handles negative maxGuests (treats as single guest)", () => {
        const steps = buildSteps("attending", -1, mockStepConfigAllEnabled);
        expect(steps).not.toContain(STEP.GUEST_COUNT);
      });

      it("handles very large maxGuests", () => {
        const steps = buildSteps("attending", 999, mockStepConfigAllEnabled);
        expect(steps).toContain(STEP.GUEST_COUNT);
      });
    });
  });

  describe("step order consistency", () => {
    it("always starts with attendance", () => {
      const configs = [
        mockStepConfigAllEnabled,
        mockStepConfigMenuOnly,
        mockStepConfigNone,
      ];
      const attendances: (AttendanceValue | null)[] = [
        null,
        "attending",
        "declining",
      ];
      const maxGuestsList = [1, 3, 10];

      configs.forEach((config) => {
        attendances.forEach((attendance) => {
          maxGuestsList.forEach((maxGuests) => {
            const steps = buildSteps(attendance, maxGuests, config);
            expect(steps[0]).toBe(STEP.ATTENDANCE);
          });
        });
      });
    });

    it("maintains correct order when all enabled", () => {
      const steps = buildSteps("attending", 5, mockStepConfigAllEnabled);
      const expectedOrder: StepId[] = [
        STEP.ATTENDANCE,
        STEP.GUEST_COUNT,
        STEP.MENU,
        STEP.DIETARY,
        STEP.MESSAGE,
      ];
      expect(steps).toEqual(expectedOrder);
    });
  });
});

// ---------------------------------------------------------------------------
// isStepValid() tests
// ---------------------------------------------------------------------------

describe("isStepValid", () => {
  describe("ATTENDANCE step", () => {
    it("is invalid when attendance is null", () => {
      expect(isStepValid(STEP.ATTENDANCE, null, null, null)).toBe(false);
    });

    it("is valid when attendance is 'attending'", () => {
      expect(isStepValid(STEP.ATTENDANCE, "attending", null, null)).toBe(true);
    });

    it("is valid when attendance is 'declining'", () => {
      expect(isStepValid(STEP.ATTENDANCE, "declining", null, null)).toBe(true);
    });
  });

  describe("GUEST_COUNT step", () => {
    it("is always valid (has default value)", () => {
      expect(isStepValid(STEP.GUEST_COUNT, null, null, null)).toBe(true);
      expect(isStepValid(STEP.GUEST_COUNT, "attending", null, null)).toBe(true);
      expect(isStepValid(STEP.GUEST_COUNT, "declining", null, null)).toBe(true);
    });
  });

  describe("MENU step", () => {
    it("is invalid when menuPreference is null", () => {
      expect(isStepValid(STEP.MENU, "attending", null, null)).toBe(false);
    });

    it("is invalid when menuPreference is empty string", () => {
      expect(isStepValid(STEP.MENU, "attending", "", null)).toBe(false);
    });

    it("is valid when menuPreference has value", () => {
      expect(isStepValid(STEP.MENU, "attending", "Carne", null)).toBe(true);
      expect(isStepValid(STEP.MENU, "attending", "Vegetariano", null)).toBe(
        true,
      );
    });

    it("is valid even with whitespace (non-empty)", () => {
      expect(isStepValid(STEP.MENU, "attending", "  ", null)).toBe(true);
    });
  });

  describe("DIETARY step", () => {
    it("is invalid when dietaryRestrictions is null (unanswered)", () => {
      expect(isStepValid(STEP.DIETARY, "attending", "Carne", null)).toBe(false);
    });

    it("is valid when dietaryRestrictions is empty string (explicitly 'no restrictions')", () => {
      expect(isStepValid(STEP.DIETARY, "attending", "Carne", "")).toBe(true);
    });

    it("is valid when dietaryRestrictions has value", () => {
      expect(
        isStepValid(STEP.DIETARY, "attending", "Carne", "Sin gluten"),
      ).toBe(true);
      expect(isStepValid(STEP.DIETARY, "attending", "Carne", "Vegano")).toBe(
        true,
      );
    });

    it("is valid with whitespace (non-null)", () => {
      expect(isStepValid(STEP.DIETARY, "attending", "Carne", "   ")).toBe(true);
    });
  });

  describe("MESSAGE step", () => {
    it("is always valid (message is optional)", () => {
      expect(isStepValid(STEP.MESSAGE, null, null, null)).toBe(true);
      expect(isStepValid(STEP.MESSAGE, "attending", "Carne", "")).toBe(true);
      expect(isStepValid(STEP.MESSAGE, "declining", null, null)).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("handles unknown step gracefully (returns true)", () => {
      expect(
        isStepValid("unknown_step" as StepId, "attending", "Carne", ""),
      ).toBe(true);
    });

    it("validates correctly regardless of attendance for non-attendance steps", () => {
      // Menu validation doesn't depend on attendance value
      expect(isStepValid(STEP.MENU, null, "Carne", null)).toBe(true);
      expect(isStepValid(STEP.MENU, "declining", "Pollo", null)).toBe(true);
    });
  });

  describe("validation combinations", () => {
    it("correctly validates full attending flow", () => {
      // Step 1: Attendance not answered
      expect(isStepValid(STEP.ATTENDANCE, null, null, null)).toBe(false);

      // Step 2: Attendance answered, guest count always valid
      expect(isStepValid(STEP.ATTENDANCE, "attending", null, null)).toBe(true);
      expect(isStepValid(STEP.GUEST_COUNT, "attending", null, null)).toBe(true);

      // Step 3: Menu not answered
      expect(isStepValid(STEP.MENU, "attending", null, null)).toBe(false);

      // Step 4: Menu answered, dietary not answered
      expect(isStepValid(STEP.MENU, "attending", "Carne", null)).toBe(true);
      expect(isStepValid(STEP.DIETARY, "attending", "Carne", null)).toBe(false);

      // Step 5: Dietary answered (empty = no restrictions)
      expect(isStepValid(STEP.DIETARY, "attending", "Carne", "")).toBe(true);

      // Step 6: Message always valid
      expect(isStepValid(STEP.MESSAGE, "attending", "Carne", "")).toBe(true);
    });

    it("correctly validates declining flow", () => {
      // Only attendance step needed
      expect(isStepValid(STEP.ATTENDANCE, null, null, null)).toBe(false);
      expect(isStepValid(STEP.ATTENDANCE, "declining", null, null)).toBe(true);

      // Other steps still validate technically, but won't be shown
      expect(isStepValid(STEP.MENU, "declining", null, null)).toBe(false);
      expect(isStepValid(STEP.DIETARY, "declining", null, null)).toBe(false);
    });
  });
});
