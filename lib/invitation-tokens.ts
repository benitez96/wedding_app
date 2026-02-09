/**
 * Pure business logic for invitation token validation
 *
 * Extracted from actions for testability
 */

export interface TokenValidationInput {
  isActive: boolean;
  isUsed: boolean;
  expiresAt: Date | null;
}

export interface TokenValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validates invitation token state (pure function)
 *
 * @param token - Token state to validate
 * @returns Validation result with reason if invalid
 */
export function validateTokenState(
  token: TokenValidationInput,
): TokenValidationResult {
  if (!token.isActive) {
    return { valid: false, reason: "Token invalid or revoked" };
  }

  if (token.isUsed) {
    return { valid: false, reason: "Token already used" };
  }

  if (token.expiresAt && new Date() > token.expiresAt) {
    return { valid: false, reason: "Token expired" };
  }

  return { valid: true };
}

/**
 * Validates token expiration against current date (pure function)
 *
 * @param expiresAt - Token expiration date (null = no expiration)
 * @param now - Current date (defaults to Date.now() for testing)
 * @returns True if token is expired
 */
export function isTokenExpired(
  expiresAt: Date | null,
  now: Date = new Date(),
): boolean {
  if (!expiresAt) {
    return false; // No expiration date = never expires
  }

  return now > expiresAt;
}

/**
 * Validates guest count against max guests (pure function)
 *
 * Used in RSVP responses to ensure guest count is valid
 *
 * @param guestCount - Number of guests attending
 * @param maxGuests - Maximum allowed guests
 * @param isAttending - Whether the guest is attending
 * @returns Validation result with reason if invalid
 */
export function validateGuestCount(
  guestCount: number | null | undefined,
  maxGuests: number,
  isAttending: boolean,
): { valid: boolean; reason?: string } {
  // If not attending, guestCount is not required
  if (!isAttending) {
    return { valid: true };
  }

  // If attending, guestCount must be present
  if (!guestCount || guestCount < 1) {
    return {
      valid: false,
      reason: "Guest count must be at least 1 when attending",
    };
  }

  // guestCount cannot exceed maxGuests
  if (guestCount > maxGuests) {
    return {
      valid: false,
      reason: `Guest count cannot exceed maximum allowed (${maxGuests})`,
    };
  }

  return { valid: true };
}

/**
 * Determines the appropriate guestCount value for database storage (pure function)
 *
 * Business rule: If not attending, guestCount should be null
 *
 * @param guestCount - Guest count from form
 * @param isAttending - Whether the guest is attending
 * @returns Guest count to store (null if not attending)
 */
export function normalizeGuestCount(
  guestCount: number | null | undefined,
  isAttending: boolean,
): number | null {
  return isAttending && guestCount ? guestCount : null;
}
