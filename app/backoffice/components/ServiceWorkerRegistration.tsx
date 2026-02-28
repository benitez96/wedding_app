"use client";

import { useEffect } from "react";
import { saveCheckInToQueue } from "@/lib/offline/indexedDB";

/**
 * Service Worker Registration
 *
 * Registers SW and handles offline messages:
 * - Caches critical assets (QR scanner vendor files, scanner page)
 * - Intercepts /api/check-in POST for offline queue
 * - Network-first for HTML/assets, cache-first for vendor files
 *
 * SW Events:
 * - QUEUE_CHECK_IN: Save check-in to IndexedDB (offline)
 * - SYNC_CHECK_INS: Sync pending check-ins when online
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        // Listen for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // New version available
              }
            });
          }
        });
      })
      .catch(() => {
        // Silent error - SW is optional enhancement
      });

    navigator.serviceWorker.addEventListener(
      "message",
      handleServiceWorkerMessage,
    );

    return () => {
      navigator.serviceWorker.removeEventListener(
        "message",
        handleServiceWorkerMessage,
      );
    };
  }, []);

  return null;
}

/**
 * Handle messages from Service Worker
 */
async function handleServiceWorkerMessage(event: MessageEvent) {
  const { type, data } = event.data ?? {};

  if (type === "QUEUE_CHECK_IN") {
    try {
      await saveCheckInToQueue({
        invitationId: data.body.invitationId,
        tokenId: data.body.tokenId,
        guestsCount: data.body.guestsCount,
        timestamp: data.timestamp,
      });

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Check-in guardado", {
          body: "Se sincronizará cuando haya conexión",
          icon: "/favicon.ico",
        });
      }
    } catch {
      // Silent error - best effort
    }
  }

  if (type === "SYNC_CHECK_INS") {
    try {
      const { syncPendingCheckIns } = await import("@/lib/offline/syncQueue");
      await syncPendingCheckIns();
    } catch {
      // Silent error - will retry later
    }
  }
}
