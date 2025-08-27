'use server'

import { cookies, headers } from 'next/headers'
import * as jose from 'jose'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { getClientIP, recordAttempt, blockIPForHoneypot } from '@/lib/rate-limiter'
import { logSecurityEvent } from '@/lib/security-logger'

// Función para generar fingerprint del dispositivo
async function generateDeviceFingerprint(userAgent: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(userAgent)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Función para autenticar admin
export async function authenticateAdmin(username: string, password: string, honeypotValue?: string) {
  try {
    // Verificar honeypot primero
    if (honeypotValue) {
      // Si el honeypot está lleno, es probablemente un bot
      const clientIP = await getClientIP()
      const headersList = await headers()
      const userAgent = headersList.get('user-agent') || 'Unknown'
      
      // Bloquear la IP inmediatamente por 7 días
      await blockIPForHoneypot(clientIP, 'admin-login', `Valor: ${honeypotValue}`)
      
      await logSecurityEvent({
        type: 'honeypot-triggered',
        ip: clientIP,
        userAgent,
        details: { honeypotValue, username }
      })
      
      return { success: false, error: 'auth-error' }
    }

    // Verificar rate limiting antes de procesar
    const clientIP = await getClientIP()
    const rateLimitResult = await recordAttempt(clientIP, 'admin-login', false)
    
    if (!rateLimitResult.allowed) {
      await logSecurityEvent({
        type: 'rate-limit-triggered',
        ip: clientIP,
        userAgent: 'unknown',
        details: { actionType: 'admin-login' }
      })
      
      return { 
        success: false, 
        error: 'auth-error'
      }
    }

    // Obtener user agent para información del dispositivo
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || 'Unknown'

    // Buscar el usuario admin en la base de datos
    const adminUser = await prisma.adminUser.findUnique({
      where: { username }
    })

    // Si el usuario no existe, retornar error genérico
    if (!adminUser) {
      // Registrar intento fallido
      await recordAttempt(clientIP, 'admin-login', false)
      await logSecurityEvent({
        type: 'login-failed',
        ip: clientIP,
        userAgent,
        details: { reason: 'user-not-found', username }
      })
      return { success: false, error: 'auth-error' }
    }

    // Verificar la contraseña
    const isValidPassword = await bcrypt.compare(password, adminUser.password)
    if (!isValidPassword) {
      // Registrar intento fallido
      await recordAttempt(clientIP, 'admin-login', false)
      await logSecurityEvent({
        type: 'login-failed',
        ip: clientIP,
        userAgent,
        details: { reason: 'invalid-password', username }
      })
      return { success: false, error: 'auth-error' }
    }

    // Generar JWT con hardening de seguridad
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret')
    const sessionToken = await new jose.SignJWT({
      userId: adminUser.id,
      username: adminUser.username,
      // Agregar claims adicionales para mayor seguridad
      iss: 'wedding-app', // Issuer
      aud: 'wedding-admin', // Audience específico para admin
      sub: adminUser.id, // Subject
      // Fingerprint del dispositivo para detectar cambios
      deviceFp: await generateDeviceFingerprint(userAgent),
      // Timestamp de creación para tracking
      createdAt: Date.now(),
      // Tipo de sesión para diferenciar de invitaciones
      sessionType: 'admin'
    })
      .setProtectedHeader({ 
        alg: 'HS512', // Algoritmo más fuerte
        typ: 'JWT',
        kid: 'wedding-admin-v1' // Key ID para versioning
      })
      .setIssuedAt()
      .setNotBefore(new Date()) // No válido antes de ahora
      .setExpirationTime('24h') // Sesión más corta para admin
      .setJti(crypto.randomUUID()) // JWT ID único
      .sign(secret)

    // Setear la cookie
    const cookieStore = await cookies()
    cookieStore.set('admin-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 horas
    })

    // Registrar intento exitoso
    await recordAttempt(clientIP, 'admin-login', true)
    await logSecurityEvent({
      type: 'login-success',
      ip: clientIP,
      userAgent,
      details: { username: adminUser.username }
    })
    
    return { 
      success: true,
      user: {
        id: adminUser.id,
        username: adminUser.username
      }
    }
  } catch (error) {
    console.error('Error al autenticar admin:', error)
    return { success: false, error: 'error-autenticando' }
  }
}

// Función para verificar sesión de admin
export async function getCurrentAdmin() {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get('admin-session')

    if (!session) {
      return { success: false, user: null }
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret')
    const { payload } = await jose.jwtVerify(session.value, secret, {
      issuer: 'wedding-app',
      audience: 'wedding-admin',
      algorithms: ['HS512']
    })

    // Verificar claims adicionales de seguridad
    if (payload.iss !== 'wedding-app' || payload.aud !== 'wedding-admin') {
      return { success: false, user: null }
    }

    // Verificar que sea una sesión de admin
    if (payload.sessionType !== 'admin') {
      return { success: false, user: null }
    }

    // Verificar que el usuario admin aún existe
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: payload.userId as string }
    })

    if (!adminUser) {
      return { success: false, user: null }
    }

    return { 
      success: true, 
      user: {
        id: adminUser.id,
        username: adminUser.username
      }
    }
  } catch (error) {
    console.error('Error al obtener admin actual:', error)
    return { success: false, user: null }
  }
}

// Función para cerrar sesión de admin
export async function logoutAdmin() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('admin-session')
    
    return { success: true }
  } catch (error) {
    console.error('Error al cerrar sesión:', error)
    return { success: false, error: 'error-cerrando-sesion' }
  }
}

// Función para crear usuario admin (solo para uso en consola)
export async function createAdminUser(username: string, password: string) {
  try {
    // Verificar que el usuario no exista
    const existingUser = await prisma.adminUser.findUnique({
      where: { username }
    })

    if (existingUser) {
      return { success: false, error: 'usuario-ya-existe' }
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 12)

    // Crear el usuario admin
    const adminUser = await prisma.adminUser.create({
      data: {
        username,
        password: hashedPassword
      }
    })

    return { 
      success: true,
      user: {
        id: adminUser.id,
        username: adminUser.username
      }
    }
  } catch (error) {
    console.error('Error al crear usuario admin:', error)
    return { success: false, error: 'error-creando-usuario' }
  }
}
