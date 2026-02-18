/**
 * Route definitions for middleware.
 *
 * Keep all route lists here so adding/removing protected routes
 * doesn't require touching the main middleware.ts file.
 */

/** Routes that must match EXACTLY (no prefix matching). */
export const PUBLIC_EXACT_ROUTES = new Set([
  "/",
  "/login",
  "/sign-up",
  "/register",
  "/backoffice/login",
  "/favicon.ico",
  "/logo.png",
]);

/**
 * Route prefixes — any pathname starting with one of these is treated as public.
 * Order matters: first match wins.
 */
export const PUBLIC_PREFIX_ROUTES = [
  "/error",
  "/api/auth", // Better Auth endpoints — MUST be public for auth to work
  "/api/health",
  "/r/",
  "/join/", // Collaborator invite acceptance (auth happens inside the page)
  "/_next/",
  "/static/",
] as const;

/** Prefixes that trigger a redirect to /login when unauthenticated. */
export const AUTH_REDIRECT_PREFIXES = ["/dashboard", "/backoffice"] as const;

/** File extensions and path prefixes considered static assets (skip rate limiting). */
export const STATIC_ASSET_PATTERNS = {
  prefixes: ["/_next/", "/static/", "/uploads/"] as const,
  extensions: /\.(jpg|jpeg|png|gif|webp|svg|ico|css|js|woff|woff2)$/,
};

export function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_EXACT_ROUTES.has(pathname)) return true;
  return PUBLIC_PREFIX_ROUTES.some((prefix) => pathname.startsWith(prefix));
}

export function isStaticAsset(pathname: string): boolean {
  if (
    STATIC_ASSET_PATTERNS.prefixes.some((prefix) => pathname.startsWith(prefix))
  )
    return true;
  return STATIC_ASSET_PATTERNS.extensions.test(pathname);
}

export function isAuthRedirectRoute(pathname: string): boolean {
  return AUTH_REDIRECT_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
