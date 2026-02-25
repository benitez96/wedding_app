/**
 * GET /api/events/[eventId]/stream
 *
 * Server-Sent Events (SSE) endpoint for real-time check-in notifications.
 *
 * Sends generic "checkin" event when ANY check-in happens in this event.
 * Clients then call /delta to fetch updated data.
 *
 * Event format:
 * data: {"type":"checkin","timestamp":"2026-02-21T12:34:56.789Z"}
 *
 * Security: Requires auth + CHECKIN_SCAN permission
 * Connection: Kept alive with heartbeat every 30s
 */

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

const HEARTBEAT_INTERVAL_MS = 30_000;

// Global event emitter for check-in notifications (in-memory, simplified)
// Production: Use Redis pub/sub or similar for multi-instance deployments
declare global {
  // eslint-disable-next-line no-var
  var checkInEventListeners:
    | Map<string, (data: { eventId: string; timestamp: string }) => void>
    | undefined;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params;

  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Check permissions
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { ownerId: true },
    });

    if (!event) {
      return new Response("Not Found", { status: 404 });
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
        return new Response("Forbidden", { status: 403 });
      }
    }

    // Setup SSE stream
    const encoder = new TextEncoder();
    let heartbeatId: ReturnType<typeof setInterval> | null = null;

    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        const connectedMsg = `data: ${JSON.stringify({ type: "connected", eventId, timestamp: new Date().toISOString() })}\n\n`;
        controller.enqueue(encoder.encode(connectedMsg));

        // Heartbeat to keep connection alive
        heartbeatId = setInterval(() => {
          const heartbeat = `: heartbeat ${Date.now()}\n\n`;
          try {
            controller.enqueue(encoder.encode(heartbeat));
          } catch {
            // Client disconnected
            if (heartbeatId) clearInterval(heartbeatId);
          }
        }, HEARTBEAT_INTERVAL_MS);

        // Listen for check-in events via global event emitter
        // (this is a simplified version - production would use Redis pub/sub or similar)
        const handleCheckIn = (data: {
          eventId: string;
          timestamp: string;
        }) => {
          if (data.eventId === eventId) {
            // SSE format with event type
            const msg = `event: check-in\ndata: ${JSON.stringify({ timestamp: data.timestamp })}\n\n`;
            try {
              controller.enqueue(encoder.encode(msg));
            } catch {
              // Client disconnected - cleanup handled in cancel()
            }
          }
        };

        // Register listener (global in-memory, simplified)
        global.checkInEventListeners =
          global.checkInEventListeners || new Map();
        global.checkInEventListeners.set(eventId, handleCheckIn);
      },

      cancel() {
        // Cleanup on disconnect
        if (heartbeatId) clearInterval(heartbeatId);
        global.checkInEventListeners?.delete(eventId);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[SSE] Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

/**
 * Emit check-in event to all connected SSE clients for this event
 * Called from check-in routes after successful check-in creation
 */
export function emitCheckInEvent(eventId: string) {
  const listeners = global.checkInEventListeners as
    | Map<string, (data: { eventId: string; timestamp: string }) => void>
    | undefined;

  const listener = listeners?.get(eventId);
  if (listener) {
    listener({ eventId, timestamp: new Date().toISOString() });
  }
}
