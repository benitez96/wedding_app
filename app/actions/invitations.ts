'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'

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
