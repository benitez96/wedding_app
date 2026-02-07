import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { z } from "zod";

const syncCheckInSchema = z.object({
  clientId: z.string().uuid(),
  invitationId: z.string().cuid(),
  guestsCount: z.number().int().min(1).max(20),
  checkedInBy: z.string().cuid(),
  deviceId: z.string().optional(),
  timestamp: z.number(),
});

/**
 * POST /api/check-in/sync
 *
 * Endpoint para sincronizar check-ins creados offline.
 *
 * Estrategia:
 * 1. Verificar duplicado por clientId (deduplicación)
 * 2. Validar capacidad actual
 * 3. Si hay capacidad → check-in normal
 * 4. Si NO hay capacidad → check-in con exceededCapacity = true
 * 5. NUNCA rechazar, siempre aceptar (reflejar realidad)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Autenticación
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 },
      );
    }

    // 2. Parsear body
    const body = await request.json();
    const validated = syncCheckInSchema.parse(body);

    // 3. Verificar duplicado por clientId (deduplicación)
    const existing = await prisma.checkIn.findUnique({
      where: { clientId: validated.clientId },
    });

    if (existing) {
      console.log(`[Sync] Duplicado detectado: ${validated.clientId}`);
      return NextResponse.json({
        success: true,
        duplicate: true,
        message: "Check-in ya fue sincronizado",
      });
    }

    // 4. Obtener invitación actual
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
      return NextResponse.json(
        { success: false, error: "Invitación no encontrada" },
        { status: 404 },
      );
    }

    // 5. Verificar permisos (owner tiene acceso automático)
    const isOwner = invitation.event.ownerId === session.user.id;

    if (!isOwner) {
      const member = invitation.event.members[0];
      if (
        !member ||
        !hasPermission(member.permissions, PERMISSIONS.CHECKIN_SCAN)
      ) {
        return NextResponse.json(
          { success: false, error: "Sin permisos para sincronizar check-ins" },
          { status: 403 },
        );
      }
    }

    // 6. Calcular capacidad ACTUAL (puede haber cambiado desde que se creó offline)
    const currentTotal = invitation.checkInCount;
    const remaining = invitation.maxGuests - currentTotal;
    const willExceed = validated.guestsCount > remaining;
    const excess = willExceed ? validated.guestsCount - remaining : 0;

    // 7. Crear check-in (SIEMPRE, incluso si excede)
    const checkIn = await prisma.$transaction(async (tx) => {
      const newCheckIn = await tx.checkIn.create({
        data: {
          invitationId: invitation.id,
          checkedInBy: validated.checkedInBy,
          guestsCount: validated.guestsCount,
          clientId: validated.clientId,
          deviceId: validated.deviceId,
          createdAt: new Date(validated.timestamp), // Usar timestamp original
          syncedAt: new Date(), // Ahora fue sincronizado
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

    console.log(`[Sync] ✓ Check-in sincronizado: ${checkIn.id}`);

    // 8. Retornar resultado
    if (willExceed) {
      return NextResponse.json({
        success: true,
        warning: `Se excedió la capacidad en ${excess} ${excess === 1 ? "persona" : "personas"}`,
        exceededCapacity: true,
        checkIn: {
          id: checkIn.id,
          guestsCount: checkIn.guestsCount,
        },
      });
    }

    return NextResponse.json({
      success: true,
      checkIn: {
        id: checkIn.id,
        guestsCount: checkIn.guestsCount,
      },
    });
  } catch (error) {
    console.error("[Sync] Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: error.issues[0]?.message || "Datos inválidos",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Error al sincronizar check-in" },
      { status: 500 },
    );
  }
}
