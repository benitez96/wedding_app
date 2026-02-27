/**
 * Shared utilities for invitation actions
 * Extracts and validates FormData for invitation operations
 */

import { z } from "zod";
import { invitationSchema, validateAndSanitize } from "@/utils/validation";

export interface InvitationFormData {
  guestName: string;
  guestNickname: string;
  guestPhone: string;
  maxGuests: number;
  hasResponded: boolean;
  isAttending: boolean;
  guestCount: number | null;
}

/**
 * Extrae y valida datos de invitación desde FormData
 * Elimina duplicación entre createInvitation y updateInvitation
 */
export function extractInvitationData(formData: FormData): {
  success: boolean;
  data?: z.infer<typeof invitationSchema>;
  error?: string;
} {
  const guestName = formData.get("guestName") as string;
  const guestNickname = formData.get("guestNickname") as string;
  const guestPhone = formData.get("guestPhone") as string;
  const maxGuests = parseInt(formData.get("maxGuests") as string, 10);
  const hasResponded = formData.get("hasResponded") === "true";
  const isAttending = formData.get("isAttending") === "true";
  const guestCount = formData.get("guestCount")
    ? parseInt(formData.get("guestCount") as string, 10)
    : null;

  // Validar y sanitizar datos
  const validation = validateAndSanitize(invitationSchema, {
    guestName,
    guestNickname,
    guestPhone,
    maxGuests,
    hasResponded,
    isAttending,
    guestCount,
  });

  if (!validation.success) {
    return { success: false, error: validation.error };
  }

  const validatedData = (
    validation as { success: true; data: z.infer<typeof invitationSchema> }
  ).data;

  return { success: true, data: validatedData };
}
