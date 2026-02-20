/**
 * RSVP Reminder Utilities
 *
 * Pure functions for RSVP reminder logic:
 * - Calculate days remaining until wedding
 * - Determine if reminder should be shown
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReminderCheckParams {
  weddingTimestamp: number;
  remindRestingDays: number;
  hasResponded: boolean;
  currentDate?: Date; // Optional for testing, defaults to new Date()
}

export interface ReminderCheckResult {
  shouldShow: boolean;
  daysRemaining: number;
}

// ---------------------------------------------------------------------------
// Core Logic
// ---------------------------------------------------------------------------

/**
 * Calculates days remaining until wedding date.
 *
 * @param weddingTimestamp - Wedding date in milliseconds (timestamp)
 * @param currentDate - Current date (defaults to now)
 * @returns Number of days remaining (can be negative if wedding already passed)
 */
export function calculateDaysRemaining(
  weddingTimestamp: number,
  currentDate: Date = new Date(),
): number {
  const diffTime = weddingTimestamp - currentDate.getTime();
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  // Normalize -0 to +0 (Math.ceil can return -0 for negative fractions)
  return days === 0 ? 0 : days;
}

/**
 * Determines if RSVP reminder should be shown.
 *
 * Reminder is shown when:
 * - User has NOT responded yet
 * - Days remaining < configured threshold (remindRestingDays)
 * - Wedding date has NOT passed (days > 0)
 *
 * @param params - Reminder check parameters
 * @returns Object with shouldShow flag and daysRemaining
 */
export function shouldShowReminder({
  weddingTimestamp,
  remindRestingDays,
  hasResponded,
  currentDate = new Date(),
}: ReminderCheckParams): ReminderCheckResult {
  // Don't show if user already responded
  if (hasResponded) {
    return {
      shouldShow: false,
      daysRemaining: calculateDaysRemaining(weddingTimestamp, currentDate),
    };
  }

  const daysRemaining = calculateDaysRemaining(weddingTimestamp, currentDate);

  // Show reminder if:
  // - Less than X days remaining (remindRestingDays)
  // - Wedding hasn't passed yet (daysRemaining > 0)
  const shouldShow = daysRemaining < remindRestingDays && daysRemaining > 0;

  return { shouldShow, daysRemaining };
}
