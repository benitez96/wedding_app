"use client";

import { useEffect } from "react";

/**
 * Service Worker Registration
 *
 * Registers the service worker for offline functionality:
 * - Caches critical assets (QR scanner vendor files, etc.)
 * - Handles offline check-in queue
 * - Network-first strategy for HTML/assets
 * - Cache-first strategy for vendor files
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          // TODO: delete test comment
          console.log(
            `[🔧 Service Worker] Registered successfully | Scope: ${registration.scope}`,
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
                  // Optionally show user a notification to reload
                }
              });
            }
          });
        })
        .catch((error) => {
          // TODO: delete test comment
          console.error("[❌ Service Worker] Registration failed:", error);
        });

      // Listen for messages from SW
      navigator.serviceWorker.addEventListener("message", (event) => {
        // TODO: delete test comment
        console.log("[📬 Service Worker] Message received:", event.data);

        // Handle different message types
        if (event.data.type === "QUEUE_CHECK_IN") {
          console.log(
            "[📴 Service Worker] Check-in queued offline:",
            event.data.data,
          );
        }
      });
    }
  }, []);

  return null; // This component doesn't render anything
}
