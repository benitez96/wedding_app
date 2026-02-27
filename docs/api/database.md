# Database Schema Reference

Invify uses PostgreSQL with Prisma ORM. The schema is defined in `prisma/schema.prisma`.

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       ENTITY RELATIONSHIPS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User ──────────────┬──────────────────────────────────────┐   │
│    │                │                                      │   │
│    │ owns           │ collaborates                         │   │
│    ▼                ▼                                      │   │
│  Event ◄────── EventMember                                 │   │
│    │                                                       │   │
│    ├──── SectionConfiguration                              │   │
│    ├──── Configuration                                     │   │
│    ├──── EventInviteLink                                   │   │
│    │                                                       │   │
│    └──── Invitation ──────── InvitationToken               │   │
│              │                                             │   │
│              └──── CheckIn ◄────────────────────── User    │   │
│                                                  (staff)   │   │
│                                                            │   │
│  User ──── Subscription (1:1)                              │   │
│    │                                                       │   │
│    └──── SubscriptionHistory                               │   │
│                                                            │   │
│  RateLimitAttempt ─┬─ RateLimitBlock                       │   │
│                    │                                       │   │
│  SecurityLog ──────┘                                       │   │
│                                                            │   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Models

### User

Better Auth managed user accounts.

```prisma
model User {
  id            String   @id @default(cuid())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Better Auth fields
  email         String   @unique
  emailVerified Boolean  @default(false)
  name          String
  image         String?

  // Relations
  ownedEvents       Event[]          @relation("EventOwner")
  eventMemberships  EventMember[]
  sessions          Session[]
  accounts          Account[]
  subscription      Subscription?
  checkIns          CheckIn[]        @relation("CheckInsByUser")
  deletedCheckIns   CheckIn[]        @relation("CheckInsDeletedByUser")

  @@map("users")
}
```

**Key Points:**

- `id` is a CUID, not UUID
- `ownedEvents` = events this user created
- `eventMemberships` = events this user collaborates on
- `subscription` is 1:1 relationship

---

### Event

The core multi-tenant entity. Each event is an independent invitation.

```prisma
model Event {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  name        String
  slug        String   @unique
  description String?

  // Theming
  activeTheme String   @default("classic")
  customTheme Json?    // CustomThemeColors when activeTheme = "custom"

  // Owner
  ownerId     String
  owner       User     @relation("EventOwner", ...)

  // Relations
  invitations    Invitation[]
  sections       SectionConfiguration[]
  members        EventMember[]
  inviteLinks    EventInviteLink[]
  configurations Configuration[]

  @@index([ownerId])
  @@index([slug])
  @@map("events")
}
```

**Key Points:**

- `slug` is used for admin URLs, not invitation access
- `customTheme` is only populated when `activeTheme = "custom"`
- Owner has implicit full permissions

---

### Invitation

A guest invitation within an event.

```prisma
model Invitation {
  id            String   @id @default(cuid())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  eventId       String
  event         Event    @relation(...)

  // Guest info
  guestName     String
  guestNickname String?
  guestPhone    String?
  maxGuests     Int      @default(1)

  // RSVP response
  hasResponded         Boolean   @default(false)
  isAttending          Boolean?
  guestCount           Int?
  respondedAt          DateTime?

  // Extended RSVP (optional)
  menuPreference       String?
  dietaryRestrictions  String?
  messageForCouple     String?

  // Check-in tracking
  checkInCount  Int       @default(0)
  lastCheckInAt DateTime?

  // Relations
  tokens   InvitationToken[]
  checkIns CheckIn[]

  @@index([eventId])
  @@index([eventId, hasResponded])
  @@index([eventId, isAttending])
  @@map("invitations")
}
```

**Key Points:**

- `maxGuests` = how many people this invitation allows
- `guestCount` = how many the guest said would attend
- `checkInCount` = how many have actually checked in
- Extended RSVP fields are optional, controlled by section settings

---

### InvitationToken

Unique access tokens for invitation URLs.

```prisma
model InvitationToken {
  // Crypto-secure ID (21 chars base64url)
  // This IS the token in URLs: /r/{id}
  id            String    @id
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  isActive      Boolean   @default(true)
  isUsed        Boolean   @default(false)
  expiresAt     DateTime

  // Access tracking
  firstAccessAt DateTime?
  lastAccessAt  DateTime?
  deviceId      String?
  userAgent     String?
  accessCount   Int       @default(0)

  invitationId String
  invitation   Invitation @relation(...)

  @@index([invitationId])
  @@index([isActive])
  @@map("invitation_tokens")
}
```

**Key Points:**

- Token `id` is NOT a CUID - it's generated with `crypto.randomBytes`
- ~126 bits of entropy for security
- Can be revoked without deleting (set `isActive = false`)

---

### CheckIn

Records of guests checking in at the event.

```prisma
model CheckIn {
  id            String    @id @default(cuid())
  createdAt     DateTime  @default(now())

  invitationId  String
  invitation    Invitation @relation(...)

  checkedInBy   String
  checkedByUser User       @relation("CheckInsByUser", ...)

  guestsCount   Int       @default(1)

  // Offline-first support
  clientId      String    @unique  // UUID for deduplication
  deviceId      String?
  syncedAt      DateTime?          // NULL = pending sync

  // Soft delete
  deletedAt     DateTime?
  deletedBy     String?
  deletedByUser User?      @relation("CheckInsDeletedByUser", ...)

  // Capacity tracking
  exceededCapacity Boolean  @default(false)
  capacityNote     String?

  @@index([invitationId])
  @@index([clientId])
  @@index([syncedAt])
  @@map("check_ins")
}
```

**Key Points:**

- `clientId` enables idempotent sync from offline
- `syncedAt = null` means created offline, pending sync
- Soft delete preserves audit trail
- `exceededCapacity` flags but doesn't block entry

---

### EventMember

Collaborators with permission-based access.

```prisma
model EventMember {
  id          String    @id @default(cuid())
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  eventId     String
  event       Event     @relation(...)
  userId      String
  user        User      @relation(...)

  // Bitmask permissions (64-bit)
  permissions BigInt    @default(0)

  // Invitation tracking
  invitedBy   String
  invitedAt   DateTime  @default(now())
  revokedAt   DateTime?

  @@unique([eventId, userId])
  @@index([userId, revokedAt])
  @@map("event_members")
}
```

**Key Points:**

- `permissions` is a BigInt storing bitmask
- `revokedAt` = soft delete for collaborator access
- Unique constraint prevents duplicate memberships

---

### SectionConfiguration

Dynamic section settings per event.

```prisma
model SectionConfiguration {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  eventId   String
  event     Event    @relation(...)

  key       String   // 'hero', 'ceremony', 'divider', etc.
  isEnabled Boolean  @default(true)
  order     Int
  settings  Json?    // Validated per section schema

  @@index([eventId, order])
  @@index([eventId, key])
  @@map("section_configurations")
}
```

**Key Points:**

- `key` can repeat for `divider` sections
- `settings` is validated against section's Zod schema
- `order` determines render sequence

---

## Subscription Models

### Subscription

Current subscription state (1:1 with User).

```prisma
model Subscription {
  id        String   @id @default(cuid())

  userId    String   @unique
  user      User     @relation(...)

  tier      SubscriptionTier   @default(FREE)
  status    SubscriptionStatus @default(active)

  // Payment provider (agnostic)
  paymentProvider           String?
  paymentProviderCustomerId String?  @unique
  externalSubscriptionId    String?  @unique

  // Billing cycle
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?

  // Cancellation
  cancelAtPeriodEnd Boolean  @default(false)
  canceledAt        DateTime?

  // Trial
  trialStart DateTime?
  trialEnd   DateTime?

  @@map("subscriptions")
}

enum SubscriptionTier {
  FREE
  BASIC
  COMPANY
}

enum SubscriptionStatus {
  active
  past_due
  canceled
  incomplete
  trialing
  paused
}
```

### SubscriptionHistory

Audit log of all subscription changes.

```prisma
model SubscriptionHistory {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())

  userId    String
  user      User     @relation(...)

  eventType SubscriptionEventType

  fromTier   SubscriptionTier?
  toTier     SubscriptionTier
  fromStatus SubscriptionStatus?
  toStatus   SubscriptionStatus

  reason       String?
  changedBy    String?  // userId, "webhook:stripe", "system"

  // Payment details
  paymentProvider      String?
  externalEventId      String?
  amount               Int?     // cents
  currency             String?

  metadata Json?

  @@index([userId, createdAt])
  @@map("subscription_history")
}
```

---

## Security Models

### Rate Limiting

```prisma
// Better Auth rate limiter
model RateLimit {
  id          String   @id @default(cuid())
  key         String
  count       Int
  lastRequest BigInt
  @@map("rate_limit")
}

// App-level attempts
model RateLimitAttempt {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  ip        String
  actionType String
  success   Boolean  @default(false)
  @@index([ip, actionType, createdAt])
  @@map("rate_limit_attempts")
}

// IP blocks
model RateLimitBlock {
  id           String   @id @default(cuid())
  createdAt    DateTime @default(now())
  ip           String
  actionType   String
  blockedUntil DateTime
  reason       String?
  @@index([ip, actionType, blockedUntil])
  @@map("rate_limit_blocks")
}

// Audit log
model SecurityLog {
  id        String          @id @default(cuid())
  createdAt DateTime        @default(now())
  type      SecurityLogType
  ip        String
  userAgent String
  details   Json?
  @@index([ip, type, createdAt])
  @@map("security_logs")
}

enum SecurityLogType {
  login_attempt
  login_success
  login_failed
  rate_limit_triggered
  honeypot_triggered
  user_setup_failed
}
```

---

## Common Queries

### Get event with all data

```typescript
const event = await prisma.event.findUnique({
  where: { id: eventId },
  include: {
    invitations: {
      include: {
        tokens: { where: { isActive: true } },
        checkIns: { where: { deletedAt: null } },
      },
    },
    sections: { orderBy: { order: "asc" } },
    members: {
      where: { revokedAt: null },
      include: { user: true },
    },
  },
});
```

### Get dashboard metrics

```typescript
const [total, responded, attending] = await Promise.all([
  prisma.invitation.count({ where: { eventId } }),
  prisma.invitation.count({ where: { eventId, hasResponded: true } }),
  prisma.invitation.aggregate({
    where: { eventId, isAttending: true },
    _sum: { guestCount: true },
  }),
]);
```

### Check user's event access

```typescript
// Is owner?
const isOwner = await prisma.event.findFirst({
  where: { id: eventId, ownerId: userId },
});

// Is collaborator?
const membership = await prisma.eventMember.findFirst({
  where: {
    eventId,
    userId,
    revokedAt: null,
  },
});
```

---

## Indexes

Key indexes for performance:

| Table               | Index                       | Purpose                   |
| ------------------- | --------------------------- | ------------------------- |
| `invitations`       | `[eventId, hasResponded]`   | Filter by response status |
| `invitations`       | `[eventId, isAttending]`    | Filter confirmed guests   |
| `check_ins`         | `[invitationId, deletedAt]` | Active check-ins          |
| `event_members`     | `[userId, revokedAt]`       | User's active memberships |
| `invitation_tokens` | `[invitationId, isActive]`  | Find active token         |

---

## Migrations

```bash
# Create migration
npx prisma migrate dev --name add_new_field

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# Generate client after schema changes
npx prisma generate
```

---

## Prisma Client Location

Due to project configuration, Prisma client is generated to a custom location:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../app/generated/prisma"
}
```

Import from:

```typescript
import { PrismaClient } from "@/app/generated/prisma";
// Or use the singleton:
import { prisma } from "@/lib/prisma";
```
