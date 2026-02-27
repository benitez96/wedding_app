# Data Flow

This document details how data flows through the application for each major feature.

## Table of Contents

- [Invitation Access Flow](#invitation-access-flow)
- [Admin Authentication Flow](#admin-authentication-flow)
- [RSVP Submission Flow](#rsvp-submission-flow)
- [Check-in Flow (Offline-First)](#check-in-flow-offline-first)
- [Section Configuration Flow](#section-configuration-flow)

---

## Invitation Access Flow

When a guest accesses their invitation via a unique URL (`/r/[token]`):

```
Guest clicks: invify.app/r/abc123xyz
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│                  MIDDLEWARE                              │
│  1. Rate limit check (by IP)                            │
│  2. Block if suspicious activity                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              app/r/[token]/page.tsx                     │
│                                                         │
│  1. validateInvitationToken(token)                      │
│     ├── Check token exists                              │
│     ├── Check token.isActive                            │
│     ├── Check token.expiresAt > now                     │
│     └── Return invitation + event data                  │
│                                                         │
│  2. Set JWT cookie (invitation_session)                 │
│     ├── Contains: invitationId, eventId, tokenId        │
│     ├── Expires: 24 hours                               │
│     └── HttpOnly, Secure, SameSite=Lax                  │
│                                                         │
│  3. Update token access metadata                        │
│     ├── firstAccessAt (if first access)                 │
│     ├── lastAccessAt                                    │
│     ├── accessCount++                                   │
│     └── userAgent, deviceId                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              InvitationPageClient                       │
│                                                         │
│  1. Load event theme (activeTheme + customTheme)        │
│  2. Apply CSS variables for colors                      │
│  3. Fetch section configurations                        │
│  4. Render DynamicSectionRenderer                       │
│     └── Each section receives settings + user data      │
└─────────────────────────────────────────────────────────┘
```

### Key Data Structures

```typescript
// JWT Cookie Payload (invitation_session)
interface InvitationSession {
  invitationId: string;
  eventId: string;
  tokenId: string;
  guestName: string;
  iat: number; // issued at
  exp: number; // expires
}

// Data passed to sections
interface SectionUser {
  id: string;
  guestName: string;
  maxGuests: number;
  hasResponded: boolean;
  isAttending: boolean | null;
  guestCount: number | null;
}
```

---

## Admin Authentication Flow

Admin users authenticate via Better Auth:

```
User visits: /auth/login
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│              LOGIN FORM                                  │
│  1. Email/password submission                           │
│  2. Rate limiting (5 attempts/15 min)                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              BETTER AUTH                                 │
│                                                         │
│  POST /api/auth/sign-in/email                           │
│  1. Validate credentials                                │
│  2. Create session in DB                                │
│  3. Set session cookie                                  │
│     └── better-auth.session_token                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              PROTECTED ROUTES                           │
│                                                         │
│  app/backoffice/(protected)/layout.tsx                  │
│  1. getSession() from Better Auth                       │
│  2. Redirect to /auth/login if no session               │
│  3. Load user event context                             │
│     ├── getUserEventContext(userId)                     │
│     │   ├── Owned events                                │
│     │   └── Collaborated events (via EventMember)       │
│     └── getUserTierContext(userId)                      │
│         ├── Subscription tier                           │
│         └── Feature limits                              │
└─────────────────────────────────────────────────────────┘
```

### Session Cookie Details

| Cookie                      | Purpose       | Duration | Flags            |
| --------------------------- | ------------- | -------- | ---------------- |
| `better-auth.session_token` | Admin session | 7 days   | HttpOnly, Secure |
| `invitation_session`        | Guest JWT     | 24 hours | HttpOnly, Secure |

---

## RSVP Submission Flow

When a guest submits their RSVP response:

```
Guest fills RSVP form
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│              RSVPSection (Client Component)             │
│                                                         │
│  Form fields:                                           │
│  - isAttending: boolean                                 │
│  - guestCount: number (1 to maxGuests)                  │
│  - menuPreference?: string (if section enables it)      │
│  - dietaryRestrictions?: string                         │
│  - messageForCouple?: string                            │
│                                                         │
│  useActionState(respondToInvitation, initialState)      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         respondToInvitation (Server Action)             │
│                                                         │
│  1. Parse invitation_session cookie                     │
│  2. Zod validation:                                     │
│     const RSVPSchema = z.object({                       │
│       isAttending: z.boolean(),                         │
│       guestCount: z.number().min(1),                    │
│       menuPreference: z.string().optional(),            │
│       dietaryRestrictions: z.string().optional(),       │
│       messageForCouple: z.string().optional(),          │
│     });                                                 │
│                                                         │
│  3. Verify invitation belongs to session                │
│  4. Check if already responded (allow updates)          │
│  5. Update invitation record:                           │
│     ├── hasResponded = true                             │
│     ├── isAttending = input                             │
│     ├── guestCount = input                              │
│     ├── respondedAt = now()                             │
│     └── Extended fields (menu, dietary, message)        │
│                                                         │
│  6. revalidatePath('/r/[token]')                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              UI UPDATE                                   │
│                                                         │
│  - Form disabled (already responded)                    │
│  - Confirmation message shown                           │
│  - User data refreshed via RSC                          │
└─────────────────────────────────────────────────────────┘
```

---

## Check-in Flow (Offline-First)

The QR scanner supports offline operation with sync:

```
Staff scans QR code
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│              QR SCANNER COMPONENT                        │
│                                                         │
│  1. Decode QR → tokenId                                 │
│  2. Get current strategy from config                    │
│     └── IDB_FIRST | SERVER_FIRST | HYBRID_SMART         │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  IDB_FIRST  │ │SERVER_FIRST │ │HYBRID_SMART │
│             │ │             │ │             │
│ 1. IDB get  │ │ 1. API call │ │ 1. Measure  │
│ 2. Return   │ │ 2. Fallback │ │    latency  │
│    cached   │ │    to IDB   │ │ 2. Pick     │
│ 3. Queue    │ │ 3. Return   │ │    strategy │
│    sync     │ │    server   │ │ 3. Execute  │
└──────┬──────┘ └──────┬──────┘ └──────┬──────┘
       │               │               │
       └───────────────┴───────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              VALIDATION RESULT                          │
│                                                         │
│  Success:                                               │
│  {                                                      │
│    success: true,                                       │
│    source: 'IDB' | 'SERVER',                           │
│    invitation: {                                        │
│      id, guestName, maxGuests, checkInCount, remaining  │
│    }                                                    │
│  }                                                      │
│                                                         │
│  Error:                                                 │
│  {                                                      │
│    success: false,                                      │
│    error: 'Token not found' | 'Already at capacity'    │
│  }                                                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              CREATE CHECK-IN                            │
│                                                         │
│  Online:                                                │
│  1. POST /api/check-in                                  │
│  2. Update invitation.checkInCount                      │
│  3. Create CheckIn record with clientId                 │
│  4. Update IDB cache                                    │
│                                                         │
│  Offline (IDB_FIRST):                                   │
│  1. Generate clientId (UUID)                            │
│  2. Queue in IDB checkInQueue                           │
│  3. Optimistically update local checkInCount            │
│  4. Return { queued: true }                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              BACKGROUND SYNC                            │
│                                                         │
│  When online:                                           │
│  1. Fetch pending items from checkInQueue               │
│  2. POST each to server (with clientId for dedup)       │
│  3. Server uses clientId to prevent duplicates          │
│  4. Mark as synced in IDB                               │
│  5. Handle capacity conflicts gracefully                │
│     └── exceededCapacity flag, but don't reject         │
└─────────────────────────────────────────────────────────┘
```

### IndexedDB Schema

```typescript
// Database: invify-checkin
{
  invitations: {
    // Cached invitation data for offline validation
    id: string,           // Primary key
    tokenId: string,      // Index
    guestName: string,
    maxGuests: number,
    checkInCount: number, // Local optimistic count
    lastSyncedAt: number
  },

  checkInQueue: {
    // Pending check-ins to sync
    clientId: string,     // Primary key (UUID)
    invitationId: string,
    guestsCount: number,
    timestamp: number,
    synced: boolean
  },

  meta: {
    // Sync metadata
    lastSyncedAt: number,
    eventId: string
  }
}
```

---

## Section Configuration Flow

How section settings are managed in the backoffice:

```
Admin visits Structure page
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│        app/backoffice/(protected)/structure/page.tsx    │
│                                                         │
│  1. Load sections for current event                     │
│     └── getSectionConfigurations(eventId)               │
│                                                         │
│  2. Load section metadata (static)                      │
│     └── SECTION_METADATA from components/sections/      │
│                                                         │
│  3. Render section list with drag-and-drop              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              SECTION CARD                               │
│                                                         │
│  For each section:                                      │
│  - Enable/disable toggle                                │
│  - Settings button (opens modal)                        │
│  - Drag handle for reordering                           │
│                                                         │
│  Settings modal:                                        │
│  - Dynamic form based on section's settingsSchema       │
│  - Real-time preview (optional)                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│        updateSection (Server Action)                    │
│                                                         │
│  1. withEventAuth verification                          │
│  2. Permission check: STRUCTURE_EDIT                    │
│  3. Zod validation of settings against schema           │
│  4. Update SectionConfiguration in DB                   │
│  5. revalidatePath('/backoffice/structure')             │
└─────────────────────────────────────────────────────────┘
```

### Section Settings Schema Pattern

Each section defines its own Zod schema for settings:

```typescript
// components/sections/HeroSection/HeroSection.metadata.ts
import { z } from "zod";

export const HeroSettingsSchema = z.object({
  title: z.string().default("Save the Date"),
  subtitle: z.string().optional(),
  showCountdown: z.boolean().default(true),
  backgroundImage: z.url().optional(),
});

export type HeroSettings = z.infer<typeof HeroSettingsSchema>;

export const HeroSectionMetadata = {
  key: "hero",
  name: "Hero",
  description: "Main header with couple names and date",
  settingsSchema: HeroSettingsSchema,
  defaultSettings: HeroSettingsSchema.parse({}),
  isRepeatable: false, // Only one hero per invitation
};
```

---

## Summary

| Flow              | Key Components                  | Storage                |
| ----------------- | ------------------------------- | ---------------------- |
| Invitation Access | Token validation, JWT session   | PostgreSQL + Cookie    |
| Admin Auth        | Better Auth, session management | PostgreSQL + Cookie    |
| RSVP              | Server Action, Zod validation   | PostgreSQL             |
| Check-in          | Strategy Pattern, IndexedDB     | PostgreSQL + IndexedDB |
| Sections          | Dynamic schemas, drag-and-drop  | PostgreSQL             |
