import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isRateLimited, getClientIP } from "@/lib/middleware/rate-limit";
import {
  isPublicRoute,
  isStaticAsset,
  isAuthRedirectRoute,
} from "@/lib/middleware/routes";
import { getSessionPresence } from "@/lib/middleware/session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Rate limiting (production only; in-memory limiter resets on cold start) ---
  if (process.env.NODE_ENV === "production" && !isStaticAsset(pathname)) {
    const clientIP = getClientIP(request);
    if (isRateLimited(clientIP)) {
      return new NextResponse("Rate limit exceeded", {
        status: 429,
        headers: { "Retry-After": "60" },
      });
    }
  }

  // --- Public routes: allow through without session check ---
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // --- Protected routes: verify at least one session cookie is present ---
  //
  // We only check cookie *presence* here — no DB call, no fetch.
  // Real validation (expiry, revocation, DB lookup) happens inside server
  // actions and API routes.  See lib/middleware/session.ts for details.
  const { hasAnySession } = getSessionPresence(request);

  if (!hasAnySession) {
    // Backoffice / dashboard routes → redirect to login page
    if (isAuthRedirectRoute(pathname)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Everything else (invitation pages, etc.) → generic error page
    return NextResponse.redirect(
      new URL("/error?message=authentication-required", request.url),
    );
  }

  // Session cookie present → allow through
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except Next.js internals:
     * - _next/static (static files)
     * - _next/image  (image optimisation)
     */
    "/((?!_next/static|_next/image).*)",
  ],
};
