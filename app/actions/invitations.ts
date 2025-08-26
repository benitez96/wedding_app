'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import * as jose from 'jose'
import { headers } from 'next/headers'
import { cookies } from 'next/headers'

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
  "use server"
  try {
    // Obtener user agent para información del dispositivo
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || 'Unknown'

    // Buscar el token en la base de datos
    const invitationToken = await prisma.invitationToken.findUnique({
      where: { id: token },
      include: {
        invitation: true
      }
    })

    // Si el token no existe o está inactivo, retornar error
    if (!invitationToken || !invitationToken.isActive) {
      return { success: false, error: 'token-invalido' }
    }

    // Verificar que el token no esté usado
    if (invitationToken.isUsed) {
      return { success: false, error: 'token-ya-usado' }
    }

    // Marcar el token como usado y guardar user agent
    await prisma.invitationToken.update({
      where: { id: token },
      data: {
        isUsed: true,
        userAgent: userAgent
      }
    })

    // Generar JWT simple solo con tokenId e invitationId
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret')
    const sessionToken = await new jose.SignJWT({
      tokenId: token,
      invitationId: invitationToken.invitation.id
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret)

    return { 
      success: true, 
      cookie: sessionToken 
    }
  } catch (error) {
    console.error('Error al procesar token:', error)
    return { success: false, error: 'error-procesando-token' }
  }
}
