# Authentication Guide

Invify uses **two separate authentication systems** for different user types.

## Overview

| User Type | Auth Method | Cookie Name                 | Purpose             |
| --------- | ----------- | --------------------------- | ------------------- |
| **Admin** | Better Auth | `better-auth.session_token` | Backoffice access   |
| **Guest** | Custom JWT  | `invitation_session`        | Viewing invitations |

This dual system allows:

- Guests to view invitations without creating accounts
- Admins to have full session management with Better Auth
- Clean separation of concerns between public and admin flows

---

## Admin Authentication (Better Auth)

### Configuration

Better Auth is configured in `lib/auth.ts`:

```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  rateLimit: {
    storage: "database",
    tableName: "rate_limit",
  },
});

export type User = typeof auth.$Infer.Session.user;
export type Session = typeof auth.$Infer.Session;
```

### Login Flow

1. User visits `/auth/login`
2. Submits email/password
3. Better Auth validates credentials
4. Session created in `sessions` table
5. Cookie `better-auth.session_token` set
6. User redirected to `/backoffice/dashboard`

### Protecting Server Actions

Use the `withAuth` wrapper for actions that require authentication:

```typescript
// app/actions/some-action.ts
"use server";

import { withAuth } from "@/lib/server-auth";

export const myAction = withAuth(async (user, arg1, arg2) => {
  // user is guaranteed to be authenticated
  console.log("User ID:", user.id);

  return { success: true };
});
```

### Protecting with Event Context

For actions that need the current event and tier limits:

```typescript
import { withEventAuth } from "@/lib/server-auth";
import { PERMISSIONS } from "@/lib/permissions";

export const createGuest = withEventAuth(
  async (ctx, guestData) => {
    const { user, event, tierContext } = ctx;

    // Check tier limits
    if (tierContext.guestCount >= tierContext.maxGuests) {
      throw new Error("Guest limit reached");
    }

    // event.eventId is the current event
    await prisma.invitation.create({
      data: {
        ...guestData,
        eventId: event.eventId,
      },
    });
  },
  PERMISSIONS.GUESTS_CREATE, // Required permission
);
```

### Getting Session in Server Components

```typescript
// app/backoffice/(protected)/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/login");
  }

  return <div>Welcome, {session.user.name}</div>;
}
```

---

## Guest Authentication (JWT Cookies)

### How It Works

When a guest accesses their invitation URL (`/r/[token]`):

1. Token is validated against the database
2. JWT cookie is created with invitation context
3. Guest can now interact with their invitation

### JWT Payload

```typescript
interface InvitationSession {
  invitationId: string;
  eventId: string;
  tokenId: string;
  guestName: string;
  iat: number; // issued at
  exp: number; // expires (24 hours)
}
```

### Creating the Session

```typescript
// app/r/[token]/page.tsx
import { setInvitationSession } from "@/lib/invitation-session";

export default async function TokenPage({ params }) {
  const { token } = await params;

  // Validate token
  const result = await validateInvitationToken(token);
  if (!result.success) {
    redirect("/invalid-token");
  }

  // Set JWT cookie
  await setInvitationSession({
    invitationId: result.invitation.id,
    eventId: result.event.id,
    tokenId: token,
    guestName: result.invitation.guestName,
  });

  // Render invitation
  return <InvitationPage event={result.event} />;
}
```

### Reading the Session in Actions

```typescript
// app/actions/protected-invitations.ts
"use server";

import { getInvitationSession } from "@/lib/invitation-session";

export async function respondToInvitation(formData: FormData) {
  const session = await getInvitationSession();

  if (!session) {
    return { error: "No active session" };
  }

  // session.invitationId is the guest's invitation
  await prisma.invitation.update({
    where: { id: session.invitationId },
    data: {
      hasResponded: true,
      isAttending: formData.get("attending") === "yes",
      // ...
    },
  });
}
```

---

## Permission System

### Bitmask Overview

Permissions are stored as a single BigInt using bitwise operations:

```typescript
// lib/permissions.ts
export const PERMISSIONS = {
  GUESTS_VIEW: 1n << 0n, // 1
  GUESTS_CREATE: 1n << 1n, // 2
  GUESTS_EDIT: 1n << 2n, // 4
  GUESTS_DELETE: 1n << 3n, // 8
  GUESTS_SEND: 1n << 4n, // 16
  DESIGN_VIEW: 1n << 5n, // 32
  DESIGN_EDIT: 1n << 6n, // 64
  // ... 21 total permissions
} as const;
```

### Permission Presets

Common role combinations are predefined:

```typescript
export const PERMISSION_PRESETS = {
  OWNER: /* all permissions */,
  ADMIN: /* everything except EVENT_DELETE, EVENT_TRANSFER */,
  EDITOR: /* GUESTS_* + ANALYTICS_VIEW */,
  VIEWER: /* *_VIEW permissions only */,
  CLIENT: /* GUESTS_* + viewing permissions */,
  CHECK_IN_STAFF: /* CHECKIN_* + GUESTS_VIEW */,
};
```

### Checking Permissions

```typescript
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
} from "@/lib/permissions";

// Single permission
if (hasPermission(userPerms, PERMISSIONS.GUESTS_EDIT)) {
  // Can edit guests
}

// All required
if (
  hasAllPermissions(userPerms, [
    PERMISSIONS.GUESTS_VIEW,
    PERMISSIONS.GUESTS_EDIT,
  ])
) {
  // Can view AND edit
}

// Any of these
if (
  hasAnyPermission(userPerms, [
    PERMISSIONS.DESIGN_EDIT,
    PERMISSIONS.STRUCTURE_EDIT,
  ])
) {
  // Can edit design OR structure
}
```

### Modifying Permissions

```typescript
import {
  addPermission,
  removePermission,
  togglePermission,
} from "@/lib/permissions";

let perms = PERMISSION_PRESETS.VIEWER;

// Add a permission
perms = addPermission(perms, PERMISSIONS.GUESTS_CREATE);

// Remove a permission
perms = removePermission(perms, PERMISSIONS.ANALYTICS_VIEW);

// Toggle (add if missing, remove if present)
perms = togglePermission(perms, PERMISSIONS.DESIGN_EDIT);
```

---

## Event Context

### Owner vs Collaborator

Every event has:

- **One Owner**: The user who created the event (full permissions)
- **Multiple Collaborators**: Users invited via EventMember (limited permissions)

```typescript
// lib/event-context.ts
interface EventContext {
  eventId: string;
  isOwner: boolean;
  permissions: bigint; // 0n if owner (bypasses checks)
}
```

### How Context is Resolved

```typescript
// lib/event-context-prisma.ts
export async function getUserEventContext(
  userId: string,
): Promise<EventContext | null> {
  // 1. Check if user owns any event
  const ownedEvent = await prisma.event.findFirst({
    where: { ownerId: userId },
  });

  if (ownedEvent) {
    return {
      eventId: ownedEvent.id,
      isOwner: true,
      permissions: 0n, // Owners bypass permission checks
    };
  }

  // 2. Check if user is a collaborator
  const membership = await prisma.eventMember.findFirst({
    where: {
      userId,
      revokedAt: null, // Active membership
    },
  });

  if (membership) {
    return {
      eventId: membership.eventId,
      isOwner: false,
      permissions: membership.permissions,
    };
  }

  return null;
}
```

---

## Rate Limiting

### Better Auth Rate Limiting

Built into Better Auth with database storage:

```typescript
// lib/auth.ts
rateLimit: {
  storage: "database",
  tableName: "rate_limit",
}
```

### App-Level Rate Limiting

For invitation token access and other sensitive operations:

```typescript
// lib/rate-limiter-prisma.ts
export async function checkRateLimit(
  ip: string,
  actionType: string,
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}>;

export async function recordAttempt(
  ip: string,
  actionType: string,
  success: boolean,
): Promise<void>;

export async function blockIP(
  ip: string,
  actionType: string,
  duration: number,
): Promise<void>;
```

---

## Security Best Practices

1. **Never expose user IDs in URLs** - Use tokens for public access
2. **Always validate ownership** - Check `eventId` matches the user's context
3. **Use server actions for mutations** - Not API routes (better CSRF protection)
4. **Rate limit sensitive operations** - Token validation, login, RSVP
5. **Log security events** - Use `SecurityLog` model for audit trail

---

## Debugging Auth Issues

### Check session in browser DevTools

```javascript
// Console
document.cookie.split(";").find((c) => c.includes("better-auth"));
```

### Verify session on server

```typescript
const session = await auth.api.getSession({
  headers: await headers(),
});
console.log("Session:", session);
```

### Common Issues

| Symptom                | Cause                  | Fix                                        |
| ---------------------- | ---------------------- | ------------------------------------------ |
| Redirect loop on login | Session not persisting | Check `BETTER_AUTH_URL` matches actual URL |
| "No autorizado" error  | Session expired        | Re-login, check cookie expiry              |
| Permission denied      | Missing permission     | Check user's EventMember.permissions       |
| Guest actions failing  | JWT expired            | Re-access via invitation URL               |
