"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { THEME_IDS, type ThemeId, getThemeById } from "@/types/theme";

// Schema de validación para theme ID
const themeIdSchema = z.enum([
  THEME_IDS.CLASSIC,
  THEME_IDS.WARM,
  THEME_IDS.PASTEL_GREEN,
]);

interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Obtiene el theme activo desde la base de datos
 */
export async function getActiveTheme(): Promise<ActionResult<ThemeId>> {
  try {
    // Obtener configuración de theme (singleton)
    const themeSettings = await prisma.themeSettings.findFirst();

    // Si no existe, retornar theme por defecto
    if (!themeSettings) {
      return {
        success: true,
        data: THEME_IDS.CLASSIC,
      };
    }

    // Validar que el theme almacenado sea válido
    const validated = themeIdSchema.safeParse(themeSettings.activeTheme);

    if (!validated.success) {
      return {
        success: true,
        data: THEME_IDS.CLASSIC, // Fallback a classic si es inválido
      };
    }

    return {
      success: true,
      data: validated.data,
    };
  } catch (error) {
    console.error("[getActiveTheme] Error:", error);
    return {
      success: false,
      error: "Error al obtener el theme activo",
      data: THEME_IDS.CLASSIC, // Fallback
    };
  }
}

/**
 * Actualiza el theme activo
 */
export async function updateActiveTheme(
  themeId: ThemeId,
): Promise<ActionResult> {
  try {
    // Validar themeId
    const validated = themeIdSchema.safeParse(themeId);

    if (!validated.success) {
      return {
        success: false,
        error: "Theme ID inválido",
      };
    }

    // Verificar que el theme existe en la definición
    const theme = getThemeById(validated.data);

    if (!theme) {
      return {
        success: false,
        error: "Theme no encontrado",
      };
    }

    // Obtener el singleton actual
    const existing = await prisma.themeSettings.findFirst();

    if (existing) {
      // Actualizar existente
      await prisma.themeSettings.update({
        where: { id: existing.id },
        data: { activeTheme: validated.data },
      });
    } else {
      // Crear nuevo registro (primera vez)
      await prisma.themeSettings.create({
        data: { activeTheme: validated.data },
      });
    }

    // Revalidar todas las páginas para aplicar el theme
    revalidatePath("/", "layout");

    return {
      success: true,
    };
  } catch (error) {
    console.error("[updateActiveTheme] Error:", error);
    return {
      success: false,
      error: "Error al actualizar el theme",
    };
  }
}
