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
      // TODO: delete test comment
      console.log("[⚠️ Service Worker] Not supported in this browser");
      return;
    }

    // TODO: delete test comment
    console.log("[🔧 Service Worker] Registering...");

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        // TODO: delete test comment
        console.log(
          `[✅ Service Worker] Registered successfully | Scope: ${registration.scope}`,
        );

        // Listen for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // TODO: delete test comment
                console.log(
                  "[🔄 Service Worker] New version available, reload to update",
                );
              }
            });
          }
        });
      })
      .catch((error) => {
        // TODO: delete test comment
        console.error("[❌ Service Worker] Registration failed:", error);
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

  // TODO: delete test comment
  console.log(`[📬 Service Worker] Message received | Type: ${type}`, data);

  if (type === "QUEUE_CHECK_IN") {
    try {
      // TODO: delete test comment
      console.log(
        `[📴 Service Worker] Queueing offline check-in via SW message`,
      );

      await saveCheckInToQueue({
        invitationId: data.body.invitationId,
        tokenId: data.body.tokenId,
        guestsCount: data.body.guestsCount,
        timestamp: data.timestamp,
      });

      // TODO: delete test comment
      console.log(
        `[✅ Service Worker] Check-in queued successfully via SW message`,
      );

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Check-in guardado", {
          body: "Se sincronizará cuando haya conexión",
          icon: "/favicon.ico",
        });
      }
    } catch (error) {
      // TODO: delete test comment
      console.error("[❌ Service Worker] Error queueing check-in:", error);
    }
  }

  if (type === "SYNC_CHECK_INS") {
    try {
      // TODO: delete test comment
      console.log(`[🔄 Service Worker] Sync request received from SW`);

      const { syncPendingCheckIns } = await import("@/lib/offline/syncQueue");
      await syncPendingCheckIns();

      // TODO: delete test comment
      console.log(`[✅ Service Worker] Sync completed via SW trigger`);
    } catch (error) {
      // TODO: delete test comment
      console.error("[❌ Service Worker] Error syncing check-ins:", error);
    }
  }
}
