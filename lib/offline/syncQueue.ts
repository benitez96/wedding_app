/**
 * Sync pending check-ins from IndexedDB queue to server
 *
 * Strategy:
 * - Upload each pending check-in to server via /api/check-in/sync
 * - Mark as synced if successful
 * - Track conflicts (capacity exceeded)
 * - Global lock prevents concurrent sync operations
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
 * Sync all pending check-ins (with lock to prevent race conditions)
 */
export async function syncPendingCheckIns(): Promise<SyncResult> {
  // If sync already in progress, return early (prevent duplicate uploads)
  if (syncInProgress) {
    return {
      total: 0,
      synced: 0,
      failed: 0,
      conflicts: [],
    };
  }

  // Acquire lock
  syncInProgress = true;

  try {
    return await performSync();
  } finally {
    // Release lock
    syncInProgress = false;
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
      return result;
    }

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

        // Mark as synced
        await markCheckInAsSynced(checkIn.id);
        result.synced++;

        // Track conflicts (capacity exceeded)
        if (data.warning || data.exceededCapacity) {
          result.conflicts.push({
            checkInId: checkIn.id,
            invitationId: checkIn.invitationId,
            reason: data.warning || "Capacidad excedida",
          });
        }
      } catch (error) {
        console.error(`[Sync] Failed to sync check-in ${checkIn.id}:`, error);
        result.failed++;
      }
    }

    // Clean up synced check-ins from IDB queue
    if (result.synced > 0) {
      await clearSyncedCheckIns();
    }

    // Show notification if conflicts occurred
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
 * Force sync (called manually by user)
 */
export async function forceSyncCheckIns(): Promise<SyncResult> {
  if (!navigator.onLine) {
    throw new Error("Sin conexión a internet");
  }

  return syncPendingCheckIns();
}

/**
 * Check if there are pending check-ins in the queue
 */
export async function hasPendingCheckIns(): Promise<boolean> {
  const pending = await getPendingCheckIns();
  return pending.length > 0;
}
