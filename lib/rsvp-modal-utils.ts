import type { RSVPStepConfig } from "@/components/sections/RSVPSectionClient";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AttendanceValue = "attending" | "declining";

// Step identifiers
export const STEP = {
  ATTENDANCE: "attendance",
  GUEST_COUNT: "guest_count",
  MENU: "menu",
  DIETARY: "dietary",
  MESSAGE: "message",
} as const;

export type StepId = (typeof STEP)[keyof typeof STEP];

// ---------------------------------------------------------------------------
// Step order builder
// ---------------------------------------------------------------------------

/**
 * Derives the active step list from config + user response.
 *
 * @param attending - User's attendance choice (null = not answered yet)
 * @param maxGuests - Maximum guests allowed for this invitation
 * @param stepConfig - RSVP section configuration (which steps are enabled)
 * @returns Array of step IDs in order
 */
export function buildSteps(
  attending: AttendanceValue | null,
  maxGuests: number,
  stepConfig: RSVPStepConfig,
): StepId[] {
  const steps: StepId[] = [STEP.ATTENDANCE];

  // If user is declining, only show attendance step
  if (attending !== "attending") return steps;

  // Add conditional steps for attending users
  if (maxGuests > 1) steps.push(STEP.GUEST_COUNT);
  if (stepConfig.menuStep.enabled) steps.push(STEP.MENU);
  if (stepConfig.dietaryStep.enabled) steps.push(STEP.DIETARY);
  if (stepConfig.messageStep.enabled) steps.push(STEP.MESSAGE);

  return steps;
}

// ---------------------------------------------------------------------------
// Validation per step
// ---------------------------------------------------------------------------

/**
 * Returns true when it's safe to advance from the current step.
 *
 * @param stepId - Current step identifier
 * @param attendance - User's attendance choice
 * @param menuPreference - Selected menu option (null = unanswered)
 * @param dietaryRestrictions - Dietary restrictions (null = unanswered, "" = explicitly "no restrictions")
 * @returns true if step has valid data to proceed
 */
export function isStepValid(
  stepId: StepId,
  attendance: AttendanceValue | null,
  menuPreference: string | null,
  dietaryRestrictions: string | null,
): boolean {
  switch (stepId) {
    case STEP.ATTENDANCE:
      return attendance !== null;

    case STEP.GUEST_COUNT:
      // Always valid — has a default value
      return true;

    case STEP.MENU:
      // Must select a menu option
      return menuPreference !== null && menuPreference !== "";

    case STEP.DIETARY:
      // null = unanswered, "" = explicitly "no restrictions" (valid)
      return dietaryRestrictions !== null;

    case STEP.MESSAGE:
      // Message is optional, always valid
      return true;

    default:
      return true;
  }
}
