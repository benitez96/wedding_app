import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import * as jose from 'jose'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas que no necesitan autenticación
  const publicRoutes = [
    '/backoffice/login',
    '/error',
    '/favicon.ico',
    '/logo.png',
    '/r/', // Rutas de procesamiento de tokens
    '/', // Sitio principal (se verifica autenticación en el componente)
  ]

  // Verificar si es una ruta pública
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Rutas del backoffice (necesitan autenticación de admin)
  if (pathname.startsWith('/backoffice')) {
    const adminSession = request.cookies.get('admin-session')

    if (!adminSession) {
      // No hay sesión de admin, redirigir a login
      return NextResponse.redirect(new URL('/backoffice/login', request.url))
    }

    try {
      // Verificar el JWT de admin
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret')
      const { payload } = await jose.jwtVerify(adminSession.value, secret, {
        issuer: 'wedding-app',
        audience: 'wedding-admin',
        algorithms: ['HS512']
      })

      // Verificar claims adicionales de seguridad
      if (payload.iss !== 'wedding-app' || payload.aud !== 'wedding-admin') {
        throw new Error('Invalid JWT claims')
      }

      // Verificar que sea una sesión de admin
      if (payload.sessionType !== 'admin') {
        throw new Error('Invalid session type')
      }

      // Sesión válida, continuar
      return NextResponse.next()
    } catch (error) {
      console.error('Error verificando sesión de admin:', error)
      // Sesión inválida, redirigir a login
      const response = NextResponse.redirect(new URL('/backoffice/login', request.url))
      response.cookies.delete('admin-session')
      return response
    }
  }

  // Rutas públicas (necesitan autenticación de invitación)
  const invitationSession = request.cookies.get('session')

  if (!invitationSession) {
    // No hay sesión de invitación, redirigir a error
    return NextResponse.redirect(new URL('/error?message=necesita-invitacion', request.url))
  }

  try {
    // Verificar el JWT de invitación
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret')
    const { payload } = await jose.jwtVerify(invitationSession.value, secret, {
      issuer: 'wedding-app',
      audience: 'wedding-invitation',
      algorithms: ['HS512']
    })

    // Verificar claims adicionales de seguridad
    if (payload.iss !== 'wedding-app' || payload.aud !== 'wedding-invitation') {
      throw new Error('Invalid JWT claims')
    }

    // Verificar que sea una sesión de invitación (no admin)
    if (payload.sessionType === 'admin') {
      throw new Error('Invalid session type for public routes')
    }

    // Sesión válida, continuar
    return NextResponse.next()
  } catch (error) {
    console.error('Error verificando sesión de invitación:', error)
    // Sesión inválida, redirigir a error
    const response = NextResponse.redirect(new URL('/error?message=necesita-invitacion', request.url))
    response.cookies.delete('session')
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     */
    '/((?!_next/static|_next/image).*)',
  ],
}
