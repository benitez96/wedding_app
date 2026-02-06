import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// ============================================
// IN-MEMORY RATE LIMITING (Edge-safe)
// ============================================
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100;

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Periodically clean up stale rate limit entries to prevent memory leak
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
let lastCleanup = Date.now();

function cleanupRateLimitMap() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return false;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  entry.count++;
  return false;
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

// ============================================
// ROUTE DEFINITIONS
// ============================================

/** Routes that match EXACTLY (no prefix) */
const PUBLIC_EXACT_ROUTES = new Set([
  "/",
  "/login",
  "/sign-up",
  "/register",
  "/backoffice/login",
  "/favicon.ico",
  "/logo.png",
]);

/** Route prefixes - anything starting with these is public */
const PUBLIC_PREFIX_ROUTES = [
  "/error",
  "/api/auth", // Better Auth endpoints - MUST be public for auth to work
  "/api/health",
  "/r/",
  "/join/", // Collaborator invite acceptance (auth happens inside the page)
  "/_next/",
  "/static/",
];

/** Routes that redirect to /login when unauthenticated */
const AUTH_REDIRECT_PREFIXES = ["/dashboard", "/backoffice"];

// ============================================
// SESSION CHECK (cookie-based, NO self-fetch)
// ============================================

/**
 * Check if the user has a Better Auth session cookie using the official helper.
 *
 * Uses `getSessionCookie()` from `better-auth/cookies` which automatically
 * resolves the correct cookie name (handles prefix, secure cookies, etc.).
 *
 * WHY cookie-presence check only (no fetch/DB call):
 *
 * 1. Middleware runs in Edge Runtime - no Prisma, no direct DB access.
 *
 * 2. Fetching our own /api/auth/get-session from inside the middleware causes
 *    an infinite redirect loop: the fetch goes through the middleware again,
 *    which fetches again, etc.
 *
 * 3. Better Auth's cookieCache (enabled in lib/auth.ts) stores a signed
 *    session payload in the cookie via HMAC. The cookie is cryptographically
 *    signed and tamper-proof.
 *
 * 4. The REAL session validation (DB check, expiry, etc.) happens in
 *    server actions and API routes via `auth.api.getSession()`.
 *    The middleware is just a fast gate to prevent unauthenticated users
 *    from hitting protected pages.
 *
 * Ref: https://www.better-auth.com/docs/integrations/next
 */

// ============================================
// MIDDLEWARE
// ============================================

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Rate limiting (skip static assets) ---
  const clientIP = getClientIP(request);

  const isStaticAsset =
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname.startsWith("/uploads/") ||
    /\.(jpg|jpeg|png|gif|webp|svg|ico|css|js|woff|woff2)$/.test(pathname);

  cleanupRateLimitMap();

  if (!isStaticAsset && checkRateLimit(clientIP)) {
    return new NextResponse("Rate limit exceeded", {
      status: 429,
      headers: { "Retry-After": "60" },
    });
  }

  // --- Public routes: allow through ---
  const isPublic =
    PUBLIC_EXACT_ROUTES.has(pathname) ||
    PUBLIC_PREFIX_ROUTES.some((prefix) => pathname.startsWith(prefix));

  if (isPublic) {
    return NextResponse.next();
  }

  // --- Protected routes: check session cookie ---
  // getSessionCookie returns the session token string or null
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    const isAuthRoute = AUTH_REDIRECT_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix),
    );

    if (isAuthRoute) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.redirect(
      new URL("/error?message=authentication-required", request.url),
    );
  }

  // Session cookie present -> allow through
  // Real DB validation happens in server actions via auth.api.getSession()
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     */
    "/((?!_next/static|_next/image).*)",
  ],
};
