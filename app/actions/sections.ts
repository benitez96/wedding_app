"use server";

import { cache } from "react";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { z } from "zod";
import { verifyAdminAuth } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";
import { SectionConfiguration } from "@/types/sections";
import { getSectionSettingsSchema } from "@/types/section-settings";
import { isSectionKey } from "@/components/sections/metadata";

interface ActionState {
  success: boolean;
  error?: string;
  message?: string;
}

// ============================================
// ZOD SCHEMAS
// ============================================
const addSectionSchema = z.object({
  key: z.string().refine((key) => isSectionKey(key), {
    message: "Invalid section key",
  }),
});

const removeSectionSchema = z.object({
  id: z.string().cuid({ message: "Invalid ID format" }),
});

const toggleSectionSchema = z.object({
  id: z.string().cuid({ message: "Invalid ID format" }),
  isEnabled: z.boolean(),
});

const updateSectionSettingsSchema = z.object({
  id: z.string().cuid({ message: "Invalid ID format" }),
  key: z.string().refine((key) => isSectionKey(key), {
    message: "Invalid section key",
  }),
});

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
        key: section.key as SectionConfiguration["key"], // El tipo ya es SectionKey
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

    // Validar input con Zod
    const validated = toggleSectionSchema.safeParse({ id, isEnabled });
    if (!validated.success) {
      return {
        success: false,
        error: "Datos inválidos",
      };
    }

    await prisma.sectionConfiguration.update({
      where: { id: validated.data.id },
      data: { isEnabled: validated.data.isEnabled },
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
  key: SectionConfiguration["key"],
  settings: Record<string, unknown>,
): Promise<ActionState> {
  try {
    // Verificar autenticación de admin
    const authResult = await verifyAdminAuth();
    if (!authResult.success) {
      return { success: false, error: "No autorizado" };
    }

    // Validar id y key con Zod
    const validated = updateSectionSettingsSchema.safeParse({ id, key });
    if (!validated.success) {
      return {
        success: false,
        error: "Datos inválidos",
      };
    }

    // Validar settings con Zod según el key
    const schema = getSectionSettingsSchema(validated.data.key);
    const validatedSettings = schema.parse(settings);

    await prisma.sectionConfiguration.update({
      where: { id: validated.data.id },
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

// ============================================
// AGREGAR UNA SECCIÓN AL FINAL DE LA LISTA
// ============================================
export async function addSection(key: string): Promise<ActionState> {
  try {
    // Verificar autenticación de admin
    const authResult = await verifyAdminAuth();
    if (!authResult.success) {
      return { success: false, error: "No autorizado" };
    }

    // Validar input con Zod
    const validated = addSectionSchema.safeParse({ key });
    if (!validated.success) {
      return {
        success: false,
        error: "Sección no válida",
      };
    }

    // Verificar que la sección no exista ya
    const existing = await prisma.sectionConfiguration.findUnique({
      where: { key: validated.data.key },
    });

    if (existing) {
      return {
        success: false,
        error: "Esta sección ya está agregada",
      };
    }

    // Obtener el orden máximo actual y agregar 1
    const maxOrder = await prisma.sectionConfiguration.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const newOrder = (maxOrder?.order ?? -1) + 1;

    // Crear la nueva sección
    await prisma.sectionConfiguration.create({
      data: {
        key: validated.data.key,
        isEnabled: true,
        order: newOrder,
        settings: {},
      },
    });

    // Revalidar cache y páginas
    revalidateTag("sections");
    revalidatePath("/backoffice/estructura");
    revalidatePath("/", "layout");

    return {
      success: true,
      message: "Sección agregada correctamente",
    };
  } catch (error) {
    console.error("Error agregando sección:", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return {
      success: false,
      error: "Error al agregar la sección. Intenta nuevamente.",
    };
  }
}

// ============================================
// ELIMINAR UNA SECCIÓN
// ============================================
export async function removeSection(id: string): Promise<ActionState> {
  try {
    // Verificar autenticación de admin
    const authResult = await verifyAdminAuth();
    if (!authResult.success) {
      return { success: false, error: "No autorizado" };
    }

    // Validar input con Zod
    const validated = removeSectionSchema.safeParse({ id });
    if (!validated.success) {
      return {
        success: false,
        error: "ID inválido",
      };
    }

    // Obtener la sección a eliminar
    const section = await prisma.sectionConfiguration.findUnique({
      where: { id: validated.data.id },
      select: { order: true },
    });

    if (!section) {
      return {
        success: false,
        error: "Sección no encontrada",
      };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Eliminar la sección
      await tx.sectionConfiguration.delete({
        where: { id: validated.data.id },
      });

      // 2. Obtener todas las secciones restantes ordenadas
      const remainingSections = await tx.sectionConfiguration.findMany({
        orderBy: { order: "asc" },
        select: { id: true },
      });

      // 3. Actualizar con orden temporal negativo (evitar conflictos de unique)
      for (let i = 0; i < remainingSections.length; i++) {
        await tx.sectionConfiguration.update({
          where: { id: remainingSections[i].id },
          data: { order: -1000 - i },
        });
      }

      // 4. Actualizar con el orden final correcto (0, 1, 2, ...)
      for (let i = 0; i < remainingSections.length; i++) {
        await tx.sectionConfiguration.update({
          where: { id: remainingSections[i].id },
          data: { order: i },
        });
      }
    });

    // Revalidar cache y páginas
    revalidateTag("sections");
    revalidatePath("/backoffice/estructura");
    revalidatePath("/", "layout");

    return {
      success: true,
      message: "Sección eliminada correctamente",
    };
  } catch (error) {
    console.error("Error eliminando sección:", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return {
      success: false,
      error: "Error al eliminar la sección. Intenta nuevamente.",
    };
  }
}
