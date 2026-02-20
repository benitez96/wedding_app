/**
 * Invitation Status Utilities
 *
 * Pure functions for invitation status and guest count logic:
 * - Normalize guest count within valid range
 * - Calculate guest count when status changes
 * - Parse user input for guest count
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const InvitationStatus = {
  PENDING: "pending",
  ATTENDING: "attending",
  NOT_ATTENDING: "not_attending",
} as const;

export type InvitationStatusValue =
  (typeof InvitationStatus)[keyof typeof InvitationStatus];

// ---------------------------------------------------------------------------
// Core Logic
// ---------------------------------------------------------------------------

/**
 * Normalizes guest count to be within valid range [1, maxGuests].
 *
 * @param count - Raw guest count (can be out of range)
 * @param maxGuests - Maximum allowed guests
 * @returns Normalized count between 1 and maxGuests (inclusive)
 *
 * @example
 * normalizeGuestCount(5, 3) // → 3 (clamped to max)
 * normalizeGuestCount(0, 5) // → 1 (clamped to min)
 * normalizeGuestCount(3, 10) // → 3 (already valid)
 */
export function normalizeGuestCount(count: number, maxGuests: number): number {
  return Math.max(1, Math.min(count, maxGuests));
}

/**
 * Calculates the appropriate guest count when invitation status changes.
 *
 * Rules:
 * - NOT_ATTENDING or PENDING → always 1 (guest count irrelevant)
 * - ATTENDING → normalize current count within [1, maxGuests]
 *
 * @param newStatus - The new invitation status
 * @param currentGuestCount - Current guest count before status change
 * @param maxGuests - Maximum allowed guests
 * @returns Appropriate guest count for the new status
 *
 * @example
 * getGuestCountForStatusChange("not_attending", 5, 10) // → 1
 * getGuestCountForStatusChange("attending", 5, 3) // → 3 (clamped)
 * getGuestCountForStatusChange("attending", 2, 10) // → 2 (valid)
 */
export function getGuestCountForStatusChange(
  newStatus: string,
  currentGuestCount: number,
  maxGuests: number,
): number {
  // Non-attending statuses: reset to 1
  if (newStatus !== InvitationStatus.ATTENDING) {
    return 1;
  }

  // Attending: normalize count within valid range
  return normalizeGuestCount(currentGuestCount, maxGuests);
}

/**
 * Parses user input for guest count with fallback to 1.
 *
 * Handles edge cases:
 * - Empty string → 1
 * - Invalid number → 1
 * - Negative → 1
 * - Valid number → returned as-is (caller should normalize)
 *
 * @param value - Raw input value (string from input field)
 * @returns Parsed number (minimum 1)
 *
 * @example
 * parseGuestCountInput("5") // → 5
 * parseGuestCountInput("") // → 1
 * parseGuestCountInput("abc") // → 1
 * parseGuestCountInput("-3") // → 1
 */
export function parseGuestCountInput(value: string): number {
  const parsed = parseInt(value, 10);

  // NaN or invalid → fallback to 1
  if (isNaN(parsed)) {
    return 1;
  }

  // Negative → fallback to 1
  if (parsed < 1) {
    return 1;
  }

  return parsed;
}

/**
 * Validates if a guest count needs adjustment based on new maxGuests.
 *
 * @param status - Current invitation status
 * @param guestCount - Current guest count
 * @param maxGuests - New maximum guests limit
 * @returns Object with needsAdjustment flag and adjustedCount
 *
 * @example
 * validateGuestCountForMaxGuests("attending", 5, 3)
 * // → { needsAdjustment: true, adjustedCount: 3 }
 *
 * validateGuestCountForMaxGuests("attending", 2, 5)
 * // → { needsAdjustment: false, adjustedCount: 2 }
 *
 * validateGuestCountForMaxGuests("pending", 10, 2)
 * // → { needsAdjustment: false, adjustedCount: 10 } (status not attending)
 */
export function validateGuestCountForMaxGuests(
  status: string,
  guestCount: number,
  maxGuests: number,
): { needsAdjustment: boolean; adjustedCount: number } {
  // Only validate for attending status
  if (status !== InvitationStatus.ATTENDING) {
    return { needsAdjustment: false, adjustedCount: guestCount };
  }

  // Check if current count exceeds new max
  if (guestCount > maxGuests) {
    return { needsAdjustment: true, adjustedCount: maxGuests };
  }

  return { needsAdjustment: false, adjustedCount: guestCount };
}
