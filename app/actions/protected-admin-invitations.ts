"use server";

import { withEventAuth } from "@/lib/server-auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/app/generated/prisma";
import { z } from "zod";
import {
  invitationSchema,
  searchSchema,
  validateAndSanitize,
  sanitizeString,
} from "@/utils/validation";
import {
  enforceGuestLimit,
  getGuestUsage,
} from "@/lib/tier-enforcement-prisma";
import { PERMISSIONS } from "@/lib/permissions";
import { logError } from "@/lib/logger";

// Action protegido para obtener invitaciones (scoped por evento)
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

// Action protegido para crear invitación (con enforcement de tier)
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

      const guestName = formData.get("guestName") as string;
      const guestNickname = formData.get("guestNickname") as string;
      const guestPhone = formData.get("guestPhone") as string;
      const maxGuests = parseInt(formData.get("maxGuests") as string);
      const hasResponded = formData.get("hasResponded") === "true";
      const isAttending = formData.get("isAttending") === "true";
      const guestCount = formData.get("guestCount")
        ? parseInt(formData.get("guestCount") as string)
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

      const { data } = validation as {
        success: true;
        data: z.infer<typeof invitationSchema>;
      };

      const invitation = await prisma.invitation.create({
        data: {
          eventId: event.eventId,
          guestName: data.guestName,
          guestNickname: data.guestNickname || null,
          guestPhone: data.guestPhone || null,
          maxGuests: data.maxGuests,
          hasResponded: data.hasResponded || false,
          isAttending: data.hasResponded ? data.isAttending : null,
          guestCount:
            data.hasResponded && data.isAttending ? data.guestCount : null,
          respondedAt: data.hasResponded ? new Date() : null,
        },
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

// Action protegido para actualizar invitación (scoped por evento)
export const updateInvitation = withEventAuth(
  async (ctx, id: string, formData: FormData) => {
    try {
      const { event } = ctx;

      const guestName = formData.get("guestName") as string;
      const guestNickname = formData.get("guestNickname") as string;
      const guestPhone = formData.get("guestPhone") as string;
      const maxGuests = parseInt(formData.get("maxGuests") as string);
      const hasResponded = formData.get("hasResponded") === "true";
      const isAttending = formData.get("isAttending") === "true";
      const guestCount = formData.get("guestCount")
        ? parseInt(formData.get("guestCount") as string)
        : null;

      // Validate and sanitize with Zod (same schema as createInvitation)
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

      // Validar guestCount si isAttending es true
      if (
        validatedData.isAttending &&
        (!validatedData.guestCount ||
          validatedData.guestCount < 1 ||
          validatedData.guestCount > validatedData.maxGuests)
      ) {
        return {
          success: false,
          error:
            "Número de asistentes debe estar entre 1 y el máximo permitido",
        };
      }

      // Verificar que la invitación pertenece al evento activo
      const invitation = await prisma.invitation.update({
        where: { id, eventId: event.eventId },
        data: {
          guestName: validatedData.guestName,
          guestNickname: validatedData.guestNickname || null,
          guestPhone: validatedData.guestPhone || null,
          maxGuests: validatedData.maxGuests,
          hasResponded: validatedData.hasResponded,
          isAttending: validatedData.hasResponded
            ? validatedData.isAttending
            : null,
          guestCount:
            validatedData.hasResponded && validatedData.isAttending
              ? validatedData.guestCount
              : null,
          respondedAt: validatedData.hasResponded ? new Date() : null,
        },
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

// Wrapper para useActionState - actualizar invitación
export async function updateInvitationAction(
  invitationId: string,
  prevState: { success: boolean; error?: string } | null,
  formData: FormData,
) {
  const result = await updateInvitation(invitationId, formData);
  return result;
}

// Wrapper para useActionState - crear invitación
export async function createInvitationAction(
  prevState: { success: boolean; error?: string } | null,
  formData: FormData,
) {
  const result = await createInvitation(formData);
  return result;
}

// Action protegido para eliminar invitación (scoped por evento)
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

// Action protegido para obtener invitación con tokens (scoped por evento)
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

// Action protegido para obtener estadísticas de invitaciones (scoped por evento)
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

// Action para obtener el uso de invitados (limites de tier)
export const getInvitationUsage = withEventAuth(async (ctx) => {
  try {
    const usage = await getGuestUsage(ctx.user.id, ctx.event.eventId);
    return { success: true, data: usage };
  } catch (error) {
    logError("Error al obtener uso de invitaciones", error);
    return { success: false, error: "Error al obtener el uso" };
  }
});

// Action protegido para crear token de invitación (scoped por evento)
export const createInvitationToken = withEventAuth(
  async (ctx, invitationId: string) => {
    try {
      // Verificar que la invitación pertenece al evento activo
      const invitation = await prisma.invitation.findFirst({
        where: { id: invitationId, eventId: ctx.event.eventId },
      });

      if (!invitation) {
        return { success: false, error: "Invitación no encontrada" };
      }

      const crypto = await import("crypto");
      // Generate a crypto-secure short ID (21 chars, base64url, ~126 bits of entropy)
      // This ID is used directly in invitation URLs: /r/{id}
      const id = crypto.randomBytes(16).toString("base64url").slice(0, 21);

      // Default expiration: 1 year from now (can be revoked from backoffice)
      const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
      const expiresAt = new Date(Date.now() + ONE_YEAR_MS);

      const invitationToken = await prisma.invitationToken.create({
        data: {
          id,
          invitationId,
          expiresAt,
        },
      });

      revalidatePath("/backoffice/invitations");
      return { success: true, data: invitationToken };
    } catch (error) {
      logError("Error al crear token de invitación", error);
      return { success: false, error: "Error al crear el token de invitación" };
    }
  },
  PERMISSIONS.GUESTS_SEND,
);

// Action protegido para revocar token de invitación
export const revokeInvitationToken = withEventAuth(
  async (ctx, tokenId: string) => {
    try {
      // Verificar que el token pertenezca al evento del usuario
      const tokenWithEvent = await prisma.invitationToken.findUnique({
        where: { id: tokenId },
        include: {
          invitation: {
            select: { eventId: true },
          },
        },
      });

      if (!tokenWithEvent || !tokenWithEvent.invitation) {
        return { success: false, error: "Token no encontrado" };
      }

      if (tokenWithEvent.invitation.eventId !== ctx.event.eventId) {
        return { success: false, error: "No autorizado para este token" };
      }

      const token = await prisma.invitationToken.update({
        where: { id: tokenId },
        data: { isActive: false },
      });

      revalidatePath("/backoffice/invitations");
      return { success: true, data: token };
    } catch (error) {
      logError("Error al revocar token", error);
      return { success: false, error: "Error al revocar el token" };
    }
  },
  PERMISSIONS.GUESTS_EDIT,
);

// Action protegido para reactivar token de invitación
export const reactivateInvitationToken = withEventAuth(
  async (ctx, tokenId: string) => {
    try {
      // Verificar que el token pertenezca al evento del usuario
      const tokenWithEvent = await prisma.invitationToken.findUnique({
        where: { id: tokenId },
        include: {
          invitation: {
            select: { eventId: true },
          },
        },
      });

      if (!tokenWithEvent || !tokenWithEvent.invitation) {
        return { success: false, error: "Token no encontrado" };
      }

      if (tokenWithEvent.invitation.eventId !== ctx.event.eventId) {
        return { success: false, error: "No autorizado para este token" };
      }

      const token = await prisma.invitationToken.update({
        where: { id: tokenId },
        data: { isActive: true },
      });

      revalidatePath("/backoffice/invitations");
      return { success: true, data: token };
    } catch (error) {
      logError("Error al reactivar token", error);
      return { success: false, error: "Error al reactivar el token" };
    }
  },
  PERMISSIONS.GUESTS_EDIT,
);

// Action protegido para eliminar token de invitación
export const deleteInvitationToken = withEventAuth(
  async (ctx, tokenId: string) => {
    try {
      // Verificar que el token pertenezca al evento del usuario
      const tokenWithEvent = await prisma.invitationToken.findUnique({
        where: { id: tokenId },
        include: {
          invitation: {
            select: { eventId: true },
          },
        },
      });

      if (!tokenWithEvent || !tokenWithEvent.invitation) {
        return { success: false, error: "Token no encontrado" };
      }

      if (tokenWithEvent.invitation.eventId !== ctx.event.eventId) {
        return { success: false, error: "No autorizado para este token" };
      }

      await prisma.invitationToken.delete({
        where: { id: tokenId },
      });

      revalidatePath("/backoffice/invitations");
      return { success: true };
    } catch (error) {
      logError("Error al eliminar token", error);
      return { success: false, error: "Error al eliminar el token" };
    }
  },
  PERMISSIONS.GUESTS_DELETE,
);
