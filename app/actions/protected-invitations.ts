"use server";

import { withInvitationAuth, InvitationUser } from "@/lib/invitation-auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  invitationResponseSchema,
  validateAndSanitize,
} from "@/utils/validation";
import { logError } from "@/lib/logger";
import {
  validateGuestCount,
  normalizeGuestCount,
} from "@/lib/invitation-tokens";

// Input type mirrors invitationResponseSchema
type UpdateInvitationResponseData = {
  isAttending: boolean;
  guestCount?: number | null;
  menuPreference?: string | null;
  dietaryRestrictions?: string | null;
  messageForCouple?: string | null;
};

// Protected action: update guest RSVP response
export const updateInvitationResponse = withInvitationAuth(
  async (user: InvitationUser, data: UpdateInvitationResponseData) => {
    try {
      // Validate input with Zod
      const validation = validateAndSanitize(invitationResponseSchema, data);
      if (!validation.success) {
        return { success: false, error: validation.error };
      }
      const validated = validation.data;

      // Use pure validation logic
      const guestCountValidation = validateGuestCount(
        validated.guestCount ?? null,
        user.maxGuests,
        validated.isAttending,
      );

      if (!guestCountValidation.valid) {
        return {
          success: false,
          error: guestCountValidation.reason || "Invalid guest count",
        };
      }

      // Normalize guest count using pure function
      const normalizedGuestCount = normalizeGuestCount(
        validated.guestCount ?? null,
        validated.isAttending,
      );

      // Only persist extended fields when attending (no point otherwise)
      const extendedFields = validated.isAttending
        ? {
            menuPreference: validated.menuPreference ?? null,
            dietaryRestrictions: validated.dietaryRestrictions ?? null,
            messageForCouple: validated.messageForCouple ?? null,
          }
        : {
            menuPreference: null,
            dietaryRestrictions: null,
            messageForCouple: null,
          };

      // Update invitation — only return safe fields
      // NOTE: extendedFields (menuPreference, dietaryRestrictions, messageForCouple)
      // will be active after running: prisma migrate dev
      const updatedInvitation = await prisma.invitation.update({
        where: { id: user.invitationId },
        data: {
          hasResponded: true,
          isAttending: validated.isAttending,
          guestCount: normalizedGuestCount,
          respondedAt: new Date(),
          // TODO: uncomment after migration
          // ...extendedFields,
        },
        select: {
          id: true,
          hasResponded: true,
          isAttending: true,
          guestCount: true,
          respondedAt: true,
          // menuPreference, dietaryRestrictions, messageForCouple added after migration
        },
      });

      revalidatePath("/");
      return { success: true, data: updatedInvitation };
    } catch (error) {
      logError("Error updating invitation response", error);
      return { success: false, error: "Error al procesar la respuesta" }; // TODO: i18n
    }
  },
);

// Wrapper para useActionState - actualizar respuesta de invitación
export async function updateInvitationResponseAction(
  prevState: { success: boolean; error?: string } | null,
  formData: FormData,
) {
  const isAttending = formData.get("isAttending") === "true";
  const guestCount = formData.get("guestCount")
    ? parseInt(formData.get("guestCount") as string)
    : null;

  const result = await updateInvitationResponse({
    isAttending,
    guestCount,
  });

  return result;
}

// Action protegido para obtener datos del usuario actual
export const getCurrentUserData = withInvitationAuth(
  async (user: InvitationUser) => {
    try {
      // Obtener datos actualizados de la invitación
      const invitation = await prisma.invitation.findUnique({
        where: { id: user.invitationId },
      });

      if (!invitation) {
        return { success: false, error: "Invitación no encontrada" };
      }

      return {
        success: true,
        user: {
          invitationId: invitation.id,
          tokenId: user.tokenId,
          guestName: invitation.guestName,
          guestNickname: invitation.guestNickname,
          maxGuests: invitation.maxGuests,
          hasResponded: invitation.hasResponded,
          isAttending: invitation.isAttending,
          guestCount: invitation.guestCount,
          respondedAt: invitation.respondedAt,
          // Extended RSVP fields — available after migration
          // TODO: uncomment after migration
          // menuPreference: invitation.menuPreference,
          // dietaryRestrictions: invitation.dietaryRestrictions,
          // messageForCouple: invitation.messageForCouple,
        },
      };
    } catch (error) {
      logError("Error al obtener datos del usuario", error);
      return { success: false, error: "Error al obtener datos del usuario" };
    }
  },
);
