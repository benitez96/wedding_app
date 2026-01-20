"use server";

import { cache } from "react";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { verifyAdminAuth } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";
import { SectionConfiguration } from "@/types/sections";
import { getSectionSettingsSchema } from "@/types/section-settings";

interface ActionState {
  success: boolean;
  error?: string;
  message?: string;
}

// ============================================
// OBTENER TODAS LAS SECCIONES (ordenadas)
// ============================================
// Cache strategy:
// 1. unstable_cache() - Cachea entre requests (persistente)
// 2. React.cache() - Deduplica en la misma renderización
// 3. revalidateTag() - Invalida cuando se actualizan settings

const getCachedSectionConfigurations = unstable_cache(
  async (): Promise<SectionConfiguration[]> => {
    try {
      const sections = await prisma.sectionConfiguration.findMany({
        orderBy: { order: "asc" },
      });

      return sections.map((section) => ({
        id: section.id,
        key: section.key as SectionConfiguration["key"],
        isEnabled: section.isEnabled,
        order: section.order,
        settings: section.settings as Record<string, unknown> | undefined,
      }));
    } catch (error) {
      console.error("Error obteniendo secciones:", {
        message: error instanceof Error ? error.message : "Unknown error",
      });
      return [];
    }
  },
  ["section-configurations"], // Cache key
  {
    tags: ["sections"], // Tag para revalidación
    revalidate: 3600, // Revalidar cada hora como fallback
  },
);

// Wrapper con React.cache() para deduplicar en la misma renderización
export const getSectionConfigurations = cache(getCachedSectionConfigurations);

// ============================================
// ACTUALIZAR ORDEN Y ENABLED DE SECCIONES
// ============================================
export async function updateSectionsOrder(
  sections: { id: string; order: number; isEnabled: boolean }[],
): Promise<ActionState> {
  try {
    // Verificar autenticación de admin
    const authResult = await verifyAdminAuth();
    if (!authResult.success) {
      return { success: false, error: "No autorizado" };
    }

    // Estrategia: primero setear todos los order a valores negativos temporales
    // para evitar conflictos de unique constraint, luego actualizar a los valores finales
    await prisma.$transaction(async (tx) => {
      // Paso 1: Setear todos los order a valores temporales negativos
      for (let i = 0; i < sections.length; i++) {
        await tx.sectionConfiguration.update({
          where: { id: sections[i].id },
          data: { order: -1000 - i }, // -1000, -1001, -1002, etc
        });
      }

      // Paso 2: Actualizar con los valores finales (order + isEnabled)
      for (const section of sections) {
        await tx.sectionConfiguration.update({
          where: { id: section.id },
          data: {
            order: section.order,
            isEnabled: section.isEnabled,
          },
        });
      }
    });

    // Revalidar cache y páginas
    revalidateTag("sections"); // Invalida el cache de secciones
    revalidatePath("/backoffice/estructura");
    revalidatePath("/", "layout"); // Revalida toda la app pública

    return {
      success: true,
      message: "Cambios guardados correctamente",
    };
  } catch (error) {
    console.error("Error actualizando secciones:", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return {
      success: false,
      error: "Error al guardar los cambios. Intenta nuevamente.",
    };
  }
}

// ============================================
// TOGGLE ENABLED/DISABLED
// ============================================
export async function toggleSectionEnabled(
  id: string,
  isEnabled: boolean,
): Promise<ActionState> {
  try {
    // Verificar autenticación de admin
    const authResult = await verifyAdminAuth();
    if (!authResult.success) {
      return { success: false, error: "No autorizado" };
    }

    await prisma.sectionConfiguration.update({
      where: { id },
      data: { isEnabled },
    });

    // Revalidar cache y páginas
    revalidateTag("sections"); // Invalida el cache de secciones
    revalidatePath("/backoffice/estructura");
    revalidatePath("/", "layout");

    return {
      success: true,
      message: `Sección ${isEnabled ? "habilitada" : "deshabilitada"}`,
    };
  } catch (error) {
    console.error("Error toggle sección:", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return {
      success: false,
      error: "Error al actualizar la sección. Intenta nuevamente.",
    };
  }
}

// ============================================
// ACTUALIZAR SETTINGS DE UNA SECCIÓN
// ============================================
export async function updateSectionSettings(
  id: string,
  key: string,
  settings: Record<string, unknown>,
): Promise<ActionState> {
  try {
    // Verificar autenticación de admin
    const authResult = await verifyAdminAuth();
    if (!authResult.success) {
      return { success: false, error: "No autorizado" };
    }

    // Validar settings con Zod según el key
    const schema = getSectionSettingsSchema(key);
    const validatedSettings = schema.parse(settings);

    await prisma.sectionConfiguration.update({
      where: { id },
      data: { settings: validatedSettings as never },
    });

    // Revalidar cache y páginas
    revalidateTag("sections"); // Invalida el cache de secciones
    revalidatePath("/backoffice/estructura");
    revalidatePath("/", "layout");

    return {
      success: true,
      message: "Configuración actualizada correctamente",
    };
  } catch (error) {
    console.error("Error actualizando settings de sección:", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return {
      success: false,
      error: "Error al actualizar la configuración. Intenta nuevamente.",
    };
  }
}
