"use server";

import { revalidatePath } from "next/cache";
import {
  THEME_IDS,
  type ThemeId,
  type CustomThemeColors,
  DEFAULT_CUSTOM_THEME_COLORS,
  getThemeById,
  isPredefinedTheme,
} from "@/types/theme";
import { withEventAuth } from "@/lib/server-auth";
import prisma from "@/lib/prisma";
import { logError } from "@/lib/logger";
import { themeIdSchema, customThemeColorsSchema } from "@/app/actions/schemas";

interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// ACTIVE THEME
// ============================================================================

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
 * Actualiza el theme activo del evento actual.
 * Solo acepta IDs de themes predefinidos (para custom usar updateCustomThemeColors).
 */
export const updateActiveTheme = withEventAuth(
  async (ctx, themeId: ThemeId): Promise<ActionResult> => {
    try {
      const validated = themeIdSchema.safeParse(themeId);

      if (!validated.success) {
        return {
          success: false,
          error: "Theme ID inválido",
        };
      }

      // Para themes predefinidos, verificar que existan en el catálogo
      if (isPredefinedTheme(validated.data)) {
        const theme = getThemeById(validated.data);
        if (!theme) {
          return {
            success: false,
            error: "Theme no encontrado",
          };
        }
      }

      await prisma.event.update({
        where: { id: ctx.event.eventId },
        data: { activeTheme: validated.data },
      });

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

// ============================================================================
// CUSTOM THEME COLORS
// ============================================================================

/**
 * Obtiene los colores del theme custom del evento actual.
 * Devuelve DEFAULT_CUSTOM_THEME_COLORS si no hay ninguno guardado.
 */
export const getCustomThemeColors = withEventAuth(
  async (ctx): Promise<ActionResult<CustomThemeColors>> => {
    try {
      const event = await prisma.event.findUnique({
        where: { id: ctx.event.eventId },
        select: { customTheme: true },
      });

      if (!event?.customTheme) {
        return { success: true, data: DEFAULT_CUSTOM_THEME_COLORS };
      }

      // Validar con Zod — nunca confiar en lo que viene de DB sin validar
      const parsed = customThemeColorsSchema.safeParse(event.customTheme);

      if (!parsed.success) {
        // El JSON en DB está corrupto, devolver defaults
        logError("getCustomThemeColors: invalid stored data", parsed.error);
        return { success: true, data: DEFAULT_CUSTOM_THEME_COLORS };
      }

      return { success: true, data: parsed.data };
    } catch (error) {
      logError("getCustomThemeColors", error);
      return { success: true, data: DEFAULT_CUSTOM_THEME_COLORS };
    }
  },
);

/**
 * Actualiza los colores del theme custom Y activa el theme custom en el evento.
 * Valida cada color con Zod antes de persistir → sin inyecciones posibles.
 */
export const updateCustomThemeColors = withEventAuth(
  async (ctx, colors: CustomThemeColors): Promise<ActionResult> => {
    try {
      const validated = customThemeColorsSchema.safeParse(colors);

      if (!validated.success) {
        return {
          success: false,
          error: "Colores inválidos. Verificá que sean colores hex (#RRGGBB)",
        };
      }

      await prisma.event.update({
        where: { id: ctx.event.eventId },
        data: {
          activeTheme: THEME_IDS.CUSTOM,
          // Prisma requiere el cast explícito para campos Json con objetos tipados
          customTheme: validated.data as object,
        },
      });

      revalidatePath("/", "layout");

      return { success: true };
    } catch (error) {
      logError("updateCustomThemeColors", error);
      return {
        success: false,
        error: "Error al guardar el theme personalizado",
      };
    }
  },
);

// ============================================================================
// PUBLIC (sin auth — para páginas de invitación)
// ============================================================================

export interface EventThemeData {
  themeId: ThemeId;
  customColors: CustomThemeColors | null;
}

/**
 * Obtiene el theme activo de un evento por su ID (para páginas públicas sin auth).
 * Devuelve themeId y los customColors si aplica.
 */
export async function getEventTheme(eventId: string): Promise<EventThemeData> {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { activeTheme: true, customTheme: true },
    });

    const themeId = (event?.activeTheme ?? THEME_IDS.CLASSIC) as ThemeId;

    if (themeId !== THEME_IDS.CUSTOM || !event?.customTheme) {
      return { themeId, customColors: null };
    }

    const parsed = customThemeColorsSchema.safeParse(event.customTheme);

    return {
      themeId,
      customColors: parsed.success ? parsed.data : null,
    };
  } catch {
    return { themeId: THEME_IDS.CLASSIC, customColors: null };
  }
}
