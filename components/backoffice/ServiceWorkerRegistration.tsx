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
          // Listen for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // Optionally show user a notification to reload
                }
              });
            }
          });
        })
        .catch(() => {
          // Silent error - SW is optional enhancement
        });

      // Listen for messages from SW
      navigator.serviceWorker.addEventListener("message", (event) => {
        // Handle different message types
        if (event.data.type === "QUEUE_CHECK_IN") {
          // Check-in queued - handled by main ServiceWorkerRegistration
        }
      });
    }
  }, []);

  return null; // This component doesn't render anything
}
