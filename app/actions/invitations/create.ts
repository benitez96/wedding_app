"use server";

import { withEventAuth } from "@/lib/server-auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { enforceGuestLimit } from "@/lib/tier-enforcement-prisma";
import { PERMISSIONS } from "@/lib/permissions";
import { logError } from "@/lib/logger";
import { extractInvitationData } from "./_shared";
import { prepareInvitationData } from "@/lib/invitations/invitation-service";

/**
 * Crea una nueva invitación (con enforcement de tier)
 */
export const createInvitation = withEventAuth(
  async (ctx, formData: FormData) => {
    try {
      const { user, event } = ctx;

      // Enforce guest limit antes de crear
      const enforcement = await enforceGuestLimit(user.id, event.eventId);
      if (!enforcement.allowed) {
        return {
          success: false,
          error: enforcement.reason,
          limitReached: true,
        };
      }

      const extraction = extractInvitationData(formData);
      if (!extraction.success || !extraction.data) {
        return { success: false, error: extraction.error };
      }

      const data = extraction.data;

      // Business logic: prepare data for DB
      const invitationData = prepareInvitationData(event.eventId, data);

      const invitation = await prisma.invitation.create({
        data: invitationData,
      });

      revalidatePath("/backoffice/invitations");
      return { success: true, data: invitation };
    } catch (error) {
      logError("Error al crear invitación", error);
      return { success: false, error: "Error al crear la invitación" };
    }
  },
  PERMISSIONS.GUESTS_CREATE,
);

/**
 * Wrapper para useActionState - crear invitación
 */
export async function createInvitationAction(
  prevState: { success: boolean; error?: string } | null,
  formData: FormData,
) {
  const result = await createInvitation(formData);
  return result;
}
