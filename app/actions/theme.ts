"use server";

import { revalidatePath } from "next/cache";
import { THEME_IDS, type ThemeId, getThemeById } from "@/types/theme";
import { withEventAuth } from "@/lib/server-auth";
import prisma from "@/lib/prisma";
import { logError } from "@/lib/logger";
import { themeIdSchema } from "@/app/actions/schemas";

interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Obtiene el theme activo del evento actual del usuario
 */
export const getActiveTheme = withEventAuth(
  async (ctx): Promise<ActionResult<ThemeId>> => {
    try {
      const event = await prisma.event.findUnique({
        where: { id: ctx.event.eventId },
        select: { activeTheme: true },
      });

      const themeId = (event?.activeTheme ?? THEME_IDS.CLASSIC) as ThemeId;

      return {
        success: true,
        data: themeId,
      };
    } catch (error) {
      logError("getActiveTheme", error);
      return {
        success: true,
        data: THEME_IDS.CLASSIC,
      };
    }
  },
);

/**
 * Actualiza el theme activo del evento actual
 */
export const updateActiveTheme = withEventAuth(
  async (ctx, themeId: ThemeId): Promise<ActionResult> => {
    try {
      // Validar themeId
      const validated = themeIdSchema.safeParse(themeId);

      if (!validated.success) {
        return {
          success: false,
          error: "Theme ID inválido",
        };
      }

      // Verificar que el theme existe
      const theme = getThemeById(validated.data);
      if (!theme) {
        return {
          success: false,
          error: "Theme no encontrado",
        };
      }

      // Persistir en el evento
      await prisma.event.update({
        where: { id: ctx.event.eventId },
        data: { activeTheme: validated.data },
      });

      // Revalidar para aplicar el theme
      revalidatePath("/", "layout");

      return { success: true };
    } catch (error) {
      logError("updateActiveTheme", error);
      return {
        success: false,
        error: "Error al actualizar el theme",
      };
    }
  },
);

/**
 * Obtiene el theme activo de un evento por su ID (para páginas públicas sin auth)
 */
export async function getEventTheme(eventId: string): Promise<ThemeId> {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { activeTheme: true },
    });

    return (event?.activeTheme ?? THEME_IDS.CLASSIC) as ThemeId;
  } catch {
    return THEME_IDS.CLASSIC;
  }
}
