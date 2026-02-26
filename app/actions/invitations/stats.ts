"use server";

import { withEventAuth } from "@/lib/server-auth";
import prisma from "@/lib/prisma";
import { getGuestUsage } from "@/lib/tier-enforcement-prisma";
import { PERMISSIONS } from "@/lib/permissions";
import { logError } from "@/lib/logger";

/**
 * Obtiene estadísticas de invitaciones del evento activo
 */
export const getInvitationsStats = withEventAuth(async (ctx) => {
  try {
    const eventId = ctx.event.eventId;

    const [total, pending, declined, confirmedGuests] = await Promise.all([
      prisma.invitation.count({
        where: { eventId },
      }),

      prisma.invitation.count({
        where: {
          eventId,
          hasResponded: false,
        },
      }),

      prisma.invitation.count({
        where: {
          eventId,
          hasResponded: true,
          isAttending: false,
        },
      }),

      prisma.invitation.aggregate({
        where: {
          eventId,
          hasResponded: true,
          isAttending: true,
          guestCount: {
            not: null,
          },
        },
        _sum: {
          guestCount: true,
        },
      }),
    ]);

    return {
      success: true,
      data: {
        total,
        pending,
        confirmed: confirmedGuests._sum.guestCount || 0,
        declined,
      },
    };
  } catch (error) {
    logError("Error al obtener estadísticas de invitaciones", error);
    return { success: false, error: "Error al cargar las estadísticas" };
  }
}, PERMISSIONS.GUESTS_VIEW);

/**
 * Obtiene el uso de invitados (límites de tier)
 */
export const getInvitationUsage = withEventAuth(async (ctx) => {
  try {
    const usage = await getGuestUsage(ctx.user.id, ctx.event.eventId);
    return { success: true, data: usage };
  } catch (error) {
    logError("Error al obtener uso de invitaciones", error);
    return { success: false, error: "Error al obtener el uso" };
  }
});
