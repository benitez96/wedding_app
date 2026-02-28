"use server";

import { revalidatePath } from "next/cache";
import { withEventAuth } from "@/lib/server-auth";
import prisma from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions";
import { logError } from "@/lib/logger";

/**
 * Elimina una invitación del evento activo
 */
export const deleteInvitation = withEventAuth(async (ctx, id: string) => {
  try {
    // Verificar que la invitación pertenece al evento activo
    await prisma.invitation.delete({
      where: { id, eventId: ctx.event.eventId },
    });

    revalidatePath("/backoffice/invitations");
    return { success: true };
  } catch (error) {
    logError("Error al eliminar invitación", error);
    return { success: false, error: "Error al eliminar la invitación" };
  }
}, PERMISSIONS.GUESTS_DELETE);
