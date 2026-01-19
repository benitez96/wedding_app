"use server";

import { revalidatePath } from "next/cache";
import { verifyAdminAuth } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";
import { CONFIGURATION_KEYS } from "@/types/configuration";

interface ActionState {
  success: boolean;
  error?: string;
  message?: string;
}

export async function updateConfigurations(
  prevState: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  try {
    // Verificar autenticación de admin
    const authResult = await verifyAdminAuth();
    if (!authResult.success) {
      return { success: false, error: "No autorizado" };
    }

    // Obtener valores del formulario
    const photoUploadUrl = formData.get("photoUploadUrl") as string;
    const weddingDateTime = formData.get("weddingDateTime") as string; // ISO 8601
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
    // El input datetime-local envía formato sin timezone: "2026-02-14T19:00"
    // Lo guardamos tal cual para mantener la hora local seleccionada
    const dateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
    if (!dateTimePattern.test(weddingDateTime)) {
      return { success: false, error: "Formato de fecha inválido" };
    }

    // Guardamos el string tal cual (hora local sin timezone)
    const normalizedDateTime = weddingDateTime;

    // Actualizar configuraciones en la BD
    await prisma.configuration.upsert({
      where: { key: CONFIGURATION_KEYS.PHOTO_UPLOAD_URL },
      update: { value: photoUploadUrl || "" },
      create: {
        key: CONFIGURATION_KEYS.PHOTO_UPLOAD_URL,
        value: photoUploadUrl || "",
        description: "URL donde los invitados pueden subir fotos y videos",
      },
    });

    await prisma.configuration.upsert({
      where: { key: CONFIGURATION_KEYS.WEDDING_DATE },
      update: { value: normalizedDateTime },
      create: {
        key: CONFIGURATION_KEYS.WEDDING_DATE,
        value: normalizedDateTime,
        description: "Fecha y hora de la boda en formato ISO 8601 (UTC)",
      },
    });

    await prisma.configuration.upsert({
      where: { key: CONFIGURATION_KEYS.REMIND_RESTING_DAYS },
      update: { value: remindDaysNum.toString() },
      create: {
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

    // Revalidar todas las páginas que usan estas configuraciones
    revalidatePath("/backoffice/settings");
    revalidatePath("/", "layout"); // Revalida toda la app pública

    return {
      success: true,
      message: "Configuraciones guardadas exitosamente",
    };
  } catch (error) {
    console.error("Error actualizando configuraciones:", error);
    return {
      success: false,
      error: "Error al guardar las configuraciones. Intenta nuevamente.",
    };
  }
}

export async function getConfigurations() {
  try {
    // Verificar autenticación de admin
    const authResult = await verifyAdminAuth();
    if (!authResult.success) {
      throw new Error("No autorizado");
    }

    // Obtener todas las configuraciones
    const configurations = await prisma.configuration.findMany({
      orderBy: { key: "asc" },
    });

    return configurations;
  } catch (error) {
    console.error("Error obteniendo configuraciones:", error);
    return [];
  }
}
