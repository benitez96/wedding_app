'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import * as jose from 'jose'
import { headers } from 'next/headers'
import { cookies } from 'next/headers'
import crypto from 'crypto'

// Función para generar fingerprint del dispositivo
async function generateDeviceFingerprint(userAgent: string): Promise<string> {
  const hash = crypto.createHash('sha256')
  hash.update(userAgent + process.env.JWT_SECRET || 'default-secret')
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

export async function getInvitations(searchTerm?: string) {
  try {
    const where = searchTerm ? {
      OR: [
        {
          guestName: {
            contains: searchTerm,
            mode: Prisma.QueryMode.insensitive
          }
        },
        {
          guestNickname: {
            contains: searchTerm,
            mode: Prisma.QueryMode.insensitive
          }
        }
      ]
    } : {}

    const invitations = await prisma.invitation.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    })
    return { success: true, data: invitations }
  } catch (error) {
    console.error('Error al obtener invitaciones:', error)
    return { success: false, error: 'Error al cargar las invitaciones' }
  }
}

export async function createInvitation(formData: FormData) {
  try {
    const guestName = formData.get('guestName') as string
    const guestNickname = formData.get('guestNickname') as string
    const guestPhone = formData.get('guestPhone') as string
    const maxGuests = parseInt(formData.get('maxGuests') as string)
    const hasResponded = formData.get('hasResponded') === 'true'
    const isAttending = formData.get('isAttending') === 'true'
    const guestCount = formData.get('guestCount') ? parseInt(formData.get('guestCount') as string) : null

    // Validaciones
    if (!guestName || !maxGuests) {
      return { success: false, error: 'Nombre del invitado y máximo de invitados son requeridos' }
    }

    // Validar guestCount si isAttending es true
    if (isAttending && (!guestCount || guestCount < 1 || guestCount > maxGuests)) {
      return { success: false, error: 'Número de asistentes debe estar entre 1 y el máximo permitido' }
    }

    const invitation = await prisma.invitation.create({
      data: {
        guestName,
        guestNickname: guestNickname || null,
        guestPhone: guestPhone || null,
        maxGuests: Number(maxGuests),
        hasResponded,
        isAttending: hasResponded ? isAttending : null,
        guestCount: hasResponded && isAttending ? guestCount : null,
        respondedAt: hasResponded ? new Date() : null
      }
    })

    revalidatePath('/backoffice/invitations')
    return { success: true, data: invitation }
  } catch (error) {
    console.error('Error al crear invitación:', error)
    return { success: false, error: 'Error al crear la invitación' }
  }
}

export async function updateInvitation(id: string, formData: FormData) {
  try {
    const guestName = formData.get('guestName') as string
    const guestNickname = formData.get('guestNickname') as string
    const guestPhone = formData.get('guestPhone') as string
    const maxGuests = parseInt(formData.get('maxGuests') as string)
    const hasResponded = formData.get('hasResponded') === 'true'
    const isAttending = formData.get('isAttending') === 'true'
    const guestCount = formData.get('guestCount') ? parseInt(formData.get('guestCount') as string) : null

    if (!guestName || !maxGuests) {
      return { success: false, error: 'Nombre del invitado y máximo de invitados son requeridos' }
    }

    // Validar guestCount si isAttending es true
    if (isAttending && (!guestCount || guestCount < 1 || guestCount > maxGuests)) {
      return { success: false, error: 'Número de asistentes debe estar entre 1 y el máximo permitido' }
    }

    const invitation = await prisma.invitation.update({
      where: { id },
      data: {
        guestName,
        guestNickname: guestNickname || null,
        guestPhone: guestPhone || null,
        maxGuests,
        hasResponded,
        isAttending: hasResponded ? isAttending : null,
        guestCount: hasResponded && isAttending ? guestCount : null,
        respondedAt: hasResponded ? new Date() : null
      }
    })

    revalidatePath('/backoffice/invitations')
    return { success: true, data: invitation }
  } catch (error) {
    console.error('Error al actualizar invitación:', error)
    return { success: false, error: 'Error al actualizar la invitación' }
  }
}

export async function deleteInvitation(id: string) {
  try {
    await prisma.invitation.delete({
      where: { id }
    })

    revalidatePath('/backoffice/invitations')
    return { success: true }
  } catch (error) {
    console.error('Error al eliminar invitación:', error)
    return { success: false, error: 'Error al eliminar la invitación' }
  }
}

export async function getInvitationWithTokens(id: string) {
  try {
    const invitation = await prisma.invitation.findUnique({
      where: { id },
      include: {
        tokens: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!invitation) {
      return { success: false, error: 'Invitación no encontrada' }
    }

    return { success: true, data: invitation }
  } catch (error) {
    console.error('Error al obtener invitación con tokens:', error)
    return { success: false, error: 'Error al cargar la invitación' }
  }
}

export async function getInvitationsStats() {
  try {
    const [
      total,
      pending,
      declined,
      confirmedGuests
    ] = await Promise.all([
      // Total de invitaciones
      prisma.invitation.count(),
      
      // Pendientes (no han respondido)
      prisma.invitation.count({
        where: {
          hasResponded: false
        }
      }),
      
      // No asistirán (respondieron pero no van a asistir)
      prisma.invitation.count({
        where: {
          hasResponded: true,
          isAttending: false
        }
      }),
      
      // Total de invitados confirmados (suma de guestCount)
      prisma.invitation.aggregate({
        where: {
          hasResponded: true,
          isAttending: true,
          guestCount: {
            not: null
          }
        },
        _sum: {
          guestCount: true
        }
      })
    ])

    return {
      success: true,
      data: {
        total,
        pending,
        confirmed: confirmedGuests._sum.guestCount || 0,
        declined
      }
    }
  } catch (error) {
    console.error('Error al obtener estadísticas de invitaciones:', error)
    return { success: false, error: 'Error al cargar las estadísticas' }
  }
}

// Función separada para estadísticas filtradas (por si se necesita en el futuro)
export async function getFilteredInvitationsStats(searchTerm: string) {
  try {
    const where = {
      OR: [
        {
          guestName: {
            contains: searchTerm,
            mode: Prisma.QueryMode.insensitive
          }
        },
        {
          guestNickname: {
            contains: searchTerm,
            mode: Prisma.QueryMode.insensitive
          }
        }
      ]
    }

    const [
      total,
      pending,
      confirmedInvitations,
      declined,
      confirmedGuests
    ] = await Promise.all([
      prisma.invitation.count({ where }),
      prisma.invitation.count({
        where: {
          ...where,
          hasResponded: false
        }
      }),
      prisma.invitation.count({
        where: {
          ...where,
          hasResponded: true,
          isAttending: true
        }
      }),
      prisma.invitation.count({
        where: {
          ...where,
          hasResponded: true,
          isAttending: false
        }
      }),
      prisma.invitation.aggregate({
        where: {
          ...where,
          hasResponded: true,
          isAttending: true,
          guestCount: {
            not: null
          }
        },
        _sum: {
          guestCount: true
        }
      })
    ])

    return {
      success: true,
      data: {
        total,
        pending,
        confirmed: confirmedGuests._sum.guestCount || 0,
        declined
      }
    }
  } catch (error) {
    console.error('Error al obtener estadísticas filtradas de invitaciones:', error)
    return { success: false, error: 'Error al cargar las estadísticas filtradas' }
  }
}

export async function createInvitationToken(invitationId: string) {
  try {
    // Verificar que la invitación existe
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId }
    })

    if (!invitation) {
      return { success: false, error: 'Invitación no encontrada' }
    }

    // Crear el token en la base de datos (el id será generado automáticamente como cuid)
    const invitationToken = await prisma.invitationToken.create({
      data: {
        invitationId
      }
    })

    revalidatePath('/backoffice/invitations')
    return { success: true, data: invitationToken }
  } catch (error) {
    console.error('Error al crear token de invitación:', error)
    return { success: false, error: 'Error al crear el token de invitación' }
  }
}

export async function revokeInvitationToken(tokenId: string) {
  try {
    const token = await prisma.invitationToken.update({
      where: { id: tokenId },
      data: { isActive: false }
    })

    revalidatePath('/backoffice/invitations')
    return { success: true, data: token }
  } catch (error) {
    console.error('Error al revocar token:', error)
    return { success: false, error: 'Error al revocar el token' }
  }
}

export async function reactivateInvitationToken(tokenId: string) {
  try {
    const token = await prisma.invitationToken.update({
      where: { id: tokenId },
      data: { isActive: true }
    })

    revalidatePath('/backoffice/invitations')
    return { success: true, data: token }
  } catch (error) {
    console.error('Error al reactivar token:', error)
    return { success: false, error: 'Error al reactivar el token' }
  }
}

export async function deleteInvitationToken(tokenId: string) {
  try {
    await prisma.invitationToken.delete({
      where: { id: tokenId }
    })

    revalidatePath('/backoffice/invitations')
    return { success: true }
  } catch (error) {
    console.error('Error al eliminar token:', error)
    return { success: false, error: 'Error al eliminar el token' }
  }
}

export async function processInvitationToken(token: string) {
  try {
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
    const invitationToken = await prisma.invitationToken.findUnique({
      where: { id: token },
      include: {
        invitation: true
      }
    })

    // Si el token no existe o está inactivo, retornar error
    if (!invitationToken || !invitationToken.isActive) {
      return { success: false, action: 'error', error: 'token-invalido' }
    }

    // Verificar que el token no esté usado
    if (invitationToken.isUsed) {
      return { success: false, action: 'error', error: 'token-ya-usado' }
    }

    // Marcar el token como usado y guardar user agent
    await prisma.invitationToken.update({
      where: { id: token },
      data: {
        isUsed: true,
        userAgent: userAgent
      }
    })

    // Generar JWT con hardening de seguridad
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret')
    const sessionToken = await new jose.SignJWT({
      tokenId: token,
      invitationId: invitationToken.invitation.id,
      // Agregar claims adicionales para mayor seguridad
      iss: 'wedding-app', // Issuer
      aud: 'wedding-invitation', // Audience
      sub: invitationToken.invitation.id, // Subject
      // Fingerprint del dispositivo para detectar cambios
      deviceFp: await generateDeviceFingerprint(userAgent),
      // Timestamp de creación para tracking
      createdAt: Date.now()
    })
      .setProtectedHeader({ 
        alg: 'HS512', // Algoritmo más fuerte
        typ: 'JWT',
        kid: 'wedding-v1' // Key ID para versioning
      })
      .setIssuedAt()
      .setNotBefore(new Date()) // No válido antes de ahora
      .setExpirationTime('180d')
      .setJti(crypto.randomUUID()) // JWT ID único
      .sign(secret)

    // Setear la cookie
    cookieStore.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 180 * 24 * 60 * 60 // 180 días
    })

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

export async function updateInvitationResponse(tokenId: string, data: {
  isAttending: boolean
  guestCount?: number | null
  message?: string | null
}) {
  try {
    // Validar el token usando la helper function
    const validation = await validateToken(tokenId)
    
    if (!validation.valid || !validation.invitation) {
      return { success: false, error: validation.error }
    }

    // Validar guestCount si isAttending es true
    if (data.isAttending && (!data.guestCount || data.guestCount < 1 || data.guestCount > validation.invitation.maxGuests)) {
      return { success: false, error: 'Número de asistentes debe estar entre 1 y el máximo permitido' }
    }

    // Actualizar la invitación
    const updatedInvitation = await prisma.invitation.update({
      where: { id: validation.invitation.id },
      data: {
        hasResponded: true,
        isAttending: data.isAttending,
        guestCount: data.isAttending ? data.guestCount : null,
        respondedAt: new Date()
      }
    })

    revalidatePath('/')
    return { success: true, data: updatedInvitation }
  } catch (error) {
    console.error('Error al actualizar respuesta de invitación:', error)
    return { success: false, error: 'Error al procesar la respuesta' }
  }
}
