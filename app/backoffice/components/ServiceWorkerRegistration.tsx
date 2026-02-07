"use client";

import { useEffect } from "react";
import { saveCheckInToQueue } from "@/lib/offline/indexedDB";

/**
 * Registra el Service Worker y maneja mensajes offline
 *
 * Eventos del SW:
 * - QUEUE_CHECK_IN: Guardar check-in en IndexedDB (offline)
 * - SYNC_CHECK_INS: Sincronizar check-ins pendientes
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      console.log("[SW] Service Worker not supported");
      return;
    }

    // Registrar Service Worker
    navigator.serviceWorker
      .register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      })
      .then((registration) => {
        console.log("[SW] Registered successfully:", registration.scope);

        // Verificar actualizaciones cada 60 segundos
        setInterval(() => {
          registration.update();
        }, 60000);
      })
      .catch((error) => {
        console.error("[SW] Registration failed:", error);
      });

    // Escuchar mensajes del Service Worker
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
 * Handler de mensajes del Service Worker
 */
async function handleServiceWorkerMessage(event: MessageEvent) {
  const { type, data } = event.data;

  console.log("[SW Client] Message received:", type, data);

  // Guardar check-in en IndexedDB (offline)
  if (type === "QUEUE_CHECK_IN") {
    try {
      await saveCheckInToQueue({
        invitationId: data.body.invitationId,
        tokenId: data.body.tokenId,
        guestsCount: data.body.guestsCount,
        checkedInBy: data.body.checkedInBy,
        timestamp: data.timestamp,
      });

      console.log("[SW Client] Check-in queued in IndexedDB");

      // Mostrar notificación al usuario
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Check-in guardado", {
          body: "Se sincronizará cuando haya conexión",
          icon: "/favicon.ico",
        });
      }
    } catch (error) {
      console.error("[SW Client] Error queueing check-in:", error);
    }
  }

  // Sincronizar check-ins pendientes
  if (type === "SYNC_CHECK_INS") {
    try {
      // Dynamic import para evitar cargar el módulo en el bundle principal
      const { syncPendingCheckIns } = await import("@/lib/offline/syncQueue");
      await syncPendingCheckIns();
    } catch (error) {
      console.error("[SW Client] Error syncing check-ins:", error);
    }
  }
}
