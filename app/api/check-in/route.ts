import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createCheckInSchema } from "@/app/actions/schemas";
import { emitCheckInEvent } from "@/app/api/events/[eventId]/stream/route";

/**
 * POST /api/check-in
 *
 * Route Handler para crear check-ins. Expuesto como REST endpoint
 * para que el Service Worker pueda interceptarlo cuando estamos offline
 * y hacer queue en IndexedDB.
 *
 * Online: pasa derecho al servidor → crea check-in en DB
 * Offline: el SW intercepta el fetch, responde con { queued: true }
 *          y guarda el payload para sincronizar después vía /api/check-in/sync
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const validated = createCheckInSchema.parse(body);

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

    const isOwner = invitation.event.ownerId === session.user.id;

    if (!isOwner) {
      const member = invitation.event.members[0];
      if (
        !member ||
        !hasPermission(member.permissions, PERMISSIONS.CHECKIN_SCAN)
      ) {
        return NextResponse.json(
          { success: false, error: "Sin permisos para registrar check-ins" },
          { status: 403 },
        );
      }
    }

    const currentTotal = invitation.checkInCount;
    const remaining = invitation.maxGuests - currentTotal;
    const willExceed = validated.guestsCount > remaining;
    const excess = willExceed ? validated.guestsCount - remaining : 0;

    const clientId = validated.clientId || crypto.randomUUID();

    const checkIn = await prisma.$transaction(async (tx) => {
      const newCheckIn = await tx.checkIn.create({
        data: {
          invitationId: invitation.id,
          checkedInBy: session.user.id,
          guestsCount: validated.guestsCount,
          clientId,
          deviceId: validated.deviceId,
          syncedAt: new Date(),
          exceededCapacity: willExceed,
          capacityNote: willExceed
            ? `Ingresaron ${currentTotal + validated.guestsCount}/${invitation.maxGuests} (exceso: ${excess})`
            : null,
        },
      });

      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          checkInCount: { increment: validated.guestsCount },
          lastCheckInAt: new Date(),
        },
      });

      return newCheckIn;
    });

    revalidatePath("/backoffice/scanner");
    revalidatePath("/backoffice/invitations");

    // Emit SSE event for real-time sync
    emitCheckInEvent(invitation.eventId);

    if (willExceed) {
      return NextResponse.json({
        success: true,
        warning: `Se excedió la capacidad en ${excess} ${excess === 1 ? "persona" : "personas"}`,
        exceededCapacity: true,
        checkIn: { id: checkIn.id, guestsCount: checkIn.guestsCount },
      });
    }

    return NextResponse.json({
      success: true,
      checkIn: { id: checkIn.id, guestsCount: checkIn.guestsCount },
    });
  } catch (error) {
    console.error("[POST /api/check-in] Error:", error);

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
      { success: false, error: "Error al registrar check-in" },
      { status: 500 },
    );
  }
}
