"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { z } from "zod";

const getInvitationsCacheSchema = z.object({
  eventId: z.string().cuid(),
});

interface InvitationCacheData {
  id: string;
  tokenId: string;
  guestName: string;
  guestNickname: string | null;
  maxGuests: number;
  checkInCount: number;
  lastSyncedAt: number;
}

interface GetInvitationsCacheResult {
  success: boolean;
  error?: string;
  invitations?: InvitationCacheData[];
  total?: number;
}

/**
 * Obtener invitaciones para cache local (offline)
 *
 * Descarga todas las invitaciones del evento con sus tokens activos
 * para validación offline. Solo incluye datos necesarios para el scanner.
 *
 * Se llama al cargar la página del scanner para poblar IndexedDB.
 */
export async function getInvitationsForCache(
  input: z.infer<typeof getInvitationsCacheSchema>,
): Promise<GetInvitationsCacheResult> {
  try {
    // 1. Autenticación
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "No autenticado" };
    }

    // 2. Validar input
    const validated = getInvitationsCacheSchema.parse(input);

    // 3. Verificar que el usuario sea owner o miembro con permisos
    const event = await prisma.event.findUnique({
      where: { id: validated.eventId },
      select: { ownerId: true },
    });

    const isOwner = event?.ownerId === session.user.id;

    if (!isOwner) {
      const member = await prisma.eventMember.findUnique({
        where: {
          eventId_userId: {
            eventId: validated.eventId,
            userId: session.user.id,
          },
        },
      });

      if (
        !member ||
        !hasPermission(member.permissions, PERMISSIONS.CHECKIN_SCAN)
      ) {
        return {
          success: false,
          error: "No tienes permisos para acceder a estas invitaciones",
        };
      }
    }

    // 4. Obtener todas las invitaciones del evento con tokens activos
    const invitations = await prisma.invitation.findMany({
      where: {
        eventId: validated.eventId,
      },
      include: {
        tokens: {
          where: {
            isActive: true,
            expiresAt: {
              gt: new Date(), // Solo tokens no expirados
            },
          },
          take: 1, // Solo necesitamos un token activo
          orderBy: {
            createdAt: "desc", // El más reciente
          },
        },
      },
      orderBy: {
        guestName: "asc",
      },
    });

    // 5. Mapear a formato de cache (solo datos necesarios)
    const cacheData: InvitationCacheData[] = invitations
      .filter((inv) => inv.tokens.length > 0) // Solo las que tienen token activo
      .map((inv) => ({
        id: inv.id,
        tokenId: inv.tokens[0].id,
        guestName: inv.guestName,
        guestNickname: inv.guestNickname,
        maxGuests: inv.maxGuests,
        checkInCount: inv.checkInCount,
        lastSyncedAt: Date.now(),
      }));

    return {
      success: true,
      invitations: cacheData,
      total: cacheData.length,
    };
  } catch (error) {
    console.error("[getInvitationsForCache] Error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Datos inválidos",
      };
    }

    return {
      success: false,
      error: "Error al obtener invitaciones",
    };
  }
}
