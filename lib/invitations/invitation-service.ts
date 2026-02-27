/**
 * Business logic for invitation operations
 * Testable service layer - NO server actions here
 */

import type { z } from "zod";
import type { invitationSchema } from "@/utils/validation";

export interface InvitationData {
  guestName: string;
  guestNickname?: string | null;
  guestPhone?: string | null;
  maxGuests: number;
  hasResponded: boolean;
  isAttending: boolean;
  guestCount: number | null;
}

export interface InvitationCreateData {
  eventId: string;
  guestName: string;
  guestNickname: string | null;
  guestPhone: string | null;
  maxGuests: number;
  hasResponded?: boolean; // Optional para que pueda ser undefined
  isAttending: boolean | null;
  guestCount: number | null;
  respondedAt: Date | null;
}

/**
 * Valida que guestCount esté dentro del rango permitido
 * Business rule: Si está asistiendo, debe traer entre 1 y maxGuests personas
 */
export function validateGuestCount(data: {
  isAttending?: boolean;
  guestCount?: number | null;
  maxGuests: number;
}): { valid: boolean; error?: string } {
  if (!data.isAttending) {
    return { valid: true };
  }

  if (!data.guestCount || data.guestCount < 1) {
    return {
      valid: false,
      error: "Debe indicar al menos 1 asistente",
    };
  }

  if (data.guestCount > data.maxGuests) {
    return {
      valid: false,
      error: `El número de asistentes no puede exceder el máximo permitido (${data.maxGuests})`,
    };
  }

  return { valid: true };
}

/**
 * Prepara datos de invitación para crear en DB
 * Business rule: isAttending y guestCount solo se guardan si hasResponded es true
 */
export function prepareInvitationData(
  eventId: string,
  data: z.infer<typeof invitationSchema>,
): InvitationCreateData {
  return {
    eventId,
    guestName: data.guestName,
    guestNickname: data.guestNickname || null,
    guestPhone: data.guestPhone || null,
    maxGuests: data.maxGuests,
    hasResponded: data.hasResponded || false,
    isAttending: data.hasResponded ? (data.isAttending ?? false) : null,
    guestCount:
      data.hasResponded && data.isAttending ? (data.guestCount ?? null) : null,
    respondedAt: data.hasResponded ? new Date() : null,
  };
}

/**
 * Prepara datos de invitación para actualizar en DB
 * Igual lógica que create pero sin eventId
 */
export function prepareInvitationUpdateData(
  data: z.infer<typeof invitationSchema>,
): Omit<InvitationCreateData, "eventId"> {
  return {
    guestName: data.guestName,
    guestNickname: data.guestNickname || null,
    guestPhone: data.guestPhone || null,
    maxGuests: data.maxGuests,
    hasResponded: data.hasResponded ?? false,
    isAttending: data.hasResponded ? (data.isAttending ?? false) : null,
    guestCount:
      data.hasResponded && data.isAttending ? (data.guestCount ?? null) : null,
    respondedAt: data.hasResponded ? new Date() : null,
  };
}
