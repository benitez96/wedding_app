# Check-in System Guide

The QR-based check-in system allows event staff to scan guest invitations and track attendance, even without an internet connection.

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CHECK-IN FLOW                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Staff opens QR Scanner                                  │
│     └── PWA with camera access                              │
│                                                             │
│  2. Scans guest's QR code                                   │
│     └── QR contains: tokenId                                │
│                                                             │
│  3. Strategy validates token                                │
│     ├── IDB_FIRST: Check IndexedDB cache                    │
│     ├── SERVER_FIRST: Call API directly                     │
│     └── HYBRID_SMART: Choose based on network               │
│                                                             │
│  4. Display guest info                                      │
│     └── Name, max guests, already checked in                │
│                                                             │
│  5. Confirm check-in                                        │
│     └── Record number of guests entering                    │
│                                                             │
│  6. Sync to server                                          │
│     └── Immediate (online) or queued (offline)              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Strategy Pattern

The check-in system uses a **Strategy Pattern** to handle different network conditions:

### IDB_FIRST (Default)

Best for: **Unreliable networks, venues with poor connectivity**

```
Scan QR
   │
   ▼
┌─────────────────┐
│ Check IndexedDB │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
 Found     Not Found
    │         │
    ▼         ▼
 Return    Try Server
 cached    (with timeout)
    │         │
    │    ┌────┴────┐
    │    ▼         ▼
    │ Success   Timeout
    │    │         │
    │    ▼         ▼
    │ Update    Return
    │ cache     error
    │    │
    └────┴─────────┐
                   ▼
            Create check-in
            (queue if offline)
```

### SERVER_FIRST

Best for: **Reliable networks, when real-time accuracy is critical**

```
Scan QR
   │
   ▼
┌─────────────────┐
│   Call Server   │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
 Success   Failed
    │         │
    ▼         ▼
 Return    Fallback
 server    to IDB
 data      (if available)
```

### HYBRID_SMART

Best for: **Variable conditions, automatic optimization**

```
Scan QR
   │
   ▼
┌─────────────────────┐
│  Measure network    │
│  latency            │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     ▼           ▼
  < 500ms     > 500ms
     │           │
     ▼           ▼
  SERVER      IDB_FIRST
  mode        mode
```

---

## Configuration

Check-in settings are stored per event in the `Configuration` table:

| Key                                 | Type    | Default   | Description                       |
| ----------------------------------- | ------- | --------- | --------------------------------- |
| `checkin.strategy`                  | string  | IDB_FIRST | Strategy to use                   |
| `checkin.serverTimeoutMs`           | number  | 1200      | Server request timeout (ms)       |
| `checkin.maxStalenessMs`            | number  | 60000     | Cache considered stale after (ms) |
| `checkin.parallelRaceEnabled`       | boolean | true      | Enable Promise.race in HYBRID     |
| `checkin.networkLatencyThresholdMs` | number  | 500       | Threshold for strategy decision   |

### Changing Strategy

```typescript
// app/actions/settings.ts
export const updateCheckInStrategy = withEventAuth(
  async (ctx, strategy: CheckInStrategyType) => {
    await prisma.configuration.upsert({
      where: {
        eventId_key: {
          eventId: ctx.event.eventId,
          key: "checkin.strategy",
        },
      },
      update: { value: strategy },
      create: {
        eventId: ctx.event.eventId,
        key: "checkin.strategy",
        value: strategy,
      },
    });
  },
  PERMISSIONS.SETTINGS_EDIT,
);
```

---

## IndexedDB Schema

The check-in PWA uses IndexedDB for offline support:

```typescript
// Database: invify-checkin-{eventId}

interface InvifyCheckInDB {
  // Cached invitations for validation
  invitations: {
    id: string; // Primary key
    tokenId: string; // Index for QR lookup
    guestName: string;
    guestNickname: string | null;
    maxGuests: number;
    checkInCount: number; // Optimistic local count
    lastSyncedAt: number; // Timestamp
  };

  // Pending check-ins to sync
  checkInQueue: {
    clientId: string; // Primary key (UUID)
    invitationId: string;
    guestsCount: number;
    timestamp: number;
    synced: boolean; // Index
  };

  // Sync metadata
  meta: {
    key: string; // Primary key
    value: any;
  };
}
```

### Cache Initialization

When the scanner opens, it syncs all invitations:

```typescript
async function initializeCache(eventId: string) {
  const response = await fetch(`/api/check-in/invitations?eventId=${eventId}`);
  const invitations = await response.json();

  const db = await openDB("invify-checkin-" + eventId);
  const tx = db.transaction("invitations", "readwrite");

  for (const inv of invitations) {
    await tx.store.put({
      id: inv.id,
      tokenId: inv.tokenId,
      guestName: inv.guestName,
      guestNickname: inv.guestNickname,
      maxGuests: inv.maxGuests,
      checkInCount: inv.checkInCount,
      lastSyncedAt: Date.now(),
    });
  }

  await tx.done;
}
```

---

## Check-in Flow Implementation

### 1. QR Scanning

```typescript
// components/QRScanner.tsx
"use client";

import { useZxing } from "react-zxing";

export function QRScanner({ onScan }) {
  const { ref } = useZxing({
    onDecodeResult(result) {
      const tokenId = result.getText();
      onScan(tokenId);
    },
  });

  return <video ref={ref} />;
}
```

### 2. Token Validation

```typescript
// Using the strategy pattern
const strategy = CheckInStrategyFactory.create(config);
const result = await strategy.validateQR(tokenId, eventId);

if (result.success) {
  // Show guest info
  showGuestModal(result.invitation);
} else {
  // Show error
  showError(result.error);
}
```

### 3. Creating Check-in

```typescript
const checkInResult = await strategy.createCheckIn({
  invitationId: invitation.id,
  tokenId,
  guestsCount: selectedCount,
});

if (checkInResult.queued) {
  // Offline - show pending indicator
  showToast("Check-in queued for sync");
} else if (checkInResult.success) {
  // Online - confirmed
  showToast("Check-in confirmed!");
}

if (checkInResult.exceededCapacity) {
  // Warning but not blocking
  showWarning(`Exceeded capacity: ${checkInResult.warning}`);
}
```

---

## Background Sync

### Service Worker Registration

```typescript
// app/backoffice/check-in/page.tsx
useEffect(() => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw-checkin.js");
  }
}, []);
```

### Sync Logic

```typescript
// public/sw-checkin.js
self.addEventListener("sync", async (event) => {
  if (event.tag === "check-in-sync") {
    event.waitUntil(syncPendingCheckIns());
  }
});

async function syncPendingCheckIns() {
  const db = await openDB("invify-checkin-*");
  const pending = await db.getAllFromIndex("checkInQueue", "synced", false);

  for (const checkIn of pending) {
    try {
      await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitationId: checkIn.invitationId,
          guestsCount: checkIn.guestsCount,
          clientId: checkIn.clientId, // For deduplication
        }),
      });

      // Mark as synced
      await db.put("checkInQueue", { ...checkIn, synced: true });
    } catch (error) {
      // Will retry on next sync
      console.error("Sync failed:", error);
    }
  }
}
```

---

## Server-Side Deduplication

The server uses `clientId` to prevent duplicate check-ins:

```typescript
// app/api/check-in/route.ts
export async function POST(request: Request) {
  const { invitationId, guestsCount, clientId } = await request.json();

  // Check for existing check-in with same clientId
  const existing = await prisma.checkIn.findUnique({
    where: { clientId },
  });

  if (existing) {
    // Already processed - return success without creating duplicate
    return Response.json({
      success: true,
      deduplicated: true,
      checkInId: existing.id,
    });
  }

  // Create new check-in
  const checkIn = await prisma.checkIn.create({
    data: {
      invitationId,
      guestsCount,
      clientId,
      checkedInBy: session.user.id,
      syncedAt: new Date(),
    },
  });

  // Update invitation counter
  await prisma.invitation.update({
    where: { id: invitationId },
    data: {
      checkInCount: { increment: guestsCount },
      lastCheckInAt: new Date(),
    },
  });

  return Response.json({ success: true, checkInId: checkIn.id });
}
```

---

## Capacity Handling

The system handles capacity excess gracefully:

```typescript
// When syncing offline check-ins
if (invitation.checkInCount + guestsCount > invitation.maxGuests) {
  // Still allow the check-in, but flag it
  await prisma.checkIn.create({
    data: {
      ...checkInData,
      exceededCapacity: true,
      capacityNote: `Checked in ${guestsCount}, exceeded by ${
        invitation.checkInCount + guestsCount - invitation.maxGuests
      }`,
    },
  });
}
```

This approach:

- Never blocks entry at the door (staff already let them in)
- Records the overflow for reporting
- Allows event owners to see discrepancies

---

## Network Monitor

```typescript
// lib/check-in/NetworkMonitor.ts
export class NetworkMonitor {
  private latencyHistory: number[] = [];

  async measureLatency(): Promise<number> {
    const start = performance.now();
    try {
      await fetch("/api/ping", { method: "HEAD" });
      const latency = performance.now() - start;
      this.latencyHistory.push(latency);
      return latency;
    } catch {
      return Infinity; // Offline
    }
  }

  getAverageLatency(): number {
    if (this.latencyHistory.length === 0) return Infinity;
    const sum = this.latencyHistory.slice(-5).reduce((a, b) => a + b, 0);
    return sum / Math.min(this.latencyHistory.length, 5);
  }

  isOnline(): boolean {
    return navigator.onLine && this.getAverageLatency() < Infinity;
  }
}
```

---

## Permissions Required

| Action            | Permission       |
| ----------------- | ---------------- |
| Open QR Scanner   | `CHECKIN_SCAN`   |
| View check-in log | `CHECKIN_VIEW`   |
| Delete check-in   | `CHECKIN_DELETE` |
| View guest list   | `GUESTS_VIEW`    |

The `CHECK_IN_STAFF` preset includes exactly these permissions.

---

## Testing Offline Mode

1. Open Chrome DevTools → Network → Check "Offline"
2. Scan a QR code - should use cached data
3. Confirm check-in - should show "queued" indicator
4. Uncheck "Offline"
5. Check that sync icon appears and check-in syncs

---

## Troubleshooting

### "Token not found" when offline

The invitation cache may not be initialized. Ensure:

1. Initial sync completed before going offline
2. The invitation was created before the last sync

### Duplicate check-ins

Check the `clientId` in the database. If duplicates exist with different `clientId`s, the client may be generating new IDs incorrectly.

### Check-ins not syncing

1. Verify service worker is registered
2. Check browser supports Background Sync
3. Look for errors in DevTools → Application → Service Workers
