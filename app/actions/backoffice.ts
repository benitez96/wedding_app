"use server";

import { withEventAuth } from "@/lib/server-auth";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";
import { PERMISSIONS } from "@/lib/permissions";
import { logError } from "@/lib/logger";

export const exportConfirmedGuestsToExcel = withEventAuth(async (ctx) => {
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

    const columnWidths = [{ wch: 30 }, { wch: 15 }];
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
    logError("Error al exportar invitados confirmados", error);
    return {
      success: false,
      error: "Error al generar el archivo Excel",
    };
  }
}, PERMISSIONS.GUESTS_VIEW);
