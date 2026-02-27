# Architecture Overview

This document describes the high-level architecture of Invify.

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENTS                                    │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   Guest      │    │   Admin      │    │  QR Scanner  │          │
│  │  (Public)    │    │ (Backoffice) │    │   (PWA)      │          │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘          │
│         │                   │                   │                   │
│         │ JWT Cookie        │ Better Auth       │ Better Auth      │
│         │ (invitation_      │ Session           │ + IndexedDB      │
│         │  session)         │                   │                   │
└─────────┼───────────────────┼───────────────────┼───────────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS APP ROUTER                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │ Server      │  │ Route       │  │ Middleware  │                 │
│  │ Components  │  │ Handlers    │  │             │                 │
│  │ (RSC)       │  │ (API)       │  │ - Rate Limit│                 │
│  └──────┬──────┘  └──────┬──────┘  │ - Auth Check│                 │
│         │                │         └─────────────┘                 │
│         ▼                ▼                                         │
│  ┌─────────────────────────────────┐                               │
│  │        SERVER ACTIONS           │                               │
│  │  - invitations/*                │                               │
│  │  - check-in/*                   │                               │
│  │  - sections.ts                  │                               │
│  │  - settings.ts                  │                               │
│  │  - theme.ts                     │                               │
│  └──────────────┬──────────────────┘                               │
│                 │                                                   │
│                 ▼                                                   │
│  ┌─────────────────────────────────┐                               │
│  │          LIB LAYER              │                               │
│  │  - auth.ts (Better Auth)        │                               │
│  │  - permissions.ts (Bitmask)     │                               │
│  │  - server-auth.ts (Wrappers)    │                               │
│  │  - subscription-manager.ts      │                               │
│  └──────────────┬──────────────────┘                               │
│                 │                                                   │
└─────────────────┼───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATABASE                                    │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────┐                               │
│  │         PRISMA ORM              │                               │
│  │  - PostgreSQL                   │                               │
│  │  - Prisma Accelerate (optional) │                               │
│  └─────────────────────────────────┘                               │
│                                                                     │
│  Key Tables:                                                        │
│  ┌────────┐  ┌────────────┐  ┌─────────────────┐  ┌──────────┐    │
│  │ User   │──│ Event      │──│ Invitation      │──│ CheckIn  │    │
│  └────────┘  └────────────┘  └─────────────────┘  └──────────┘    │
│       │           │                   │                            │
│       │      ┌────┴────┐         ┌────┴────┐                      │
│       │      │ Section │         │ Token   │                      │
│       │      │ Config  │         │         │                      │
│       │      └─────────┘         └─────────┘                      │
│       │                                                            │
│  ┌────┴──────────┐                                                 │
│  │ Subscription  │  (1:1 with User)                               │
│  └───────────────┘                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

## Core Architectural Decisions

### 1. App Router (Server-First)

We use Next.js App Router with a **server-first** approach:

- **Server Components** are the default for all pages
- **Client Components** only when interactivity is required
- **Server Actions** for mutations (no API routes for form submissions)

```typescript
// Server Component (default)
export default async function Page() {
  const data = await prisma.event.findMany();
  return <ClientComponent data={data} />;
}

// Client Component (explicit)
"use client";
export function InteractiveForm() {
  const [state, action] = useActionState(serverAction, null);
  return <form action={action}>...</form>;
}
```

### 2. Dual Authentication System

The app serves two distinct user types:

| User Type | Auth Method | Cookie                      | Use Case            |
| --------- | ----------- | --------------------------- | ------------------- |
| **Admin** | Better Auth | `better-auth.session_token` | Backoffice access   |
| **Guest** | Custom JWT  | `invitation_session`        | Viewing invitations |

This separation ensures:

- Guests never need to create accounts
- Admins have full session management
- Tokens can be single-use and time-limited

### 3. Bitmask Permissions

Instead of role-based access, we use **bitmask permissions** for granular control:

```typescript
const PERMISSIONS = {
  GUESTS_VIEW: 1n << 0n, // 1
  GUESTS_CREATE: 1n << 1n, // 2
  GUESTS_EDIT: 1n << 2n, // 4
  GUESTS_DELETE: 1n << 3n, // 8
  // ... 21 total permissions
};

// Check permission
hasPermission(userPerms, PERMISSIONS.GUESTS_EDIT);

// Combine permissions
const editorPerms = PERMISSIONS.GUESTS_VIEW | PERMISSIONS.GUESTS_EDIT;
```

Benefits:

- Single BigInt column in database
- O(1) permission checks
- Easy to add new permissions
- Preset combinations for common roles

### 4. Event-Scoped Multi-tenancy

All data is scoped to **Events**:

```
User (owner) ─────┬───── Event A
                  │        ├── Invitations
                  │        ├── Sections
                  │        ├── Configurations
                  │        └── CheckIns
                  │
                  └───── Event B
                           └── ...

User (collaborator) ───── Event A (via EventMember)
```

The `withEventAuth()` wrapper ensures every action has event context:

```typescript
export const myAction = withEventAuth(async (ctx, arg1) => {
  const { user, event, tierContext } = ctx;
  // event.eventId is always available
  // tierContext has subscription limits
});
```

### 5. Offline-First Check-in

The QR scanner uses a **Strategy Pattern** for different network conditions:

```
┌─────────────────────────────────────────────────────────┐
│                  CHECK-IN STRATEGIES                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐ │
│  │  IDB_FIRST    │  │ SERVER_FIRST  │  │HYBRID_SMART │ │
│  │               │  │               │  │             │ │
│  │ 1. Check IDB  │  │ 1. Call API   │  │ Measure     │ │
│  │ 2. Queue sync │  │ 2. Fallback   │  │ latency,    │ │
│  │ 3. Update IDB │  │    to IDB     │  │ pick best   │ │
│  └───────────────┘  └───────────────┘  └─────────────┘ │
│                                                         │
│  IndexedDB Structure:                                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ invitations: { id, tokenId, guestName, ... }    │   │
│  │ checkInQueue: { clientId, timestamp, synced }   │   │
│  │ meta: { lastSyncedAt }                          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 6. Dynamic Sections

Invitation pages are composed of **configurable sections**:

```typescript
// Each section is registered with metadata
const SECTION_METADATA = {
  hero: { name: "Hero", order: 0, settingsSchema: HeroSettingsSchema },
  ceremony: {
    name: "Ceremony",
    order: 1,
    settingsSchema: CeremonySettingsSchema,
  },
  // ...
};

// Sections are stored in DB per event
interface SectionConfiguration {
  id: string;
  key: SectionKey; // 'hero' | 'ceremony' | ...
  isEnabled: boolean;
  order: number;
  settings: JsonValue; // Validated against section's schema
}
```

The renderer dynamically loads and renders enabled sections:

```typescript
// DynamicSectionRenderer.tsx
export default function DynamicSectionRenderer({ sections, user }) {
  return sections
    .filter(s => s.isEnabled)
    .sort((a, b) => a.order - b.order)
    .map(section => {
      const Component = SECTION_COMPONENTS[section.key];
      return <Component key={section.id} settings={section.settings} user={user} />;
    });
}
```

## Directory Structure Rationale

| Directory      | Purpose          | Key Rule                         |
| -------------- | ---------------- | -------------------------------- |
| `app/actions/` | Server Actions   | Mutations only, always validated |
| `app/api/`     | Route Handlers   | REST endpoints, SSE streams      |
| `lib/`         | Shared utilities | Pure functions, no React         |
| `components/`  | React components | Organized by domain              |
| `hooks/`       | Custom hooks     | Shared across components         |
| `types/`       | Type definitions | Shared across app                |

**Scope Rule**: If something is used in 2+ places, it goes in a shared directory. If used in 1 place, keep it local.

## Security Layers

```
Request
   │
   ▼
┌─────────────────┐
│   Middleware    │  Rate limiting, basic cookie check
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Route/Action   │  Auth verification (Better Auth or JWT)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Permission     │  Bitmask check for specific action
│    Check        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Tier Check     │  Subscription limits (max guests, etc.)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Zod Validation │  Input sanitization and validation
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Business Logic │  Actual operation
└─────────────────┘
```

## Next Steps

- [Data Flow](./data-flow.md) - Detailed flow for each major feature
- [Getting Started](../guides/getting-started.md) - Setup instructions
