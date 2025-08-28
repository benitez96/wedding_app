'use server'

import { withInvitationAuth, InvitationUser } from '@/lib/invitation-auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { validateCSRFToken } from '@/lib/csrf'

// Action protegido para actualizar respuesta de invitación
export const updateInvitationResponse = withInvitationAuth(async (user: InvitationUser, data: {
  isAttending: boolean
  guestCount?: number | null
  message?: string | null
  csrfToken?: string
}) => {
  try {
    // Validar CSRF token
    if (data.csrfToken && !(await validateCSRFToken(data.csrfToken))) {
      return { success: false, error: 'Token CSRF inválido' }
    }

    // Validar guestCount si isAttending es true
    if (data.isAttending && (!data.guestCount || data.guestCount < 1 || data.guestCount > user.maxGuests)) {
      return { success: false, error: 'Número de asistentes debe estar entre 1 y el máximo permitido' }
    }

    // Actualizar la invitación
    const updatedInvitation = await prisma.invitation.update({
      where: { id: user.invitationId },
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
})

// Action protegido para subir fotos (cuando se implemente)
export const uploadPhoto = withInvitationAuth(async (user: InvitationUser, formData: FormData) => {
  try {
    // Validar CSRF token
    const csrfToken = formData.get('_csrf') as string
    if (csrfToken && !(await validateCSRFToken(csrfToken))) {
      return { success: false, error: 'Token CSRF inválido' }
    }

    // TODO: Implementar lógica de subida de fotos
    // Por ahora solo retornamos un placeholder
    
    return { 
      success: true, 
      message: 'Función de subida de fotos en desarrollo',
      uploadedBy: user.guestName
    }
  } catch (error) {
    console.error('Error al subir foto:', error)
    return { success: false, error: 'Error al subir la foto' }
  }
})

// Action protegido para enviar mensajes (cuando se implemente)
export const sendMessage = withInvitationAuth(async (user: InvitationUser, data: {
  message: string
  type?: 'wish' | 'memory' | 'advice'
  csrfToken?: string
}) => {
  try {
    // Validar CSRF token
    if (data.csrfToken && !(await validateCSRFToken(data.csrfToken))) {
      return { success: false, error: 'Token CSRF inválido' }
    }

    // TODO: Implementar lógica de envío de mensajes
    // Por ahora solo retornamos un placeholder
    
    return { 
      success: true, 
      message: 'Mensaje enviado correctamente',
      sentBy: user.guestName,
      messageType: data.type || 'wish'
    }
  } catch (error) {
    console.error('Error al enviar mensaje:', error)
    return { success: false, error: 'Error al enviar el mensaje' }
  }
})

// Action protegido para obtener datos del usuario actual
export const getCurrentUserData = withInvitationAuth(async (user: InvitationUser) => {
  try {
    // Obtener datos actualizados de la invitación
    const invitation = await prisma.invitation.findUnique({
      where: { id: user.invitationId }
    })

    if (!invitation) {
      return { success: false, error: 'Invitación no encontrada' }
    }

    return { 
      success: true, 
      user: {
        invitationId: invitation.id,
        tokenId: user.tokenId,
        guestName: invitation.guestName,
        guestNickname: invitation.guestNickname,
        maxGuests: invitation.maxGuests,
        hasResponded: invitation.hasResponded,
        isAttending: invitation.isAttending,
        guestCount: invitation.guestCount,
        respondedAt: invitation.respondedAt
      }
    }
  } catch (error) {
    console.error('Error al obtener datos del usuario:', error)
    return { success: false, error: 'Error al obtener datos del usuario' }
  }
})
