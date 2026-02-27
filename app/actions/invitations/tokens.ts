"use server";

import { revalidatePath } from "next/cache";
import { withEventAuth } from "@/lib/server-auth";
import prisma from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions";
import { logError } from "@/lib/logger";
import {
  generateTokenId,
  calculateDefaultExpiration,
} from "@/lib/invitations/token-service";

/**
 * Crea un nuevo token de invitación
 */
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

      // Business logic: generate secure token ID and expiration
      const id = await generateTokenId();
      const expiresAt = calculateDefaultExpiration();

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

/**
 * Revoca un token de invitación
 */
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

/**
 * Reactiva un token de invitación previamente revocado
 */
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

/**
 * Elimina permanentemente un token de invitación
 */
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
