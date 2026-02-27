/**
 * Centralized validation limits for the application
 *
 * Use these constants instead of magic numbers throughout the codebase.
 * This makes limits easy to find, update, and maintain.
 *
 * @example
 * ```typescript
 * import { VALIDATION_LIMITS } from "@/config/validation-limits";
 *
 * const schema = z.object({
 *   name: z.string().max(VALIDATION_LIMITS.EVENT_NAME_MAX),
 *   description: z.string().max(VALIDATION_LIMITS.EVENT_DESCRIPTION_MAX),
 * });
 * ```
 */

export const VALIDATION_LIMITS = {
  // ============================================================================
  // EVENT LIMITS
  // ============================================================================
  EVENT_NAME_MAX: 100,
  EVENT_DESCRIPTION_MAX: 500,
  EVENT_SLUG_MAX: 100,

  // ============================================================================
  // INVITATION LIMITS
  // ============================================================================
  GUEST_NAME_MAX: 100,
  GUEST_NICKNAME_MAX: 50,
  GUEST_PHONE_MAX: 20,
  GUEST_COUNT_MAX: 20,
  GUEST_COUNT_MIN: 1,

  // ============================================================================
  // RSVP LIMITS
  // ============================================================================
  RSVP_MENU_PREFERENCE_MAX: 100,
  RSVP_DIETARY_RESTRICTIONS_MAX: 500,
  RSVP_MESSAGE_MAX: 1000,

  // ============================================================================
  // SECTION LIMITS
  // ============================================================================
  SECTION_TITLE_MAX: 100,
  SECTION_SUBTITLE_MAX: 200,
  SECTION_DESCRIPTION_MAX: 1000,
  SECTION_CUSTOM_TEXT_MAX: 2000,
  SECTIONS_MAX: 50,

  // ============================================================================
  // USER LIMITS
  // ============================================================================
  USER_NAME_MAX: 100,
  USER_EMAIL_MAX: 255,

  // ============================================================================
  // FILE UPLOAD LIMITS
  // ============================================================================
  FILE_SIZE_MAX: 20 * 1024 * 1024, // 20MB
  IMAGE_SIZE_MAX: 10 * 1024 * 1024, // 10MB
  VIDEO_SIZE_MAX: 20 * 1024 * 1024, // 20MB

  // ============================================================================
  // PASSWORD LIMITS
  // ============================================================================
  PASSWORD_MIN: 10,
  PASSWORD_MAX: 128,

  // ============================================================================
  // TOKEN LIMITS
  // ============================================================================
  TOKEN_LABEL_MAX: 50,

  // ============================================================================
  // CHECK-IN LIMITS
  // ============================================================================
  CHECKIN_GUESTS_MAX: 20,
  CHECKIN_GUESTS_MIN: 1,

  // ============================================================================
  // TIME LIMITS (in milliseconds)
  // ============================================================================
  MAX_CLOCK_SKEW_MS: 60 * 1000, // 1 minute
  MAX_CHECKIN_AGE_MS: 24 * 60 * 60 * 1000, // 24 hours

  // ============================================================================
  // COLLABORATOR LIMITS
  // ============================================================================
  COLLABORATOR_EMAIL_MAX: 255,
  COLLABORATORS_MAX_PER_EVENT: 10,
} as const;

// Type-safe helper to get a limit by key
export type ValidationLimitKey = keyof typeof VALIDATION_LIMITS;

/**
 * Get a validation limit by key (type-safe)
 */
export function getValidationLimit(key: ValidationLimitKey): number {
  return VALIDATION_LIMITS[key];
}

/**
 * Helper to create error messages with limits
 */
export function createLimitErrorMessage(
  fieldName: string,
  limitKey: ValidationLimitKey,
): string {
  const limit = VALIDATION_LIMITS[limitKey];
  return `${fieldName} no puede exceder ${limit} caracteres`;
}
