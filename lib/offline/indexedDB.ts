/**
 * IndexedDB helpers para offline-first check-in
 *
 * Stores:
 * 1. invitations-cache: Cache local de invitaciones del evento
 * 2. check-in-queue: Check-ins pendientes de sincronización
 */

import { openDB, DBSchema, IDBPDatabase } from "idb";

// ============================================
// TYPES
// ============================================

export interface InvitationCache {
  id: string;
  tokenId: string;
  guestName: string;
  guestNickname: string | null;
  maxGuests: number;
  checkInCount: number;
  lastSyncedAt: number;
}

export interface CheckInQueueItem {
  id: string;
  clientId: string;
  invitationId: string;
  tokenId: string;
  guestsCount: number;
  checkedInBy: string;
  deviceId: string;
  timestamp: number;
  synced: boolean;
}

interface WeddingDB extends DBSchema {
  "invitations-cache": {
    key: string;
    value: InvitationCache;
    indexes: { "by-token": string };
  };
  "check-in-queue": {
    key: string;
    value: CheckInQueueItem;
    indexes: {
      "by-synced": IDBValidKey;
      "by-invitation": string;
    };
  };
}

// ============================================
// DATABASE INSTANCE
// ============================================

let db: IDBPDatabase<WeddingDB> | null = null;

async function getDB(): Promise<IDBPDatabase<WeddingDB>> {
  if (db) return db;

  db = await openDB<WeddingDB>("wedding-backoffice", 1, {
    upgrade(database) {
      // Store 1: Cache de invitaciones
      if (!database.objectStoreNames.contains("invitations-cache")) {
        const invitationsStore = database.createObjectStore(
          "invitations-cache",
          {
            keyPath: "id",
          },
        );
        invitationsStore.createIndex("by-token", "tokenId", { unique: true });
      }

      // Store 2: Queue de check-ins
      if (!database.objectStoreNames.contains("check-in-queue")) {
        const queueStore = database.createObjectStore("check-in-queue", {
          keyPath: "id",
        });
        queueStore.createIndex("by-synced", "synced");
        queueStore.createIndex("by-invitation", "invitationId");
      }
    },
  });

  return db;
}

// ============================================
// INVITATIONS CACHE
// ============================================

/**
 * Guardar invitaciones en cache local
 */
export async function cacheInvitations(
  invitations: InvitationCache[],
): Promise<void> {
  const database = await getDB();
  const tx = database.transaction("invitations-cache", "readwrite");

  await Promise.all([
    ...invitations.map((invitation) => tx.store.put(invitation)),
    tx.done,
  ]);
}

/**
 * Obtener invitación por tokenId (para validar QR offline)
 */
export async function getInvitationByToken(
  tokenId: string,
): Promise<InvitationCache | undefined> {
  const database = await getDB();
  return database.getFromIndex("invitations-cache", "by-token", tokenId);
}

/**
 * Obtener invitación por ID
 */
export async function getInvitationById(
  id: string,
): Promise<InvitationCache | undefined> {
  const database = await getDB();
  return database.get("invitations-cache", id);
}

/**
 * Obtener todas las invitaciones cacheadas
 */
export async function getAllCachedInvitations(): Promise<InvitationCache[]> {
  const database = await getDB();
  return database.getAll("invitations-cache");
}

/**
 * Actualizar checkInCount de una invitación en cache
 * (Usado después de check-in local exitoso)
 */
export async function updateCachedInvitationCheckInCount(
  invitationId: string,
  increment: number,
): Promise<void> {
  const database = await getDB();
  const invitation = await database.get("invitations-cache", invitationId);

  if (invitation) {
    invitation.checkInCount += increment;
    await database.put("invitations-cache", invitation);
  }
}

/**
 * Limpiar cache de invitaciones
 */
export async function clearInvitationsCache(): Promise<void> {
  const database = await getDB();
  await database.clear("invitations-cache");
}

// ============================================
// CHECK-IN QUEUE
// ============================================

/**
 * Guardar check-in en queue (offline)
 */
export async function saveCheckInToQueue(
  data: Omit<CheckInQueueItem, "id" | "synced" | "deviceId" | "clientId">,
): Promise<CheckInQueueItem> {
  const database = await getDB();

  const item: CheckInQueueItem = {
    ...data,
    id: crypto.randomUUID(),
    clientId: crypto.randomUUID(), // Para deduplicación en servidor
    deviceId: await getDeviceId(),
    synced: false,
  };

  await database.add("check-in-queue", item);

  // Actualizar cache local de invitación
  await updateCachedInvitationCheckInCount(data.invitationId, data.guestsCount);

  return item;
}

/**
 * Obtener check-ins pendientes de sincronización
 */
export async function getPendingCheckIns(): Promise<CheckInQueueItem[]> {
  const database = await getDB();
  const all = await database.getAll("check-in-queue");
  return all.filter((item) => !item.synced);
}

/**
 * Obtener check-ins locales por invitación (para validación offline)
 */
export async function getLocalCheckInsByInvitation(
  invitationId: string,
): Promise<CheckInQueueItem[]> {
  const database = await getDB();
  return database.getAllFromIndex(
    "check-in-queue",
    "by-invitation",
    invitationId,
  );
}

/**
 * Marcar check-in como sincronizado
 */
export async function markCheckInAsSynced(id: string): Promise<void> {
  const database = await getDB();
  const item = await database.get("check-in-queue", id);

  if (item) {
    item.synced = true;
    await database.put("check-in-queue", item);
  }
}

/**
 * Limpiar check-ins sincronizados
 */
export async function clearSyncedCheckIns(): Promise<void> {
  const database = await getDB();
  const all = await database.getAll("check-in-queue");
  const synced = all.filter((item) => item.synced);

  const tx = database.transaction("check-in-queue", "readwrite");
  await Promise.all([
    ...synced.map((item) => tx.store.delete(item.id)),
    tx.done,
  ]);
}

// ============================================
// HELPERS
// ============================================

/**
 * Obtener o generar device ID único
 */
async function getDeviceId(): Promise<string> {
  const stored = localStorage.getItem("device-id");
  if (stored) return stored;

  const newId = crypto.randomUUID();
  localStorage.setItem("device-id", newId);
  return newId;
}

/**
 * Limpiar toda la base de datos
 */
export async function clearAllData(): Promise<void> {
  const database = await getDB();
  await Promise.all([
    database.clear("invitations-cache"),
    database.clear("check-in-queue"),
  ]);
}
