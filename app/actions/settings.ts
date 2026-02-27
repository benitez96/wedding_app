"use server";

import { revalidatePath } from "next/cache";
import { updateEventSettingsSchema } from "./schemas/event-settings";
import { withEventAuth } from "@/lib/server-auth";
import prisma from "@/lib/prisma";
import { CONFIGURATION_KEYS } from "@/types/configuration";
import { logError } from "@/lib/logger";
import { PERMISSIONS } from "@/lib/permissions";
import { generateUniqueSlug } from "@/lib/slug";

interface ActionState {
  success: boolean;
  error?: string;
  message?: string;
}

export const updateEventSettings = withEventAuth(
  async (
    ctx,
    prevState: ActionState | null,
    formData: FormData,
  ): Promise<ActionState> => {
    try {
      const eventId = ctx.event.eventId;

      // Parsear y validar con Zod
      const parseResult = updateEventSettingsSchema.safeParse({
        eventName: formData.get("eventName"),
        eventDescription: formData.get("eventDescription"),
        checkinStrategy: formData.get("checkinStrategy"),
      });

      // Si la validación falla, retornar el primer error
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        return {
          success: false,
          error: firstError.message,
        };
      }

      const { eventName, eventDescription, checkinStrategy } = parseResult.data;

      // Obtener evento actual para verificar si cambió el nombre
      const currentEvent = await prisma.event.findUnique({
        where: { id: eventId },
        select: { name: true, slug: true },
      });

      if (!currentEvent) {
        return { success: false, error: "Evento no encontrado" };
      }

      const nameChanged = currentEvent.name !== eventName;

      // Regenerar slug si cambió el nombre
      let newSlug = currentEvent.slug;
      if (nameChanged) {
        try {
          newSlug = await generateUniqueSlug(eventName, prisma, eventId);
        } catch (error) {
          // Si generateSlug lanza error (ej: solo emojis), retornar error amigable
          return {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Error generando identificador único para el evento",
          };
        }
      }

      // Actualizar información del evento
      await prisma.event.update({
        where: { id: eventId },
        data: {
          name: eventName,
          slug: newSlug,
          description: eventDescription,
        },
      });

      // Check-in strategy configuration (only strategy type stored in DB)
      await prisma.configuration.upsert({
        where: {
          eventId_key: {
            eventId,
            key: CONFIGURATION_KEYS.CHECKIN_STRATEGY,
          },
        },
        update: { value: checkinStrategy || "HYBRID_SMART" },
        create: {
          eventId,
          key: CONFIGURATION_KEYS.CHECKIN_STRATEGY,
          value: checkinStrategy || "HYBRID_SMART",
          description:
            "Check-in strategy: IDB_FIRST, SERVER_FIRST, HYBRID_SMART",
        },
      });

      // Revalidate
      revalidatePath("/backoffice/settings");
      revalidatePath("/", "layout");

      return {
        success: true,
        message: "Configuraciones guardadas exitosamente",
      };
    } catch (error) {
      logError("Error actualizando configuraciones del evento", error);
      return {
        success: false,
        error: "Error al guardar las configuraciones. Intenta nuevamente.",
      };
    }
  },
  PERMISSIONS.SETTINGS_EDIT,
);

export const getEventSettings = withEventAuth(async (ctx) => {
  try {
    const [event, configurations] = await Promise.all([
      prisma.event.findUnique({
        where: { id: ctx.event.eventId },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
        },
      }),
      prisma.configuration.findMany({
        where: { eventId: ctx.event.eventId },
        orderBy: { key: "asc" },
      }),
    ]);

    if (!event) {
      throw new Error("Evento no encontrado");
    }

    return { event, configurations };
  } catch (error) {
    logError("Error obteniendo configuraciones del evento", error);
    throw error;
  }
}, PERMISSIONS.SETTINGS_VIEW);

/**
 * Eliminar evento (solo owner)
 * Elimina el evento y todas sus relaciones
 * Retorna los eventos restantes para que el cliente decida la navegación
 */
export async function deleteEvent(eventId: string): Promise<{
  success: boolean;
  error?: string;
  message?: string;
  remainingEvents?: Array<{ id: string; name: string }>;
}> {
  try {
    // Verificar autenticación y permisos usando withEventAuth manualmente
    const { verifyUserAuth } = await import("@/lib/server-auth");
    const authResult = await verifyUserAuth();

    if (!authResult.success || !authResult.user) {
      return { success: false, error: "No autorizado" };
    }

    const userId = authResult.user.id;

    // Verificar que el usuario sea el owner del evento
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { ownerId: true, name: true },
    });

    if (!event) {
      return { success: false, error: "Evento no encontrado" };
    }

    if (event.ownerId !== userId) {
      return {
        success: false,
        error: "Solo el propietario puede eliminar el evento",
      };
    }

    // Eliminar el evento (cascade elimina todas las relaciones)
    await prisma.event.delete({
      where: { id: eventId },
    });

    // Obtener eventos restantes del usuario
    const { getUserAccessibleEvents } = await import(
      "@/lib/event-context-prisma"
    );
    const accessibleEvents = await getUserAccessibleEvents(userId);

    const remainingEvents = accessibleEvents.map((e) => ({
      id: e.id,
      name: e.name,
    }));

    // Revalidate
    revalidatePath("/backoffice");
    revalidatePath("/", "layout");

    return {
      success: true,
      message: "Evento eliminado exitosamente",
      remainingEvents,
    };
  } catch (error) {
    logError("Error eliminando evento", error);
    return {
      success: false,
      error: "Error al eliminar el evento. Intenta nuevamente.",
    };
  }
}
