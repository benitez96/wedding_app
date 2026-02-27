"use server";

import { withEventAuth } from "@/lib/server-auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PERMISSIONS } from "@/lib/permissions";
import { logError } from "@/lib/logger";
import { extractInvitationData } from "./_shared";
import {
  validateGuestCount,
  prepareInvitationUpdateData,
} from "@/lib/invitations/invitation-service";

/**
 * Actualiza una invitación existente
 */
export const updateInvitation = withEventAuth(
  async (ctx, id: string, formData: FormData) => {
    try {
      const { event } = ctx;

      const extraction = extractInvitationData(formData);
      if (!extraction.success || !extraction.data) {
        return { success: false, error: extraction.error };
      }

      const validatedData = extraction.data;

      // Business logic: validate guest count
      const guestCountValidation = validateGuestCount({
        isAttending: validatedData.isAttending,
        guestCount: validatedData.guestCount,
        maxGuests: validatedData.maxGuests,
      });

      if (!guestCountValidation.valid) {
        return {
          success: false,
          error: guestCountValidation.error!,
        };
      }

      // Business logic: prepare data for DB
      const updateData = prepareInvitationUpdateData(validatedData);

      // Verificar que la invitación pertenece al evento activo
      const invitation = await prisma.invitation.update({
        where: { id, eventId: event.eventId },
        data: updateData,
      });

      revalidatePath("/backoffice/invitations");
      return { success: true, data: invitation };
    } catch (error) {
      logError("Error al actualizar invitación", error);
      return { success: false, error: "Error al actualizar la invitación" };
    }
  },
  PERMISSIONS.GUESTS_EDIT,
);

/**
 * Wrapper para useActionState - actualizar invitación
 */
export async function updateInvitationAction(
  invitationId: string,
  prevState: { success: boolean; error?: string } | null,
  formData: FormData,
) {
  const result = await updateInvitation(invitationId, formData);
  return result;
}
