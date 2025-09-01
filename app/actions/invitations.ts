'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@/app/generated/prisma'
import * as jose from 'jose'
import { headers } from 'next/headers'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { JWT_SECRET, SECURITY_CONFIG } from '@/lib/config'
import { invitationResponseSchema, tokenSchema, validateAndSanitize } from '@/utils/validation'
import { validateCSRFToken } from '@/lib/csrf'
import { getClientIP, recordAttempt } from '@/lib/rate-limiter'

// Función para generar fingerprint del dispositivo
async function generateDeviceFingerprint(userAgent: string): Promise<string> {
  const hash = crypto.createHash('sha256')
  hash.update(userAgent + JWT_SECRET)
  return hash.digest('hex').substring(0, 16) // Primeros 16 caracteres
}

// Helper function para validar tokens
async function validateToken(tokenId: string) {
  const token = await prisma.invitationToken.findUnique({
    where: { id: tokenId },
    include: { invitation: true }
  })

  if (!token || !token.isActive) {
    return { valid: false, error: 'Token inválido o revocado' }
  }

  if (!token.invitation) {
    return { valid: false, error: 'Invitación no encontrada' }
  }

  return { valid: true, token, invitation: token.invitation }
}

// ACCIONES PÚBLICAS (no requieren autenticación)

export async function processInvitationToken(token: string) {
  try {
    // Validar token
    const tokenValidation = validateAndSanitize(tokenSchema, token)
    if (!tokenValidation.success) {
      return { success: false, action: 'error', error: 'token-invalido' }
    }
    
    // Verificar rate limiting antes de procesar
    const clientIP = await getClientIP()
    const rateLimitResult = await recordAttempt(clientIP, 'invitation-token', false)
    
    if (!rateLimitResult.allowed) {
      return { 
        success: false, 
        action: 'error', 
        error: 'rate-limit-exceeded',
        blockedUntil: rateLimitResult.blockedUntil
      }
    }

    // Obtener user agent para información del dispositivo
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || 'Unknown'

    const cookieStore = await cookies()
    const session = cookieStore.get('session')

    // Verificar si tiene una sesión activa
    if (session) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret')
        const { payload } = await jose.jwtVerify(session.value, secret, {
          issuer: 'wedding-app',
          audience: 'wedding-invitation',
          algorithms: ['HS512']
        })
        
        // Verificar claims adicionales de seguridad
        if (payload.iss !== 'wedding-app' || payload.aud !== 'wedding-invitation') {
          throw new Error('Invalid JWT claims')
        }
        
        const currentDeviceFp = await generateDeviceFingerprint(userAgent)
        if (payload.deviceFp !== currentDeviceFp) {
          console.log('Device fingerprint mismatch, regenerating session')
          cookieStore.delete('session')
        } else {
          if (payload.tokenId === token) {
            return { success: true, action: 'redirect' }
          }
          
          console.log('Token diferente al de la sesión, validando nuevo token')
        }
      } catch (jwtError) {
        console.log('Sesión inválida, continuando con validación de token')
      }
    }

    // Buscar el token en la base de datos
    const validatedToken = (tokenValidation as { success: true; data: string }).data
    const invitationToken = await prisma.invitationToken.findUnique({
      where: { id: validatedToken },
      include: {
        invitation: true
      }
    })

    // Si el token no existe o está inactivo, retornar error
    if (!invitationToken || !invitationToken.isActive) {
      // Registrar intento fallido
      await recordAttempt(clientIP, 'invitation-token', false)
      return { success: false, action: 'error', error: 'token-invalido' }
    }

    // Verificar que el token no esté usado
    if (invitationToken.isUsed) {
      // Registrar intento fallido
      await recordAttempt(clientIP, 'invitation-token', false)
      return { success: false, action: 'error', error: 'token-ya-usado' }
    }

    // Marcar el token como usado y guardar user agent
    await prisma.invitationToken.update({
      where: { id: validatedToken },
      data: {
        isUsed: true,
        userAgent: userAgent
      }
    })

    // Generar JWT con hardening de seguridad
    const secret = new TextEncoder().encode(JWT_SECRET)
    const sessionToken = await new jose.SignJWT({
      tokenId: validatedToken,
      invitationId: invitationToken.invitation.id,
      // Agregar claims adicionales para mayor seguridad
      iss: SECURITY_CONFIG.JWT_ISSUER, // Issuer
      aud: SECURITY_CONFIG.JWT_INVITATION_AUDIENCE, // Audience
      sub: invitationToken.invitation.id, // Subject
      // Fingerprint del dispositivo para detectar cambios
      deviceFp: await generateDeviceFingerprint(userAgent),
      // Timestamp de creación para tracking
      createdAt: Date.now(),
      // Tipo de sesión para diferenciar de admin
      sessionType: 'invitation'
    })
      .setProtectedHeader({ 
        alg: SECURITY_CONFIG.JWT_ALGORITHM, // Algoritmo más fuerte
        typ: 'JWT',
        kid: 'wedding-v1' // Key ID para versioning
      })
      .setIssuedAt()
      .setNotBefore(new Date()) // No válido antes de ahora
      .setExpirationTime(`${SECURITY_CONFIG.INVITATION_SESSION_DURATION}s`)
      .setJti(crypto.randomUUID()) // JWT ID único
      .sign(secret)

    // Setear la cookie
    cookieStore.set('session', sessionToken, {
      httpOnly: true,
      secure: SECURITY_CONFIG.COOKIE_SECURE,
      sameSite: SECURITY_CONFIG.COOKIE_SAME_SITE,
      maxAge: SECURITY_CONFIG.INVITATION_SESSION_DURATION
    })

    // Registrar intento exitoso
    await recordAttempt(clientIP, 'invitation-token', true)
    
    return { 
      success: true, 
      action: 'authenticated'
    }
  } catch (error) {
    console.error('Error al procesar token:', error)
    return { success: false, action: 'error', error: 'error-procesando-token' }
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get('session')

    if (!session) {
      return { success: false, user: null }
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret')
    const { payload } = await jose.jwtVerify(session.value, secret, {
      issuer: 'wedding-app',
      audience: 'wedding-invitation',
      algorithms: ['HS512']
    })

    // Verificar claims adicionales de seguridad
    if (payload.iss !== 'wedding-app' || payload.aud !== 'wedding-invitation') {
      return { success: false, user: null }
    }

    // Validar el token usando la helper function
    const validation = await validateToken(payload.tokenId as string)
    
    if (!validation.valid || !validation.invitation) {
      return { success: false, user: null }
    }

    return { 
      success: true, 
      user: {
        invitationId: payload.invitationId,
        tokenId: payload.tokenId,
        guestName: validation.invitation.guestName,
        guestNickname: validation.invitation.guestNickname,
        maxGuests: validation.invitation.maxGuests,
        hasResponded: validation.invitation.hasResponded,
        isAttending: validation.invitation.isAttending,
        guestCount: validation.invitation.guestCount,
        respondedAt: validation.invitation.respondedAt
      }
    }
  } catch (error) {
    console.error('Error al obtener usuario actual:', error)
    return { success: false, user: null }
  }
}

// Importar y re-exportar el action protegido
import { updateInvitationResponse as protectedUpdateInvitationResponse } from './protected-invitations'

export const updateInvitationResponse = protectedUpdateInvitationResponse
