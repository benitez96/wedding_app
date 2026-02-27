import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { emitCheckInEvent } from "@/app/api/events/[eventId]/stream/route";
import { checkInvitationPermission } from "@/lib/middleware/auth-middleware";

// Security: Max clock skew tolerance (1 minute)
const MAX_CLOCK_SKEW_MS = 60 * 1000;
// Security: Max age for check-ins (24 hours)
const MAX_CHECKIN_AGE_MS = 24 * 60 * 60 * 1000;

const syncCheckInSchema = z.object({
  clientId: z.string().uuid(),
  invitationId: z.string().cuid(),
  guestsCount: z.number().int().min(1).max(20),
  deviceId: z.string().optional(),
  timestamp: z.number().refine(
    (ts) => {
      const now = Date.now();
      // Reject future timestamps (clock skew attack)
      if (ts > now + MAX_CLOCK_SKEW_MS) return false;
      // Reject very old timestamps (replay attack)
      if (ts < now - MAX_CHECKIN_AGE_MS) return false;
      return true;
    },
    {
      message:
        "Timestamp inválido: debe estar dentro de las últimas 24 horas y no en el futuro",
    },
  ),
});

/**
 * POST /api/check-in/sync
 *
 * Sync offline check-ins to server (idempotent by clientId)
 *
 * Flow:
 * 1. Validate body
 * 2. Check for duplicate FIRST (idempotency - fast path)
 * 3. Validate permissions and invitation
 * 4. Create check-in in transaction
 * 5. Emit SSE event for real-time sync
 *
 * Note: Never rejects check-ins, even if capacity exceeded
 * (reflects reality - people already entered the venue)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate body
    const body = await request.json();
    const validated = syncCheckInSchema.parse(body);

    // 2. Check for duplicate FIRST (idempotency - fast path)
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

    // 3. Check authentication + permissions (centralized)
    const authCheck = await checkInvitationPermission(
      request,
      validated.invitationId,
    );
    if (!authCheck.authorized) return authCheck.response;

    const { session, invitation } = authCheck;

    // 4. Calculate capacity (may have changed since offline check-in)
    const currentTotal = invitation.checkInCount;
    const remaining = invitation.maxGuests - currentTotal;
    const willExceed = validated.guestsCount > remaining;
    const excess = willExceed ? validated.guestsCount - remaining : 0;

    // 5. Create check-in in transaction (no race condition possible here)
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
