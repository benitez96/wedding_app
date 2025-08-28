'use server'

import { withAdminAuth, AdminUser } from '@/lib/admin-auth'
import prisma from '@/lib/prisma'
import * as XLSX from 'xlsx'

// Ejemplo de action protegido para obtener estadísticas
export const getAdminStats = withAdminAuth(async (user: AdminUser) => {
  const [
    totalInvitations,
    respondedInvitations,
    attendingInvitations,
    notAttendingInvitations
  ] = await Promise.all([
    prisma.invitation.count(),
    prisma.invitation.count({ where: { hasResponded: true } }),
    prisma.invitation.count({ where: { isAttending: true } }),
    prisma.invitation.count({ where: { isAttending: false } })
  ])

  return {
    totalInvitations,
    respondedInvitations,
    attendingInvitations,
    notAttendingInvitations,
    responseRate: totalInvitations > 0 ? Math.round((respondedInvitations / totalInvitations) * 100) : 0
  }
})

// Ejemplo de action protegido para obtener todas las invitaciones
export const getAllInvitations = withAdminAuth(async (user: AdminUser) => {
  const invitations = await prisma.invitation.findMany({
    include: {
      tokens: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return invitations
})

// Ejemplo de action protegido para eliminar una invitación
export const deleteInvitation = withAdminAuth(async (user: AdminUser, invitationId: string) => {
  try {
    await prisma.invitation.delete({
      where: { id: invitationId }
    })

    return { success: true }
  } catch (error) {
    console.error('Error eliminando invitación:', error)
    return { success: false, error: 'Error al eliminar la invitación' }
  }
})

// Ejemplo de action protegido para actualizar una invitación
export const updateInvitation = withAdminAuth(async (
  user: AdminUser, 
  invitationId: string, 
  data: {
    guestName?: string
    guestNickname?: string
    guestPhone?: string
    maxGuests?: number
  }
) => {
  try {
    const invitation = await prisma.invitation.update({
      where: { id: invitationId },
      data
    })

    return { success: true, invitation }
  } catch (error) {
    console.error('Error actualizando invitación:', error)
    return { success: false, error: 'Error al actualizar la invitación' }
  }
})

export const exportConfirmedGuestsToExcel = withAdminAuth(async (user: AdminUser) => {
  try {
    // Obtener todas las invitaciones confirmadas
    const confirmedInvitations = await prisma.invitation.findMany({
      where: {
        isAttending: true,
        hasResponded: true
      },
      select: {
        guestName: true,
        guestCount: true
      },
      orderBy: {
        guestName: 'asc'
      }
    })

    // Preparar los datos para el Excel
    const excelData = confirmedInvitations.map(invitation => ({
      'Invitado': invitation.guestName,
      'Confirmados': invitation.guestCount || 1
    }))

    // Crear el workbook y worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // Ajustar el ancho de las columnas
    const columnWidths = [
      { wch: 30 }, // Invitado
      { wch: 15 }  // Confirmados
    ]
    worksheet['!cols'] = columnWidths

    // Agregar el worksheet al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Invitados Confirmados')

    // Generar el buffer del archivo
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    return {
      success: true,
      data: excelBuffer,
      filename: `invitados-confirmados-${new Date().toISOString().split('T')[0]}.xlsx`
    }
  } catch (error) {
    console.error('Error al exportar invitados confirmados:', error)
    return {
      success: false,
      error: 'Error al generar el archivo Excel'
    }
  }
})
