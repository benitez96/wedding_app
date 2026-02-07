/**
 * Sincronización de check-ins pendientes (offline → online)
 *
 * Estrategia:
 * - Obtener check-ins pendientes de IndexedDB
 * - Enviar cada uno al servidor vía API
 * - Marcar como sincronizado si es exitoso
 * - Manejar conflictos (capacidad excedida)
 */

import {
  getPendingCheckIns,
  markCheckInAsSynced,
  clearSyncedCheckIns,
} from "./indexedDB";

export interface SyncResult {
  total: number;
  synced: number;
  failed: number;
  conflicts: Array<{
    checkInId: string;
    invitationId: string;
    reason: string;
  }>;
}

/**
 * Sincronizar todos los check-ins pendientes
 */
export async function syncPendingCheckIns(): Promise<SyncResult> {
  const result: SyncResult = {
    total: 0,
    synced: 0,
    failed: 0,
    conflicts: [],
  };

  try {
    const pending = await getPendingCheckIns();
    result.total = pending.length;

    if (pending.length === 0) {
      console.log("[Sync] No pending check-ins");
      return result;
    }

    console.log(`[Sync] Syncing ${pending.length} check-ins...`);

    for (const checkIn of pending) {
      try {
        const response = await fetch("/api/check-in/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clientId: checkIn.clientId,
            invitationId: checkIn.invitationId,
            guestsCount: checkIn.guestsCount,
            checkedInBy: checkIn.checkedInBy,
            deviceId: checkIn.deviceId,
            timestamp: checkIn.timestamp,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        // Marcar como sincronizado
        await markCheckInAsSynced(checkIn.id);
        result.synced++;

        // Si hubo conflicto (capacidad excedida), registrarlo
        if (data.warning || data.exceededCapacity) {
          result.conflicts.push({
            checkInId: checkIn.id,
            invitationId: checkIn.invitationId,
            reason: data.warning || "Capacidad excedida",
          });
        }

        console.log(`[Sync] ✓ Check-in ${checkIn.id} synced`);
      } catch (error) {
        console.error(`[Sync] ✗ Failed to sync check-in ${checkIn.id}:`, error);
        result.failed++;
      }
    }

    // Limpiar check-ins sincronizados
    if (result.synced > 0) {
      await clearSyncedCheckIns();
    }

    console.log(`[Sync] Complete: ${result.synced}/${result.total} synced`);

    // Mostrar notificación si hay conflictos
    if (result.conflicts.length > 0 && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("⚠️ Conflictos en check-in", {
          body: `${result.conflicts.length} check-ins excedieron capacidad`,
          icon: "/favicon.ico",
        });
      }
    }

    return result;
  } catch (error) {
    console.error("[Sync] Fatal error:", error);
    throw error;
  }
}

/**
 * Forzar sincronización (llamado manualmente)
 */
export async function forceSyncCheckIns(): Promise<SyncResult> {
  if (!navigator.onLine) {
    throw new Error("Sin conexión a internet");
  }

  return syncPendingCheckIns();
}

/**
 * Verificar si hay check-ins pendientes
 */
export async function hasPendingCheckIns(): Promise<boolean> {
  const pending = await getPendingCheckIns();
  return pending.length > 0;
}
