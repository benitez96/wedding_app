# Route Handlers Reference

Route Handlers are REST API endpoints used for specific cases where Server Actions aren't suitable.

## Location

All route handlers are in `app/api/`:

```
app/api/
├── auth/
│   └── [...all]/
│       └── route.ts      # Better Auth handler
├── check-in/
│   ├── route.ts          # Check-in operations
│   └── invitations/
│       └── route.ts      # Fetch invitations for IDB cache
├── ping/
│   └── route.ts          # Health check / latency measurement
└── webhooks/
    └── ...               # Payment provider webhooks
```

---

## Auth Routes

### `GET/POST /api/auth/*`

Better Auth handles all authentication routes:

```typescript
// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

#### Available Endpoints

| Method | Path                        | Purpose                 |
| ------ | --------------------------- | ----------------------- |
| POST   | `/api/auth/sign-in/email`   | Email/password login    |
| POST   | `/api/auth/sign-up/email`   | Registration            |
| POST   | `/api/auth/sign-out`        | Logout                  |
| GET    | `/api/auth/session`         | Get current session     |
| POST   | `/api/auth/forget-password` | Request password reset  |
| POST   | `/api/auth/reset-password`  | Complete password reset |

---

## Check-in Routes

### `POST /api/check-in`

Creates a check-in record. Used by the offline sync mechanism.

```typescript
// app/api/check-in/route.ts
export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Validate input
  const { invitationId, guestsCount, clientId } = CheckInSchema.parse(body);

  // Check for duplicate (idempotency via clientId)
  const existing = await prisma.checkIn.findUnique({
    where: { clientId },
  });

  if (existing) {
    return Response.json({
      success: true,
      deduplicated: true,
      checkInId: existing.id,
    });
  }

  // Create check-in
  const checkIn = await prisma.checkIn.create({
    data: {
      invitationId,
      guestsCount,
      clientId,
      checkedInBy: session.user.id,
      syncedAt: new Date(),
    },
  });

  return Response.json({ success: true, checkInId: checkIn.id });
}
```

#### Request

```json
{
  "invitationId": "inv_abc123",
  "guestsCount": 2,
  "clientId": "550e8400-e29b-41d4-a716-446655440000",
  "deviceId": "device_xyz"
}
```

#### Response

```json
{
  "success": true,
  "checkInId": "chk_def456"
}
```

Or if deduplicated:

```json
{
  "success": true,
  "deduplicated": true,
  "checkInId": "chk_def456"
}
```

---

### `GET /api/check-in/invitations`

Fetches all invitations for a given event (for IndexedDB cache).

```typescript
// app/api/check-in/invitations/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user has access to this event
  const hasAccess = await verifyEventAccess(session.user.id, eventId);
  if (!hasAccess) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const invitations = await prisma.invitation.findMany({
    where: { eventId },
    select: {
      id: true,
      guestName: true,
      guestNickname: true,
      maxGuests: true,
      checkInCount: true,
      tokens: {
        where: { isActive: true },
        select: { id: true },
      },
    },
  });

  // Transform for client storage
  const data = invitations.map((inv) => ({
    id: inv.id,
    tokenId: inv.tokens[0]?.id ?? null,
    guestName: inv.guestName,
    guestNickname: inv.guestNickname,
    maxGuests: inv.maxGuests,
    checkInCount: inv.checkInCount,
  }));

  return Response.json(data);
}
```

#### Request

```
GET /api/check-in/invitations?eventId=evt_abc123
```

#### Response

```json
[
  {
    "id": "inv_1",
    "tokenId": "tok_abc",
    "guestName": "John Smith",
    "guestNickname": "Johnny",
    "maxGuests": 2,
    "checkInCount": 0
  },
  {
    "id": "inv_2",
    "tokenId": "tok_def",
    "guestName": "Jane Doe",
    "guestNickname": null,
    "maxGuests": 4,
    "checkInCount": 2
  }
]
```

---

## Utility Routes

### `HEAD /api/ping`

Health check endpoint used for latency measurement.

```typescript
// app/api/ping/route.ts
export function HEAD() {
  return new Response(null, { status: 200 });
}

export function GET() {
  return Response.json({ status: "ok", timestamp: Date.now() });
}
```

#### Usage (Client)

```typescript
async function measureLatency(): Promise<number> {
  const start = performance.now();
  await fetch("/api/ping", { method: "HEAD" });
  return performance.now() - start;
}
```

---

## Webhook Routes

### Payment Webhooks

For Stripe, MercadoPago, etc:

```typescript
// app/api/webhooks/stripe/route.ts
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  // Verify webhook signature
  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET,
  );

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutComplete(event.data.object);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdate(event.data.object);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionCanceled(event.data.object);
      break;
  }

  return Response.json({ received: true });
}
```

---

## When to Use Route Handlers vs Server Actions

| Use Case                    | Recommended   |
| --------------------------- | ------------- |
| Form submissions            | Server Action |
| Client-side mutations       | Server Action |
| Webhook handlers            | Route Handler |
| External API integration    | Route Handler |
| File downloads              | Route Handler |
| Streaming responses (SSE)   | Route Handler |
| Third-party OAuth callbacks | Route Handler |
| Health checks / ping        | Route Handler |
| Mobile app API              | Route Handler |

---

## Authentication in Route Handlers

```typescript
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  // Get session from Better Auth
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // User is authenticated
  const userId = session.user.id;
  // ...
}
```

---

## Error Handling

Standard error response format:

```typescript
// Success
return Response.json({ success: true, data: result });

// Client error
return Response.json(
  { error: "Invalid input", details: validationErrors },
  { status: 400 },
);

// Unauthorized
return Response.json({ error: "Unauthorized" }, { status: 401 });

// Forbidden
return Response.json({ error: "Forbidden" }, { status: 403 });

// Not found
return Response.json({ error: "Resource not found" }, { status: 404 });

// Server error
return Response.json({ error: "Internal server error" }, { status: 500 });
```

---

## CORS

For API routes that need CORS:

```typescript
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function GET(request: Request) {
  const response = Response.json({ data: "..." });
  response.headers.set("Access-Control-Allow-Origin", "*");
  return response;
}
```

---

## Rate Limiting

Applied via middleware, but can be checked in handlers:

```typescript
import { checkRateLimit } from "@/lib/rate-limiter-prisma";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";

  const rateLimit = await checkRateLimit(ip, "api-check-in");

  if (!rateLimit.allowed) {
    return Response.json(
      { error: "Too many requests", retryAfter: rateLimit.resetAt },
      { status: 429 },
    );
  }

  // ... handle request
}
```
