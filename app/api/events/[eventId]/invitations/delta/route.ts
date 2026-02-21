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
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

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
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Check permissions
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { ownerId: true },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 },
      );
    }

    const isOwner = event.ownerId === session.user.id;

    if (!isOwner) {
      const member = await prisma.eventMember.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId: session.user.id,
          },
        },
      });

      if (
        !member ||
        !hasPermission(member.permissions, PERMISSIONS.CHECKIN_SCAN)
      ) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 },
        );
      }
    }

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
