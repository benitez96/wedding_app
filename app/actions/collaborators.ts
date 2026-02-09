"use server";

import { withAuth, withEventAuth } from "@/lib/server-auth";
import type { User } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { enforceCollaboratorAccess } from "@/lib/tier-enforcement-prisma";
import { verifyEventAccess } from "@/lib/event-context-prisma";
import {
  PERMISSIONS,
  PERMISSION_PRESETS,
  hasPermission,
} from "@/lib/permissions";
import crypto from "crypto";
import { logError } from "@/lib/logger";

/**
 * Maximum permissions that can be granted via invite links or permission updates.
 * Prevents privilege escalation to critical event operations.
 */
const MAX_GRANTABLE_PERMISSIONS = PERMISSION_PRESETS.ADMIN;

/**
 * Lista colaboradores de un evento
 */
export const getEventCollaborators = withEventAuth(async (ctx) => {
  try {
    const members = await prisma.eventMember.findMany({
      where: {
        eventId: ctx.event.eventId,
        revokedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const serialized = members.map((m) => ({
      id: m.id,
      userId: m.userId,
      userName: m.user.name,
      userEmail: m.user.email,
      userImage: m.user.image,
      permissions: m.permissions.toString(),
      invitedAt: m.invitedAt.toISOString(),
      invitedBy: m.invitedBy,
    }));

    return { success: true, data: serialized };
  } catch (error) {
    logError("Error al obtener colaboradores", error);
    return { success: false, error: "Error al cargar los colaboradores" };
  }
}, PERMISSIONS.COLLABORATORS_VIEW);

/**
 * Crea un link de invitacion para colaboradores
 */
export const createInviteLink = withEventAuth(
  async (
    ctx,
    permissions: string,
    expiresInHours?: number,
    maxUses?: number,
  ) => {
    try {
      // Verificar que el owner tiene tier COMPANY
      const enforcement = await enforceCollaboratorAccess(ctx.user.id);
      if (!enforcement.allowed) {
        return { success: false, error: enforcement.reason };
      }

      const token = crypto.randomBytes(32).toString("hex");

      // Validate permissions string is a valid BigInt
      let permissionsBigInt: bigint;
      try {
        permissionsBigInt = BigInt(permissions);
      } catch {
        return { success: false, error: "Formato de permisos inválido" };
      }

      // SECURITY: Prevent privilege escalation - cannot grant permissions beyond MAX_GRANTABLE_PERMISSIONS
      if ((permissionsBigInt & ~MAX_GRANTABLE_PERMISSIONS) !== 0n) {
        return {
          success: false,
          error: "No se pueden otorgar permisos críticos del evento",
        };
      }

      // SECURITY: Cannot grant permissions the caller doesn't have (unless owner)
      if (
        !ctx.event.isOwner &&
        (permissionsBigInt & ~ctx.event.permissions) !== 0n
      ) {
        return {
          success: false,
          error: "No podés otorgar permisos que no tenés",
        };
      }

      const expiresAt = expiresInHours
        ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
        : null;

      const inviteLink = await prisma.eventInviteLink.create({
        data: {
          eventId: ctx.event.eventId,
          token,
          permissions: permissionsBigInt,
          createdBy: ctx.user.id,
          expiresAt,
          maxUses: maxUses ?? 1,
        },
      });

      return {
        success: true,
        data: {
          id: inviteLink.id,
          token: inviteLink.token,
          expiresAt: inviteLink.expiresAt?.toISOString() ?? null,
        },
      };
    } catch (error) {
      logError("Error al crear link de invitación", error);
      return { success: false, error: "Error al crear el link de invitación" };
    }
  },
  PERMISSIONS.COLLABORATORS_INVITE,
);

/**
 * Actualiza permisos de un colaborador
 */
export const updateCollaboratorPermissions = withEventAuth(
  async (ctx, memberId: string, permissions: string) => {
    try {
      const enforcement = await enforceCollaboratorAccess(ctx.user.id);
      if (!enforcement.allowed) {
        return { success: false, error: enforcement.reason };
      }

      // Validate permissions string is a valid BigInt
      let permissionsBigInt: bigint;
      try {
        permissionsBigInt = BigInt(permissions);
      } catch {
        return { success: false, error: "Formato de permisos inválido" };
      }

      // SECURITY: Prevent privilege escalation - cannot grant critical event permissions
      if ((permissionsBigInt & ~MAX_GRANTABLE_PERMISSIONS) !== 0n) {
        return {
          success: false,
          error: "No se pueden otorgar permisos críticos del evento",
        };
      }

      // SECURITY: Cannot grant permissions the caller doesn't have (unless owner)
      if (
        !ctx.event.isOwner &&
        (permissionsBigInt & ~ctx.event.permissions) !== 0n
      ) {
        return {
          success: false,
          error: "No podés otorgar permisos que no tenés",
        };
      }

      const member = await prisma.eventMember.update({
        where: {
          id: memberId,
          eventId: ctx.event.eventId,
        },
        data: {
          permissions: permissionsBigInt,
        },
      });

      revalidatePath("/backoffice/collaborators");
      return {
        success: true,
        data: {
          id: member.id,
          permissions: member.permissions.toString(),
        },
      };
    } catch (error) {
      logError("Error al actualizar permisos", error);
      return { success: false, error: "Error al actualizar los permisos" };
    }
  },
  PERMISSIONS.COLLABORATORS_EDIT,
);

/**
 * Revoca acceso de un colaborador
 */
export const removeCollaborator = withEventAuth(
  async (ctx, memberId: string) => {
    try {
      const enforcement = await enforceCollaboratorAccess(ctx.user.id);
      if (!enforcement.allowed) {
        return { success: false, error: enforcement.reason };
      }

      await prisma.eventMember.update({
        where: {
          id: memberId,
          eventId: ctx.event.eventId,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      revalidatePath("/backoffice/collaborators");
      return { success: true };
    } catch (error) {
      logError("Error al revocar acceso", error);
      return { success: false, error: "Error al revocar el acceso" };
    }
  },
  PERMISSIONS.COLLABORATORS_REMOVE,
);

/**
 * Acepta un link de invitacion de colaboracion
 */
export const acceptInviteLink = withAuth(async (user: User, token: string) => {
  try {
    // Buscar el link
    const inviteLink = await prisma.eventInviteLink.findUnique({
      where: { token },
      include: {
        event: {
          select: { id: true, name: true },
        },
      },
    });

    if (!inviteLink) {
      return { success: false, error: "Link de invitación no encontrado" };
    }

    if (!inviteLink.isActive) {
      return { success: false, error: "Este link ya no está activo" };
    }

    if (inviteLink.expiresAt && inviteLink.expiresAt < new Date()) {
      return { success: false, error: "Este link ha expirado" };
    }

    if (
      inviteLink.maxUses !== null &&
      inviteLink.usedCount >= inviteLink.maxUses
    ) {
      return {
        success: false,
        error: "Este link ya alcanzó el máximo de usos",
      };
    }

    // Verificar que no sea ya miembro
    const existingMember = await prisma.eventMember.findUnique({
      where: {
        eventId_userId: {
          eventId: inviteLink.eventId,
          userId: user.id,
        },
      },
    });

    if (existingMember && !existingMember.revokedAt) {
      return {
        success: false,
        error: "Ya eres colaborador de este evento",
      };
    }

    // Crear o reactivar membership en transaccion
    await prisma.$transaction(async (tx) => {
      if (existingMember) {
        // Reactivar membership revocada
        await tx.eventMember.update({
          where: { id: existingMember.id },
          data: {
            permissions: inviteLink.permissions,
            revokedAt: null,
            invitedBy: inviteLink.createdBy,
            invitedAt: new Date(),
          },
        });
      } else {
        // Crear nuevo membership
        await tx.eventMember.create({
          data: {
            eventId: inviteLink.eventId,
            userId: user.id,
            permissions: inviteLink.permissions,
            invitedBy: inviteLink.createdBy,
          },
        });
      }

      // Incrementar contador de usos
      await tx.eventInviteLink.update({
        where: { id: inviteLink.id },
        data: {
          usedCount: { increment: 1 },
          isActive:
            inviteLink.maxUses !== null &&
            inviteLink.usedCount + 1 >= inviteLink.maxUses
              ? false
              : true,
        },
      });
    });

    return {
      success: true,
      data: {
        eventId: inviteLink.event.id,
        eventName: inviteLink.event.name,
      },
    };
  } catch (error) {
    logError("Error al aceptar invitación", error);
    return { success: false, error: "Error al aceptar la invitación" };
  }
});

/**
 * Obtiene info de un invite link (sin autenticar, para mostrar preview)
 */
export async function getInviteLinkInfo(token: string) {
  try {
    const inviteLink = await prisma.eventInviteLink.findUnique({
      where: { token },
      include: {
        event: {
          select: { id: true, name: true, description: true },
        },
      },
    });

    if (!inviteLink || !inviteLink.isActive) {
      return { success: false, error: "Link no válido o expirado" };
    }

    if (inviteLink.expiresAt && inviteLink.expiresAt < new Date()) {
      return { success: false, error: "Este link ha expirado" };
    }

    if (
      inviteLink.maxUses !== null &&
      inviteLink.usedCount >= inviteLink.maxUses
    ) {
      return { success: false, error: "Este link ya no está disponible" };
    }

    return {
      success: true,
      data: {
        eventName: inviteLink.event.name,
        eventDescription: inviteLink.event.description,
      },
    };
  } catch (error) {
    logError("Error al obtener info del link", error);
    return { success: false, error: "Error al cargar la información" };
  }
}

/**
 * Lista los invite links activos de un evento
 */
export const getEventInviteLinks = withEventAuth(async (ctx) => {
  try {
    const links = await prisma.eventInviteLink.findMany({
      where: {
        eventId: ctx.event.eventId,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const serialized = links.map((l) => ({
      id: l.id,
      token: l.token,
      permissions: l.permissions.toString(),
      expiresAt: l.expiresAt?.toISOString() ?? null,
      maxUses: l.maxUses,
      usedCount: l.usedCount,
      createdAt: l.createdAt.toISOString(),
    }));

    return { success: true, data: serialized };
  } catch (error) {
    logError("Error al obtener links", error);
    return { success: false, error: "Error al cargar los links" };
  }
}, PERMISSIONS.COLLABORATORS_VIEW);
