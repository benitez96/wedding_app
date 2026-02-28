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
import { checkEventPermission } from "@/lib/middleware/auth-middleware";
import { logError } from "@/lib/logger";
import { registerCheckInListener } from "@/lib/check-in-events";

const HEARTBEAT_INTERVAL_MS = 30_000;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params;

  try {
    // Check authentication + permissions (centralized)
    const authCheck = await checkEventPermission(request, eventId);
    if (!authCheck.authorized) return authCheck.response;

    // Setup SSE stream
    const encoder = new TextEncoder();
    let heartbeatId: ReturnType<typeof setInterval> | null = null;
    let unregisterListener: (() => void) | null = null;

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

        // Listen for check-in events
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

        // Register listener using the centralized event system
        unregisterListener = registerCheckInListener(eventId, handleCheckIn);
      },

      cancel() {
        // Cleanup on disconnect
        if (heartbeatId) clearInterval(heartbeatId);
        if (unregisterListener) unregisterListener();
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
    logError("GET /api/events/[eventId]/stream", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
