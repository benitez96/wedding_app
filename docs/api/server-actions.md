# Server Actions Reference

Server Actions are the primary way to perform mutations in Invify. They run on the server and are called directly from client components.

## Location

All server actions are in `app/actions/`:

```
app/actions/
├── backoffice.ts           # Dashboard-related actions
├── check-in/               # Check-in operations
│   ├── index.ts
│   └── sync.ts
├── collaborators.ts        # Collaborator management
├── events.ts               # Event CRUD
├── invitations/            # Invitation management
│   ├── index.ts            # Barrel export
│   ├── crud.ts             # Create, update, delete
│   ├── tokens.ts           # Token generation/validation
│   └── rsvp.ts             # Guest responses
├── metrics.ts              # Analytics data
├── protected-admin-invitations.ts  # Admin invitation operations
├── protected-invitations.ts        # Guest-facing operations
├── schemas.ts              # Shared Zod schemas
├── schemas/                # Domain-specific schemas
├── sections.ts             # Section configuration
├── settings.ts             # Event settings
└── theme.ts                # Theme operations
```

---

## Authentication Wrappers

### `withAuth`

Requires authenticated admin user:

```typescript
import { withAuth } from "@/lib/server-auth";

export const myAction = withAuth(async (user, arg1, arg2) => {
  // user: User object from Better Auth
  // arg1, arg2: your action arguments
  return { success: true };
});
```

### `withEventAuth`

Requires authenticated user with event context:

```typescript
import { withEventAuth } from "@/lib/server-auth";
import { PERMISSIONS } from "@/lib/permissions";

export const myAction = withEventAuth(
  async (ctx, arg1) => {
    // ctx.user: User object
    // ctx.event: { eventId, isOwner, permissions }
    // ctx.tierContext: { tier, limits }
    return { success: true };
  },
  PERMISSIONS.GUESTS_CREATE, // Optional: required permission
);
```

---

## Invitations

### `createInvitation`

Creates a new guest invitation.

```typescript
// app/actions/invitations/crud.ts
export const createInvitation = withEventAuth(
  async (ctx, data: CreateInvitationInput) => {
    // Validates against tier limits
    // Creates invitation in database
    // Returns: { success: true, invitation }
  },
  PERMISSIONS.GUESTS_CREATE,
);

// Input type
interface CreateInvitationInput {
  guestName: string;
  guestNickname?: string;
  guestPhone?: string;
  maxGuests?: number; // default: 1
}
```

### `updateInvitation`

Updates an existing invitation.

```typescript
export const updateInvitation = withEventAuth(
  async (ctx, id: string, data: UpdateInvitationInput) => {
    // Verifies invitation belongs to user's event
    // Returns: { success: true, invitation }
  },
  PERMISSIONS.GUESTS_EDIT,
);
```

### `deleteInvitation`

Soft-deletes an invitation.

```typescript
export const deleteInvitation = withEventAuth(async (ctx, id: string) => {
  // Also deletes associated tokens
  // Returns: { success: true }
}, PERMISSIONS.GUESTS_DELETE);
```

### `createInvitationToken`

Generates a shareable URL token for an invitation.

```typescript
export const createInvitationToken = withEventAuth(
  async (ctx, invitationId: string) => {
    // Creates crypto-secure token
    // Sets 1-year expiration
    // Returns: { success: true, token, url }
  },
  PERMISSIONS.GUESTS_SEND,
);
```

### `validateInvitationToken`

Validates and returns invitation data for a token (used by `/r/[token]`).

```typescript
// app/actions/invitations/tokens.ts
export async function validateInvitationToken(token: string) {
  // Checks token exists, is active, not expired
  // Updates access metadata
  // Returns: { success: true, invitation, event }
}
```

---

## RSVP

### `respondToInvitation`

Submits or updates a guest's RSVP response.

```typescript
// app/actions/protected-invitations.ts
export async function respondToInvitation(formData: FormData) {
  // Reads invitation from JWT cookie
  // Validates response data
  // Updates invitation record
  // Returns: { success: true }
}

// FormData fields
{
  isAttending: "true" | "false",
  guestCount: "1" | "2" | ...,
  menuPreference?: string,      // If RSVP section has menu enabled
  dietaryRestrictions?: string,
  messageForCouple?: string,
}
```

---

## Sections

### `getSectionConfigurations`

Fetches all section configurations for an event.

```typescript
// app/actions/sections.ts
export async function getSectionConfigurations(eventId: string) {
  // Returns: SectionConfiguration[]
}
```

### `updateSectionConfiguration`

Updates a single section's settings.

```typescript
export const updateSectionConfiguration = withEventAuth(
  async (ctx, sectionId: string, data: UpdateSectionInput) => {
    // Validates settings against section's schema
    // Returns: { success: true }
  },
  PERMISSIONS.STRUCTURE_EDIT,
);

interface UpdateSectionInput {
  isEnabled?: boolean;
  order?: number;
  settings?: Record<string, unknown>;
}
```

### `reorderSections`

Updates the order of all sections at once.

```typescript
export const reorderSections = withEventAuth(
  async (ctx, orderedIds: string[]) => {
    // Updates order field for each section
    // Returns: { success: true }
  },
  PERMISSIONS.STRUCTURE_EDIT,
);
```

### `addSection`

Adds a new section (typically dividers).

```typescript
export const addSection = withEventAuth(
  async (ctx, key: SectionKey, afterSectionId?: string) => {
    // Validates section is repeatable
    // Inserts at correct position
    // Returns: { success: true, section }
  },
  PERMISSIONS.STRUCTURE_EDIT,
);
```

### `removeSection`

Removes a section (only repeatable sections like dividers).

```typescript
export const removeSection = withEventAuth(async (ctx, sectionId: string) => {
  // Validates section is repeatable
  // Returns: { success: true }
}, PERMISSIONS.STRUCTURE_EDIT);
```

---

## Theme

### `updateEventTheme`

Changes the active theme.

```typescript
// app/actions/theme.ts
export const updateEventTheme = withEventAuth(async (ctx, themeId: ThemeId) => {
  // Updates event.activeTheme
  // Clears customTheme if not "custom"
  // Returns: { success: true }
}, PERMISSIONS.DESIGN_EDIT);
```

### `updateCustomTheme`

Updates custom theme colors.

```typescript
export const updateCustomTheme = withEventAuth(
  async (ctx, colors: CustomThemeColors) => {
    // Sets activeTheme to "custom"
    // Stores colors in customTheme JSON field
    // Returns: { success: true }
  },
  PERMISSIONS.DESIGN_EDIT,
);
```

---

## Check-in

### `createCheckIn`

Records a check-in for an invitation.

```typescript
// app/actions/check-in/index.ts
export const createCheckIn = withEventAuth(
  async (ctx, data: CreateCheckInInput) => {
    // Validates invitation exists and belongs to event
    // Creates CheckIn record
    // Updates invitation.checkInCount
    // Returns: { success: true, checkIn }
  },
  PERMISSIONS.CHECKIN_SCAN,
);

interface CreateCheckInInput {
  invitationId: string;
  guestsCount: number;
  clientId: string; // For deduplication
  deviceId?: string;
}
```

### `syncCheckIns`

Syncs offline check-ins to the server.

```typescript
// app/actions/check-in/sync.ts
export const syncCheckIns = withEventAuth(
  async (ctx, checkIns: PendingCheckIn[]) => {
    // Processes each check-in
    // Uses clientId for deduplication
    // Returns: { success: true, synced: number, failed: string[] }
  },
  PERMISSIONS.CHECKIN_SCAN,
);
```

### `deleteCheckIn`

Soft-deletes a check-in record.

```typescript
export const deleteCheckIn = withEventAuth(async (ctx, checkInId: string) => {
  // Sets deletedAt, deletedBy
  // Decrements invitation.checkInCount
  // Returns: { success: true }
}, PERMISSIONS.CHECKIN_DELETE);
```

---

## Collaborators

### `createInviteLink`

Creates a link for inviting collaborators.

```typescript
// app/actions/collaborators.ts
export const createInviteLink = withEventAuth(
  async (ctx, permissions: bigint, options?: InviteLinkOptions) => {
    // Generates secure token
    // Returns: { success: true, url, expiresAt }
  },
  PERMISSIONS.COLLABORATORS_INVITE,
);

interface InviteLinkOptions {
  expiresAt?: Date;
  maxUses?: number;
}
```

### `acceptInviteLink`

Accepts a collaborator invitation.

```typescript
export const acceptInviteLink = withAuth(async (user, token: string) => {
  // Validates token is active and not expired
  // Creates EventMember record
  // Increments usedCount
  // Returns: { success: true, eventId }
});
```

### `updateCollaboratorPermissions`

Updates a collaborator's permissions.

```typescript
export const updateCollaboratorPermissions = withEventAuth(
  async (ctx, memberId: string, permissions: bigint) => {
    // Validates user can edit this collaborator
    // Updates EventMember.permissions
    // Returns: { success: true }
  },
  PERMISSIONS.COLLABORATORS_EDIT,
);
```

### `revokeCollaborator`

Revokes a collaborator's access.

```typescript
export const revokeCollaborator = withEventAuth(
  async (ctx, memberId: string) => {
    // Sets EventMember.revokedAt
    // Returns: { success: true }
  },
  PERMISSIONS.COLLABORATORS_REMOVE,
);
```

---

## Settings

### `updateEventSettings`

Updates general event configuration.

```typescript
// app/actions/settings.ts
export const updateEventSettings = withEventAuth(
  async (ctx, settings: Record<string, string>) => {
    // Upserts each setting in Configuration table
    // Returns: { success: true }
  },
  PERMISSIONS.SETTINGS_EDIT,
);
```

### `getEventSettings`

Fetches all settings for an event.

```typescript
export async function getEventSettings(eventId: string) {
  // Returns: Record<string, string>
}
```

---

## Metrics

### `getDashboardMetrics`

Fetches dashboard statistics.

```typescript
// app/actions/metrics.ts
export const getDashboardMetrics = withEventAuth(async (ctx) => {
  // Returns:
  // {
  //   totalInvitations: number,
  //   responded: number,
  //   attending: number,
  //   declined: number,
  //   totalGuests: number,
  //   checkedIn: number,
  // }
});
```

---

## Error Handling

All server actions follow this pattern:

```typescript
export const myAction = withEventAuth(async (ctx, input) => {
  try {
    // Zod validation
    const validated = MySchema.parse(input);

    // Business logic
    const result = await doSomething(validated);

    // Revalidate affected paths
    revalidatePath("/backoffice/invitations");

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed",
        issues: error.issues,
      };
    }

    logError("myAction failed", error);
    return { success: false, error: "Operation failed" };
  }
});
```

### Client Usage

```typescript
"use client";

import { myAction } from "@/app/actions/myAction";

function MyComponent() {
  const handleSubmit = async (data: FormData) => {
    const result = await myAction(data);

    if (result.success) {
      toast.success("Done!");
    } else {
      toast.error(result.error);
    }
  };
}
```

---

## Best Practices

1. **Always use auth wrappers** - Never expose unprotected mutations
2. **Validate with Zod** - Schemas are in `app/actions/schemas/`
3. **Check tier limits** - Use `ctx.tierContext` before creating resources
4. **Revalidate paths** - Call `revalidatePath()` after mutations
5. **Use logError()** - Import from `@/lib/logger` for server-side logging
6. **Return structured responses** - Always include `success` boolean
