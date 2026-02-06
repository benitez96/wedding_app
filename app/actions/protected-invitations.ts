"use server";

import { withInvitationAuth, InvitationUser } from "@/lib/invitation-auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  invitationResponseSchema,
  validateAndSanitize,
} from "@/utils/validation";
import { logError } from "@/lib/logger";

// Action protegido para actualizar respuesta de invitación
export const updateInvitationResponse = withInvitationAuth(
  async (
    user: InvitationUser,
    data: {
      isAttending: boolean;
      guestCount?: number | null;
      message?: string | null;
    },
  ) => {
    try {
      // Validate input with Zod
      const validation = validateAndSanitize(invitationResponseSchema, data);
      if (!validation.success) {
        return { success: false, error: validation.error };
      }
      const validated = (validation as { success: true; data: typeof data })
        .data;

      // Validar guestCount si isAttending es true
      if (
        validated.isAttending &&
        (!validated.guestCount ||
          validated.guestCount < 1 ||
          validated.guestCount > user.maxGuests)
      ) {
        return {
          success: false,
          error:
            "Número de asistentes debe estar entre 1 y el máximo permitido",
        };
      }

      // Actualizar la invitación - only return safe fields
      const updatedInvitation = await prisma.invitation.update({
        where: { id: user.invitationId },
        data: {
          hasResponded: true,
          isAttending: validated.isAttending,
          guestCount: validated.isAttending ? validated.guestCount : null,
          respondedAt: new Date(),
        },
        select: {
          id: true,
          hasResponded: true,
          isAttending: true,
          guestCount: true,
          respondedAt: true,
        },
      });

      revalidatePath("/");
      return { success: true, data: updatedInvitation };
    } catch (error) {
      logError("Error al actualizar respuesta de invitación", error);
      return { success: false, error: "Error al procesar la respuesta" };
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
        },
      };
    } catch (error) {
      logError("Error al obtener datos del usuario", error);
      return { success: false, error: "Error al obtener datos del usuario" };
    }
  },
);
