import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware de Next.js para proteger rutas
 *
 * Better Auth maneja la autenticación automáticamente,
 * solo necesitamos verificar qué rutas requieren auth
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ============================================
  // RUTAS PÚBLICAS (no requieren autenticación)
  // ============================================
  const publicRoutes = [
    "/", // Landing page
    "/error", // Página de error
    "/api/auth", // Endpoints de Better Auth
    "/api/health", // Health check
    "/favicon.ico",
    "/logo.png",
    "/r/", // Rutas de tokens de invitación (se validan internamente)
  ];

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // ============================================
  // RUTAS PROTEGIDAS (requieren autenticación)
  // ============================================

  // Verificar sesión leyendo la cookie de sesión
  // Usar Better Auth solo en server actions/route handlers, no en middleware
  const sessionCookie = request.cookies.get("auth.session_token")?.value;

  // Si no hay cookie de sesión, redirigir a login
  if (!sessionCookie) {
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

  // Usuario autenticado, permitir acceso
  return NextResponse.next();
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
