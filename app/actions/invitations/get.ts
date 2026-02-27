"use server";

import { withEventAuth } from "@/lib/server-auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma";
import {
  searchSchema,
  validateAndSanitize,
  sanitizeString,
} from "@/utils/validation";
import { PERMISSIONS } from "@/lib/permissions";
import { logError } from "@/lib/logger";

/**
 * Obtiene invitaciones del evento activo, con búsqueda opcional
 */
export const getInvitations = withEventAuth(
  async (ctx, searchTerm?: string) => {
    try {
      const { event } = ctx;

      // Validar término de búsqueda
      if (searchTerm) {
        const validation = validateAndSanitize(searchSchema, { searchTerm });
        if (!validation.success) {
          return { success: false, error: "Término de búsqueda inválido" };
        }
        const validatedData = validation as {
          success: true;
          data: { searchTerm?: string };
        };
        searchTerm = sanitizeString(validatedData.data.searchTerm || "");
      }

      const where: Prisma.InvitationWhereInput = {
        eventId: event.eventId,
        ...(searchTerm
          ? {
              OR: [
                {
                  guestName: {
                    contains: searchTerm,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
                {
                  guestNickname: {
                    contains: searchTerm,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              ],
            }
          : {}),
      };

      const invitations = await prisma.invitation.findMany({
        where,
        include: {
          tokens: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return { success: true, data: invitations };
    } catch (error) {
      logError("Error al obtener invitaciones", error);
      return { success: false, error: "Error al cargar las invitaciones" };
    }
  },
  PERMISSIONS.GUESTS_VIEW,
);

/**
 * Obtiene una invitación específica con sus tokens
 */
export const getInvitationWithTokens = withEventAuth(
  async (ctx, id: string) => {
    try {
      const invitation = await prisma.invitation.findFirst({
        where: { id, eventId: ctx.event.eventId },
        include: {
          tokens: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

      if (!invitation) {
        return { success: false, error: "Invitación no encontrada" };
      }

      return { success: true, data: invitation };
    } catch (error) {
      logError("Error al obtener invitación con tokens", error);
      return { success: false, error: "Error al cargar la invitación" };
    }
  },
  PERMISSIONS.GUESTS_VIEW,
);
