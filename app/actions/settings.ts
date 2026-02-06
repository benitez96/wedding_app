"use server";

import { revalidatePath } from "next/cache";
import { withEventAuth } from "@/lib/server-auth";
import prisma from "@/lib/prisma";
import { CONFIGURATION_KEYS } from "@/types/configuration";
import { logError } from "@/lib/logger";
import { PERMISSIONS } from "@/lib/permissions";

interface ActionState {
  success: boolean;
  error?: string;
  message?: string;
}

export const updateConfigurations = withEventAuth(
  async (
    ctx,
    prevState: ActionState | null,
    formData: FormData,
  ): Promise<ActionState> => {
    try {
      const eventId = ctx.event.eventId;

      // Obtener valores del formulario
      const photoUploadUrl = formData.get("photoUploadUrl") as string;
      const weddingDateTime = formData.get("weddingDateTime") as string;
      const remindRestingDays = formData.get("remindRestingDays") as string;

      // Validación de campo requerido
      if (!weddingDateTime) {
        return { success: false, error: "La fecha y hora son requeridas" };
      }

      // Validar días de recordatorio
      const remindDaysNum = Number.parseInt(remindRestingDays || "40", 10);
      if (
        Number.isNaN(remindDaysNum) ||
        remindDaysNum < 1 ||
        remindDaysNum > 365
      ) {
        return {
          success: false,
          error: "Los días de recordatorio deben estar entre 1 y 365",
        };
      }

      // Validar formato datetime-local (YYYY-MM-DDTHH:mm)
      const dateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
      if (!dateTimePattern.test(weddingDateTime)) {
        return { success: false, error: "Formato de fecha inválido" };
      }

      const normalizedDateTime = weddingDateTime;

      // Actualizar configuraciones en la BD (scoped por evento)
      await prisma.configuration.upsert({
        where: {
          eventId_key: { eventId, key: CONFIGURATION_KEYS.PHOTO_UPLOAD_URL },
        },
        update: { value: photoUploadUrl || "" },
        create: {
          eventId,
          key: CONFIGURATION_KEYS.PHOTO_UPLOAD_URL,
          value: photoUploadUrl || "",
          description: "URL donde los invitados pueden subir fotos y videos",
        },
      });

      await prisma.configuration.upsert({
        where: {
          eventId_key: { eventId, key: CONFIGURATION_KEYS.WEDDING_DATE },
        },
        update: { value: normalizedDateTime },
        create: {
          eventId,
          key: CONFIGURATION_KEYS.WEDDING_DATE,
          value: normalizedDateTime,
          description: "Fecha y hora de la boda en formato ISO 8601",
        },
      });

      await prisma.configuration.upsert({
        where: {
          eventId_key: {
            eventId,
            key: CONFIGURATION_KEYS.REMIND_RESTING_DAYS,
          },
        },
        update: { value: remindDaysNum.toString() },
        create: {
          eventId,
          key: CONFIGURATION_KEYS.REMIND_RESTING_DAYS,
          value: remindDaysNum.toString(),
          description:
            "Días antes de la boda para mostrar recordatorio de confirmación",
        },
      });

      // Limpiar cache de configuraciones
      const { clearConfigurationCache } = await import(
        "@/lib/get-configurations"
      );
      clearConfigurationCache();

      // Revalidar
      revalidatePath("/backoffice/settings");
      revalidatePath("/", "layout");

      return {
        success: true,
        message: "Configuraciones guardadas exitosamente",
      };
    } catch (error) {
      logError("Error actualizando configuraciones", error);
      return {
        success: false,
        error: "Error al guardar las configuraciones. Intenta nuevamente.",
      };
    }
  },
  PERMISSIONS.SETTINGS_EDIT,
);

export const getConfigurations = withEventAuth(async (ctx) => {
  try {
    const configurations = await prisma.configuration.findMany({
      where: { eventId: ctx.event.eventId },
      orderBy: { key: "asc" },
    });

    return configurations;
  } catch (error) {
    logError("Error obteniendo configuraciones", error);
    return [];
  }
}, PERMISSIONS.SETTINGS_VIEW);
