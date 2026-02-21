import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { z } from "zod";
import { emitCheckInEvent } from "@/app/api/events/[eventId]/stream/route";

const syncCheckInSchema = z.object({
  clientId: z.string().uuid(),
  invitationId: z.string().cuid(),
  guestsCount: z.number().int().min(1).max(20),
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

    // TODO: delete test comment
    console.log(
      `[📤 Sync Endpoint] Received check-in | ClientID: ${validated.clientId} | Invitation: ${validated.invitationId}`,
    );

    // 3. Obtener invitación actual
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

    // 7. Use try-catch to handle duplicate clientId gracefully
    let checkIn;
    let isDuplicate = false;

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create new check-in (will throw if clientId already exists)
        const newCheckIn = await tx.checkIn.create({
          data: {
            invitationId: invitation.id,
            checkedInBy: session.user.id,
            guestsCount: validated.guestsCount,
            clientId: validated.clientId,
            deviceId: validated.deviceId,
            createdAt: new Date(validated.timestamp),
            syncedAt: new Date(),
            exceededCapacity: willExceed,
            capacityNote: willExceed
              ? `Ingresaron ${currentTotal + validated.guestsCount}/${invitation.maxGuests} (exceso: ${excess})`
              : null,
          },
        });

        // TODO: delete test comment
        console.log(
          `[✅ Sync Endpoint] Created check-in in DB | ID: ${newCheckIn.id} | ClientID: ${validated.clientId}`,
        );

        // Update invitation counters
        await tx.invitation.update({
          where: { id: invitation.id },
          data: {
            checkInCount: { increment: validated.guestsCount },
            lastCheckInAt: new Date(),
          },
        });

        return newCheckIn;
      });

      checkIn = result;
    } catch (error: any) {
      // If duplicate key error, fetch existing check-in
      if (error.code === "P2002" && error.meta?.target?.includes("clientId")) {
        // TODO: delete test comment
        console.log(
          `[⚠️ Sync Endpoint] Duplicate clientId detected via P2002: ${validated.clientId} | Fetching existing`,
        );

        checkIn = await prisma.checkIn.findUnique({
          where: { clientId: validated.clientId },
        });

        if (!checkIn) {
          throw new Error("Duplicate detected but check-in not found");
        }

        isDuplicate = true;
      } else {
        // Re-throw other errors
        throw error;
      }
    }

    // If duplicate, return early (no SSE event needed)
    if (isDuplicate) {
      // TODO: delete test comment
      console.log(
        `[✅ Sync Endpoint] Duplicate handled successfully | ClientID: ${validated.clientId}`,
      );
      return NextResponse.json({
        success: true,
        duplicate: true,
        message: "Check-in ya fue sincronizado",
      });
    }

    // Emit SSE event to notify other clients (only for NEW check-ins)
    emitCheckInEvent(invitation.eventId);

    // TODO: delete test comment
    console.log(
      `[✅ Sync Endpoint] Check-in synced successfully | ID: ${checkIn!.id}`,
    );

    // 8. Return result
    if (willExceed) {
      return NextResponse.json({
        success: true,
        warning: `Se excedió la capacidad en ${excess} ${excess === 1 ? "persona" : "personas"}`,
        exceededCapacity: true,
        checkIn: {
          id: checkIn!.id,
          guestsCount: checkIn!.guestsCount,
        },
      });
    }

    return NextResponse.json({
      success: true,
      checkIn: {
        id: checkIn!.id,
        guestsCount: checkIn!.guestsCount,
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
