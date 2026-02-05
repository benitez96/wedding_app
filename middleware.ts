import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple in-memory rate limiting for middleware (Edge-safe)
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100;

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Rate limiting middleware function
 * Returns true if request should be blocked
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    // Reset or create new entry
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

/**
 * Get client IP from request headers
 */
function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

/**
 * Middleware de Next.js para proteger rutas
 *
 * Better Auth maneja la autenticación automáticamente,
 * pero necesitamos validar la sesión real en el middleware
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ============================================
  // RATE LIMITING (applies to all routes)
  // ============================================
  const clientIP = getClientIP(request);

  // Skip rate limiting for static assets
  const isStaticAsset =
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname.startsWith("/uploads/") ||
    pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico|css|js|woff|woff2)$/);

  if (!isStaticAsset && checkRateLimit(clientIP)) {
    return new NextResponse("Rate limit exceeded", {
      status: 429,
      headers: {
        "Retry-After": "60",
      },
    });
  }

  // ============================================
  // RUTAS PÚBLICAS (no requieren autenticación)
  // ============================================

  // Rutas que deben coincidir EXACTAMENTE
  const publicExactRoutes = [
    "/", // Landing page / invitation page
    "/login",
    "/register",
    "/favicon.ico",
    "/logo.png",
  ];

  // Rutas que usan prefix matching (todo lo que empiece con esto es público)
  const publicPrefixRoutes = [
    "/error", // Error pages (e.g., /error?message=...)
    "/api/auth", // Endpoints de Better Auth
    "/api/health", // Health check
    "/r/", // Rutas de tokens de invitación (JWT, se validan internamente)
    "/_next/", // Next.js internals
    "/static/", // Static files
  ];

  const isPublic =
    publicExactRoutes.includes(pathname) ||
    publicPrefixRoutes.some((prefix) => pathname.startsWith(prefix));

  if (isPublic) {
    return NextResponse.next();
  }

  // ============================================
  // RUTAS PROTEGIDAS (requieren autenticación válida)
  // ============================================

  // Validar sesión con Better Auth vía API call
  // El middleware corre en Edge Runtime, no podemos usar Prisma directamente
  const session = await validateSession(request);

  if (!session) {
    // Si es una ruta del dashboard/backoffice, redirigir a login
    if (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/backoffice")
    ) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Para otras rutas protegidas, mostrar error
    return NextResponse.redirect(
      new URL("/error?message=authentication-required", request.url),
    );
  }

  // Sesión válida, permitir acceso
  return NextResponse.next();
}

/**
 * Valida la sesión con Better Auth via API call
 * Necesario porque el middleware corre en Edge Runtime y Prisma no está disponible
 */
async function validateSession(request: NextRequest) {
  try {
    // Obtener la cookie de sesión
    const sessionCookie = request.cookies.get("auth.session_token")?.value;
    if (!sessionCookie) {
      return null;
    }

    // Hacer request al endpoint de sesión de Better Auth
    // Esto valida que la sesión exista en la DB y no esté expirada
    const baseUrl = process.env.BETTER_AUTH_URL || request.nextUrl.origin;
    const response = await fetch(`${baseUrl}/api/auth/session`, {
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.session || null;
  } catch (error) {
    console.error("[Middleware] Session validation error:", error);
    return null;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - api/auth (Better Auth endpoints)
     */
    "/((?!_next/static|_next/image|api/auth).*)",
  ],
};
