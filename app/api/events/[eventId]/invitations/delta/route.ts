/**
 * GET /api/events/[eventId]/invitations/delta
 *
 * Cursor-based delta sync endpoint.
 * Returns only invitations updated after the given cursor (ISO timestamp).
 *
 * Query params:
 * - cursor: ISO 8601 timestamp (e.g. "2026-02-21T12:34:56.789Z")
 *
 * Response:
 * {
 *   invitations: Array<{id, tokenId, checkInCount, updatedAt}>,
 *   cursor: string  // Latest updatedAt timestamp (use for next request)
 * }
 *
 * Security: Requires auth + CHECKIN_SCAN permission
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkEventPermission } from "@/lib/middleware/auth-middleware";

interface DeltaInvitation {
  id: string;
  tokenId: string;
  guestName: string;
  guestNickname: string | null;
  maxGuests: number;
  checkInCount: number;
  updatedAt: string; // ISO 8601
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  try {
    const { eventId } = await params;

    // Check authentication + permissions (centralized)
    const authCheck = await checkEventPermission(request, eventId);
    if (!authCheck.authorized) return authCheck.response;

    // Parse cursor (ISO timestamp)
    const cursorParam = request.nextUrl.searchParams.get("cursor");
    const cursor = cursorParam ? new Date(cursorParam) : new Date(0);

    // Query invitations updated after cursor
    // Uses composite index: @@index([eventId, updatedAt])
    const invitations = await prisma.invitation.findMany({
      where: {
        eventId,
        updatedAt: { gt: cursor },
      },
      include: {
        tokens: {
          where: {
            isActive: true,
            expiresAt: { gt: new Date() },
          },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { updatedAt: "asc" },
      take: 100, // Limit to 100 per request (paginated delta)
    });

    // Map to lightweight delta format
    const delta: DeltaInvitation[] = invitations
      .filter((inv) => inv.tokens.length > 0)
      .map((inv) => ({
        id: inv.id,
        tokenId: inv.tokens[0].id,
        guestName: inv.guestName,
        guestNickname: inv.guestNickname,
        maxGuests: inv.maxGuests,
        checkInCount: inv.checkInCount,
        updatedAt: inv.updatedAt.toISOString(),
      }));

    // New cursor = latest updatedAt (or keep old if no results)
    const newCursor =
      delta.length > 0
        ? delta[delta.length - 1].updatedAt
        : cursor.toISOString();

    return NextResponse.json({
      success: true,
      invitations: delta,
      cursor: newCursor,
      hasMore: delta.length === 100, // If we hit limit, there may be more
    });
  } catch (error) {
    console.error("[Delta] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
