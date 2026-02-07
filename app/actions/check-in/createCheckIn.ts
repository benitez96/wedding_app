"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createCheckInSchema = z.object({
  invitationId: z.string().cuid(),
  guestsCount: z.number().int().min(1).max(20),
  deviceId: z.string().optional(),
  clientId: z.string().optional(),
});

interface CreateCheckInResult {
  success: boolean;
  error?: string;
  warning?: string;
  exceededCapacity?: boolean;
  checkIn?: {
    id: string;
    guestsCount: number;
  };
}

/**
 * Crear check-in (online)
 *
 * Registra el ingreso de invitados al evento.
 *
 * Validaciones:
 * - Usuario autenticado con permiso CHECKIN_SCAN
 * - Invitación existe y pertenece al evento del usuario
 * - guestsCount es válido
 *
 * Comportamiento con capacidad excedida:
 * - NO rechaza el check-in
 * - Crea el registro con exceededCapacity = true
 * - Incrementa checkInCount de todas formas (refleja realidad)
 */
export async function createCheckIn(
  input: z.infer<typeof createCheckInSchema>,
): Promise<CreateCheckInResult> {
  try {
    // 1. Autenticación
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "No autenticado" };
    }

    // 2. Validar input
    const validated = createCheckInSchema.parse(input);

    // 3. Obtener invitación con permisos
    const invitation = await prisma.invitation.findUnique({
      where: { id: validated.invitationId },
      include: {
        event: {
          select: {
            ownerId: true,
            members: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    });

    if (!invitation) {
      return { success: false, error: "Invitación no encontrada" };
    }

    // 4. Verificar permisos (owner tiene acceso automático)
    const isOwner = invitation.event.ownerId === session.user.id;

    if (!isOwner) {
      const member = invitation.event.members[0];
      if (
        !member ||
        !hasPermission(member.permissions, PERMISSIONS.CHECKIN_SCAN)
      ) {
        return {
          success: false,
          error: "No tienes permisos para registrar check-ins",
        };
      }
    }

    // 5. Calcular capacidad
    const currentTotal = invitation.checkInCount;
    const remaining = invitation.maxGuests - currentTotal;
    const willExceed = validated.guestsCount > remaining;
    const excess = willExceed ? validated.guestsCount - remaining : 0;

    // 6. Generar clientId si no viene (online)
    const clientId = validated.clientId || crypto.randomUUID();

    // 7. Crear check-in (SIEMPRE, incluso si excede capacidad)
    const checkIn = await prisma.$transaction(async (tx) => {
      const newCheckIn = await tx.checkIn.create({
        data: {
          invitationId: invitation.id,
          checkedInBy: session.user.id,
          guestsCount: validated.guestsCount,
          clientId,
          deviceId: validated.deviceId,
          syncedAt: new Date(), // Online = ya sincronizado
          exceededCapacity: willExceed,
          capacityNote: willExceed
            ? `Ingresaron ${currentTotal + validated.guestsCount}/${invitation.maxGuests} (exceso: ${excess})`
            : null,
        },
      });

      // Actualizar cache en invitación
      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          checkInCount: { increment: validated.guestsCount },
          lastCheckInAt: new Date(),
        },
      });

      return newCheckIn;
    });

    // 8. Revalidar rutas del backoffice
    revalidatePath("/backoffice/scanner");
    revalidatePath("/backoffice/invitations");

    // 9. Retornar resultado
    if (willExceed) {
      return {
        success: true,
        warning: `Se excedió la capacidad en ${excess} ${excess === 1 ? "persona" : "personas"}`,
        exceededCapacity: true,
        checkIn: {
          id: checkIn.id,
          guestsCount: checkIn.guestsCount,
        },
      };
    }

    return {
      success: true,
      checkIn: {
        id: checkIn.id,
        guestsCount: checkIn.guestsCount,
      },
    };
  } catch (error) {
    console.error("[createCheckIn] Error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Datos inválidos",
      };
    }

    return {
      success: false,
      error: "Error al registrar check-in",
    };
  }
}
