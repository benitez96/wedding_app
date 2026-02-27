"use client";

import { useEffect, useRef, useState } from "react";

interface UseSSEStreamOptions {
  /**
   * Event ID to listen for check-in events
   */
  eventId: string;

  /**
   * Callback invoked when a check-in event is received
   */
  onCheckInEvent: () => void;

  /**
   * Fallback polling interval in milliseconds (default: 10000ms = 10s)
   * Used when SSE connection fails or is not supported
   */
  pollingIntervalMs?: number;

  /**
   * Whether SSE is enabled (default: true)
   * When false, falls back to polling immediately
   */
  enabled?: boolean;
}

interface UseSSEStreamReturn {
  /**
   * Current connection status
   */
  status: "connecting" | "connected" | "disconnected" | "polling";

  /**
   * Last error if connection failed
   */
  error: string | null;

  /**
   * Manually reconnect (useful for retry buttons)
   */
  reconnect: () => void;
}

const MAX_RECONNECT_DELAY = 30000; // 30 seconds
const INITIAL_RECONNECT_DELAY = 1000; // 1 second

/**
 * Hook for consuming SSE stream with auto-reconnect and polling fallback
 *
 * Features:
 * - Auto-reconnect with exponential backoff
 * - Graceful fallback to polling when SSE unavailable
 * - Automatic cleanup on unmount
 * - Manual reconnect capability
 *
 * @example
 * ```tsx
 * const { status, error, reconnect } = useSSEStream({
 *   eventId: "event123",
 *   onCheckInEvent: () => {
 *     // Fetch delta and update local state
 *     fetchDelta();
 *   },
 *   pollingIntervalMs: 10000,
 * });
 * ```
 */
export function useSSEStream({
  eventId,
  onCheckInEvent,
  pollingIntervalMs = 10000,
  enabled = true,
}: UseSSEStreamOptions): UseSSEStreamReturn {
  const [status, setStatus] =
    useState<UseSSEStreamReturn["status"]>("connecting");
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);
  const mountedRef = useRef(true);

  const cleanup = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  const startPolling = () => {
    cleanup();
    setStatus("polling");
    setError("SSE unavailable, using polling");

    pollingIntervalRef.current = setInterval(() => {
      if (mountedRef.current) {
        onCheckInEvent();
      }
    }, pollingIntervalMs);
  };

  const scheduleReconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        connect();
      }
    }, reconnectDelayRef.current);

    // Exponential backoff
    reconnectDelayRef.current = Math.min(
      reconnectDelayRef.current * 2,
      MAX_RECONNECT_DELAY,
    );
  };

  const connect = () => {
    if (!enabled) {
      startPolling();
      return;
    }

    cleanup();
    setStatus("connecting");
    setError(null);

    try {
      const eventSource = new EventSource(`/api/events/${eventId}/stream`);

      eventSource.onopen = () => {
        if (mountedRef.current) {
          setStatus("connected");
          setError(null);
          reconnectDelayRef.current = INITIAL_RECONNECT_DELAY; // Reset backoff
        }
      };

      eventSource.addEventListener("check-in", () => {
        if (mountedRef.current) {
          onCheckInEvent();
        }
      });

      eventSource.addEventListener("heartbeat", () => {
        // Keep-alive, no action needed
      });

      eventSource.onerror = () => {
        if (eventSource.readyState === EventSource.CLOSED) {
          // Connection permanently closed
          if (mountedRef.current) {
            setStatus("disconnected");
            setError("Connection lost");
            // Try to reconnect after delay
            scheduleReconnect();
          }
        } else if (eventSource.readyState === EventSource.CONNECTING) {
          // Browser is attempting to reconnect
          if (mountedRef.current) {
            setStatus("connecting");
          }
        }
      };

      eventSourceRef.current = eventSource;
    } catch (err) {
      console.error(`[SSE] Failed to create EventSource:`, err);
      // Fallback to polling if SSE not supported
      startPolling();
    }
  };

  const reconnect = () => {
    reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
    connect();
  };

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      cleanup();
    };
     
  }, [eventId, enabled]);

  return {
    status,
    error,
    reconnect,
  };
}
