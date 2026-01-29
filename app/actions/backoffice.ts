"use server";

import { withEventAuth } from "@/lib/server-auth";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";
import { PERMISSIONS } from "@/lib/permissions";

// Action protegido para obtener estadísticas (scoped por evento)
export const getAdminStats = withEventAuth(async (ctx) => {
  const eventId = ctx.event.eventId;

  const [
    totalInvitations,
    respondedInvitations,
    attendingInvitations,
    notAttendingInvitations,
  ] = await Promise.all([
    prisma.invitation.count({ where: { eventId } }),
    prisma.invitation.count({ where: { eventId, hasResponded: true } }),
    prisma.invitation.count({ where: { eventId, isAttending: true } }),
    prisma.invitation.count({ where: { eventId, isAttending: false } }),
  ]);

  return {
    totalInvitations,
    respondedInvitations,
    attendingInvitations,
    notAttendingInvitations,
    responseRate:
      totalInvitations > 0
        ? Math.round((respondedInvitations / totalInvitations) * 100)
        : 0,
  };
});

// Action protegido para obtener todas las invitaciones (scoped por evento)
export const getAllInvitations = withEventAuth(
  async (ctx) => {
    const invitations = await prisma.invitation.findMany({
      where: { eventId: ctx.event.eventId },
      include: {
        tokens: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return invitations;
  },
  PERMISSIONS.GUESTS_VIEW,
);

// Action protegido para eliminar una invitación (scoped por evento)
export const deleteInvitation = withEventAuth(
  async (ctx, invitationId: string) => {
    try {
      await prisma.invitation.delete({
        where: { id: invitationId, eventId: ctx.event.eventId },
      });

      return { success: true };
    } catch (error) {
      console.error("Error eliminando invitación:", error);
      return { success: false, error: "Error al eliminar la invitación" };
    }
  },
  PERMISSIONS.GUESTS_DELETE,
);

// Action protegido para actualizar una invitación (scoped por evento)
export const updateInvitation = withEventAuth(
  async (
    ctx,
    invitationId: string,
    data: {
      guestName?: string;
      guestNickname?: string;
      guestPhone?: string;
      maxGuests?: number;
    },
  ) => {
    try {
      const invitation = await prisma.invitation.update({
        where: { id: invitationId, eventId: ctx.event.eventId },
        data: data,
      });

      return { success: true, invitation };
    } catch (error) {
      console.error("Error actualizando invitación:", error);
      return { success: false, error: "Error al actualizar la invitación" };
    }
  },
  PERMISSIONS.GUESTS_EDIT,
);

export const exportConfirmedGuestsToExcel = withEventAuth(
  async (ctx) => {
    try {
      const confirmedInvitations = await prisma.invitation.findMany({
        where: {
          eventId: ctx.event.eventId,
          isAttending: true,
          hasResponded: true,
        },
        select: {
          guestName: true,
          guestCount: true,
        },
        orderBy: {
          guestName: "asc",
        },
      });

      const excelData = confirmedInvitations.map((invitation) => ({
        Invitado: invitation.guestName,
        Confirmados: invitation.guestCount || 1,
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      const columnWidths = [
        { wch: 30 },
        { wch: 15 },
      ];
      worksheet["!cols"] = columnWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, "Invitados Confirmados");

      const excelBuffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
      });

      return {
        success: true,
        data: excelBuffer,
        filename: `invitados-confirmados-${new Date().toISOString().split("T")[0]}.xlsx`,
      };
    } catch (error) {
      console.error("Error al exportar invitados confirmados:", error);
      return {
        success: false,
        error: "Error al generar el archivo Excel",
      };
    }
  },
  PERMISSIONS.GUESTS_VIEW,
);
