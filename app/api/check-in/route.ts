import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createCheckInSchema } from "@/app/actions/schemas";
import { emitCheckInEvent } from "@/app/api/events/[eventId]/stream/route";
import { checkInvitationPermission } from "@/lib/middleware/auth-middleware";

/**
 * POST /api/check-in
 *
 * Create check-in (online mode - direct to server)
 *
 * Flow:
 * - Online: Creates check-in immediately in database
 * - Offline: Service Worker intercepts and queues in IndexedDB
 *            (synced later via /api/check-in/sync)
 *
 * Note: Never rejects check-ins, even if capacity exceeded
 * (reflects reality - people already entered the venue)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate body
    const body = await request.json();
    const validated = createCheckInSchema.parse(body);

    // 2. Check authentication + permissions (centralized)
    const authCheck = await checkInvitationPermission(
      request,
      validated.invitationId,
    );
    if (!authCheck.authorized) return authCheck.response;

    const { session, invitation } = authCheck;

    // 3. Calculate capacity
    const currentTotal = invitation.checkInCount;
    const remaining = invitation.maxGuests - currentTotal;
    const willExceed = validated.guestsCount > remaining;
    const excess = willExceed ? validated.guestsCount - remaining : 0;

    // 4. Generate clientId if not provided (for idempotency)
    const clientId = validated.clientId || crypto.randomUUID();

    // 5. Create check-in in transaction
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

    // 6. Revalidate paths
    revalidatePath("/backoffice/scanner");
    revalidatePath("/backoffice/invitations");

    // 7. Emit SSE event to notify other devices
    emitCheckInEvent(invitation.event.id);

    // 8. Return result
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
