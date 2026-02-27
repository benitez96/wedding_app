/**
 * Check-in event emitter for SSE notifications
 *
 * This module provides a simple in-memory event system for notifying
 * SSE clients about check-in events.
 *
 * Production: Replace with Redis pub/sub for multi-instance deployments
 */

// Global event emitter for check-in notifications (in-memory, simplified)
declare global {
  var checkInEventListeners:
    | Map<string, (data: { eventId: string; timestamp: string }) => void>
    | undefined;
}

/**
 * Register a listener for check-in events
 * @returns Cleanup function to unregister the listener
 */
export function registerCheckInListener(
  eventId: string,
  callback: (data: { eventId: string; timestamp: string }) => void,
): () => void {
  global.checkInEventListeners = global.checkInEventListeners || new Map();
  global.checkInEventListeners.set(eventId, callback);

  return () => {
    global.checkInEventListeners?.delete(eventId);
  };
}

/**
 * Emit check-in event to all connected SSE clients for this event
 * Called from check-in routes after successful check-in creation
 */
export function emitCheckInEvent(eventId: string): void {
  const listeners = global.checkInEventListeners as
    | Map<string, (data: { eventId: string; timestamp: string }) => void>
    | undefined;

  const listener = listeners?.get(eventId);
  if (listener) {
    listener({ eventId, timestamp: new Date().toISOString() });
  }
}
