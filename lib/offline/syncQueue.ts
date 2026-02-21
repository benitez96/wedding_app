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

// Global lock to prevent concurrent sync operations
let syncInProgress = false;

/**
 * Sync all pending check-ins (with lock to prevent concurrent syncs)
 */
export async function syncPendingCheckIns(): Promise<SyncResult> {
  // If sync already in progress, return early
  if (syncInProgress) {
    // TODO: delete test comment
    console.log(
      "[⏸️ Outbound Sync] Sync already in progress, skipping duplicate call",
    );
    return {
      total: 0,
      synced: 0,
      failed: 0,
      conflicts: [],
    };
  }

  // Acquire lock
  syncInProgress = true;
  // TODO: delete test comment
  console.log("[🔒 Outbound Sync] Lock acquired");

  try {
    return await performSync();
  } finally {
    // Release lock
    syncInProgress = false;
    // TODO: delete test comment
    console.log("[🔓 Outbound Sync] Lock released");
  }
}

/**
 * Internal sync implementation
 */
async function performSync(): Promise<SyncResult> {
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
      // TODO: delete test comment
      console.log("[📤 Outbound Sync] No pending check-ins in queue");
      return result;
    }

    // TODO: delete test comment
    console.log(
      `[📤 Outbound Sync] Found ${pending.length} pending check-ins, uploading to server...`,
    );

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
          // TODO: delete test comment
          console.warn(
            `[⚠️ Outbound Sync] Check-in ${checkIn.id} synced with conflict: ${data.warning}`,
          );
        } else {
          // TODO: delete test comment
          console.log(
            `[✅ Outbound Sync] Check-in ${checkIn.id} synced successfully`,
          );
        }
      } catch (error) {
        // TODO: delete test comment
        console.error(
          `[❌ Outbound Sync] Failed to sync check-in ${checkIn.id}:`,
          error,
        );
        result.failed++;
      }
    }

    // Limpiar check-ins sincronizados
    if (result.synced > 0) {
      await clearSyncedCheckIns();
      // TODO: delete test comment
      console.log(
        `[🗑️ Outbound Sync] Cleaned ${result.synced} synced check-ins from IDB queue`,
      );
    }

    // TODO: delete test comment
    console.log(
      `[✅ Outbound Sync] Complete: ${result.synced}/${result.total} synced, ${result.failed} failed`,
    );

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
