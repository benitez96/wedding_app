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
 * Sync offline check-ins to server (idempotent by clientId)
 *
 * Flow:
 * 1. Check if clientId already exists (early return if duplicate)
 * 2. Validate permissions and invitation
 * 3. Create check-in in transaction
 * 4. Emit SSE event for real-time sync
 *
 * Note: Never rejects check-ins, even if capacity exceeded
 * (reflects reality - people already entered the venue)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 },
      );
    }

    // 2. Parse and validate body
    const body = await request.json();
    const validated = syncCheckInSchema.parse(body);

    // 3. Check for duplicate FIRST (idempotency - fast path)
    const existingCheckIn = await prisma.checkIn.findUnique({
      where: { clientId: validated.clientId },
    });

    if (existingCheckIn) {
      // Already synced, return success (idempotent)
      return NextResponse.json({
        success: true,
        duplicate: true,
        message: "Check-in ya fue sincronizado",
      });
    }

    // 4. Fetch invitation with event data (for permission check)
    const invitation = await prisma.invitation.findUnique({
      where: { id: validated.invitationId },
      include: {
        event: {
          select: {
            id: true,
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

    // 5. Verify permissions (owner has automatic access)
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

    // 6. Calculate capacity (may have changed since offline check-in)
    const currentTotal = invitation.checkInCount;
    const remaining = invitation.maxGuests - currentTotal;
    const willExceed = validated.guestsCount > remaining;
    const excess = willExceed ? validated.guestsCount - remaining : 0;

    // 7. Create check-in in transaction (no race condition possible here)
    const checkIn = await prisma.$transaction(async (tx) => {
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

    // 8. Emit SSE event to notify other devices
    emitCheckInEvent(invitation.event.id);

    // 9. Return result
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
