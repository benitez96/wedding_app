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

    // Validaciones
    if (!guestName || !maxGuests) {
      return { success: false, error: 'Nombre del invitado y máximo de invitados son requeridos' }
    }

    const invitation = await prisma.invitation.create({
      data: {
        guestName,
        guestNickname: guestNickname || null,
        guestPhone: guestPhone || null,
        maxGuests: Number(maxGuests)
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

    if (!guestName || !maxGuests) {
      return { success: false, error: 'Nombre del invitado y máximo de invitados son requeridos' }
    }

    const invitation = await prisma.invitation.update({
      where: { id },
      data: {
        guestName,
        guestNickname: guestNickname || null,
        guestPhone: guestPhone || null,
        maxGuests
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
