'use server'

import { withAdminAuth, AdminUser } from '@/lib/admin-auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@/app/generated/prisma'
import { invitationSchema, invitationResponseSchema, searchSchema, validateAndSanitize, sanitizeString } from '@/utils/validation'
import { validateCSRFToken } from '@/lib/csrf'

// Action protegido para obtener invitaciones
export const getInvitations = withAdminAuth(async (user: AdminUser, searchTerm?: string) => {
  try {
    // Validar término de búsqueda
    if (searchTerm) {
      const validation = validateAndSanitize(searchSchema, { searchTerm })
      if (!validation.success) {
        return { success: false, error: 'Término de búsqueda inválido' }
      }
      const validatedData = validation as { success: true; data: { searchTerm?: string } }
      searchTerm = sanitizeString(validatedData.data.searchTerm || '')
    }
    
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
})

// Action protegido para crear invitación
export const createInvitation = withAdminAuth(async (user: AdminUser, formData: FormData) => {
  try {
    // Validar CSRF token
    const csrfToken = formData.get('_csrf') as string
    if (csrfToken && !(await validateCSRFToken(csrfToken))) {
      return { success: false, error: 'Token CSRF inválido' }
    }

    const guestName = formData.get('guestName') as string
    const guestNickname = formData.get('guestNickname') as string
    const guestPhone = formData.get('guestPhone') as string
    const maxGuests = parseInt(formData.get('maxGuests') as string)
    const hasResponded = formData.get('hasResponded') === 'true'
    const isAttending = formData.get('isAttending') === 'true'
    const guestCount = formData.get('guestCount') ? parseInt(formData.get('guestCount') as string) : null

    // Validar y sanitizar datos
    const validation = validateAndSanitize(invitationSchema, {
      guestName,
      guestNickname,
      guestPhone,
      maxGuests,
      hasResponded,
      isAttending,
      guestCount
    })

    if (!validation.success) {
      return { success: false, error: validation.error }
    }

    const { data } = validation as { success: true; data: any }

    const invitation = await prisma.invitation.create({
      data: {
        guestName: data.guestName,
        guestNickname: data.guestNickname || null,
        guestPhone: data.guestPhone || null,
        maxGuests: data.maxGuests,
        hasResponded: data.hasResponded || false,
        isAttending: data.hasResponded ? data.isAttending : null,
        guestCount: data.hasResponded && data.isAttending ? data.guestCount : null,
        respondedAt: data.hasResponded ? new Date() : null
      }
    })

    revalidatePath('/backoffice/invitations')
    return { success: true, data: invitation }
  } catch (error) {
    console.error('Error al crear invitación:', error)
    return { success: false, error: 'Error al crear la invitación' }
  }
})

// Action protegido para actualizar invitación
export const updateInvitation = withAdminAuth(async (user: AdminUser, id: string, formData: FormData) => {
  try {
    // Validar CSRF token
    const csrfToken = formData.get('_csrf') as string
    if (csrfToken && !(await validateCSRFToken(csrfToken))) {
      return { success: false, error: 'Token CSRF inválido' }
    }

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
})

// Action protegido para eliminar invitación
export const deleteInvitation = withAdminAuth(async (user: AdminUser, id: string, csrfToken?: string) => {
  try {
    // Validar CSRF token
    if (csrfToken && !(await validateCSRFToken(csrfToken))) {
      return { success: false, error: 'Token CSRF inválido' }
    }

    await prisma.invitation.delete({
      where: { id }
    })

    revalidatePath('/backoffice/invitations')
    return { success: true }
  } catch (error) {
    console.error('Error al eliminar invitación:', error)
    return { success: false, error: 'Error al eliminar la invitación' }
  }
})

// Action protegido para obtener invitación con tokens
export const getInvitationWithTokens = withAdminAuth(async (user: AdminUser, id: string) => {
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
})

// Action protegido para obtener estadísticas de invitaciones
export const getInvitationsStats = withAdminAuth(async (user: AdminUser) => {
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
})

// Action protegido para crear token de invitación
export const createInvitationToken = withAdminAuth(async (user: AdminUser, invitationId: string, csrfToken?: string) => {
  try {
    // Validar CSRF token
    if (csrfToken && !(await validateCSRFToken(csrfToken))) {
      return { success: false, error: 'Token CSRF inválido' }
    }

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
})

// Action protegido para revocar token de invitación
export const revokeInvitationToken = withAdminAuth(async (user: AdminUser, tokenId: string, csrfToken?: string) => {
  try {
    // Validar CSRF token
    if (csrfToken && !(await validateCSRFToken(csrfToken))) {
      return { success: false, error: 'Token CSRF inválido' }
    }

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
})

// Action protegido para reactivar token de invitación
export const reactivateInvitationToken = withAdminAuth(async (user: AdminUser, tokenId: string, csrfToken?: string) => {
  try {
    // Validar CSRF token
    if (csrfToken && !(await validateCSRFToken(csrfToken))) {
      return { success: false, error: 'Token CSRF inválido' }
    }

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
})

// Action protegido para eliminar token de invitación
export const deleteInvitationToken = withAdminAuth(async (user: AdminUser, tokenId: string, csrfToken?: string) => {
  try {
    // Validar CSRF token
    if (csrfToken && !(await validateCSRFToken(csrfToken))) {
      return { success: false, error: 'Token CSRF inválido' }
    }

    await prisma.invitationToken.delete({
      where: { id: tokenId }
    })

    revalidatePath('/backoffice/invitations')
    return { success: true }
  } catch (error) {
    console.error('Error al eliminar token:', error)
    return { success: false, error: 'Error al eliminar el token' }
  }
})
