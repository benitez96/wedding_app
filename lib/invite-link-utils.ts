/**
 * Invite Link Utilities
 *
 * Pure functions for collaborator invite link generation:
 * - Convert time units (days → hours)
 * - Parse max uses configuration
 * - Build invite link URLs
 * - Format link descriptions for UI
 */

// ---------------------------------------------------------------------------
// Core Logic
// ---------------------------------------------------------------------------

/**
 * Converts days to hours.
 *
 * @param days - Number of days
 * @returns Number of hours (days * 24)
 *
 * @example
 * convertDaysToHours(1) // → 24
 * convertDaysToHours(7) // → 168
 * convertDaysToHours(0) // → 0
 */
export function convertDaysToHours(days: number): number {
  return days * 24;
}

/**
 * Parses max uses input and returns appropriate value.
 *
 * Rules:
 * - If unlimited → undefined (no limit)
 * - If limited → parsed integer from input
 * - Invalid input → fallback to 1
 *
 * @param maxUsesInput - Raw string input from form field
 * @param isUnlimited - Whether unlimited uses is enabled
 * @returns Number of uses or undefined for unlimited
 *
 * @example
 * parseMaxUses("5", false) // → 5
 * parseMaxUses("10", true) // → undefined (unlimited)
 * parseMaxUses("", false) // → 1 (fallback)
 * parseMaxUses("abc", false) // → 1 (fallback)
 */
export function parseMaxUses(
  maxUsesInput: string,
  isUnlimited: boolean,
): number | undefined {
  if (isUnlimited) {
    return undefined;
  }

  const parsed = parseInt(maxUsesInput, 10);

  // NaN or invalid → fallback to 1
  if (isNaN(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

/**
 * Builds the full invite link URL with token.
 *
 * @param token - Invite token
 * @param baseUrl - Base URL (defaults to NEXT_PUBLIC_APP_URL or current origin)
 * @returns Full invite link URL
 *
 * @example
 * buildInviteLinkUrl("abc123", "https://example.com")
 * // → "https://example.com/join/abc123"
 *
 * buildInviteLinkUrl("xyz789")
 * // → Uses NEXT_PUBLIC_APP_URL or window.location.origin
 */
export function buildInviteLinkUrl(token: string, baseUrl?: string): string {
  const base =
    baseUrl ||
    (typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_APP_URL
      : undefined) ||
    (typeof window !== "undefined" ? window.location.origin : "");

  return `${base}/join/${token}`;
}

/**
 * Formats the invite link description text for UI display.
 *
 * Generates a human-readable description including:
 * - Expiration time (singular/plural)
 * - Max uses (singular/plural/unlimited)
 *
 * @param expirationDays - Number of days until expiration
 * @param maxUses - Max uses string input
 * @param isUnlimited - Whether unlimited uses is enabled
 * @returns Formatted description string
 *
 * @example
 * formatLinkDescription(1, "1", false)
 * // → "El link expira en 1 día. Máximo 1 uso."
 *
 * formatLinkDescription(7, "5", false)
 * // → "El link expira en 7 días. Máximo 5 usos."
 *
 * formatLinkDescription(7, "1", true)
 * // → "El link expira en 7 días. Usos ilimitados."
 */
export function formatLinkDescription(
  expirationDays: number,
  maxUses: string,
  isUnlimited: boolean,
): string {
  // Expiration text
  const expirationText =
    expirationDays === 1
      ? "El link expira en 1 día."
      : `El link expira en ${expirationDays} días.`;

  // Uses text
  let usesText: string;
  if (isUnlimited) {
    usesText = "Usos ilimitados.";
  } else {
    const uses = parseInt(maxUses, 10);
    usesText = uses === 1 ? "Máximo 1 uso." : `Máximo ${uses} usos.`;
  }

  return `${expirationText} ${usesText}`;
}
