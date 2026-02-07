"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { withEventAuth } from "@/lib/server-auth";
import prisma from "@/lib/prisma";
import { SectionConfiguration } from "@/types/sections";
import { getSectionSettingsSchema } from "@/types/section-settings";
import { isSectionKey } from "@/components/sections/metadata";
import { logError } from "@/lib/logger";

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

const updateSectionSettingsSchema = z.object({
  id: z.string().cuid({ message: "Invalid ID format" }),
  key: z.string().refine((key) => isSectionKey(key), {
    message: "Invalid section key",
  }),
});

const updateSectionsOrderSchema = z
  .array(
    z.object({
      id: z.string().cuid({ message: "Invalid ID format" }),
      order: z.number().int().min(0),
      isEnabled: z.boolean(),
    }),
  )
  .min(1)
  .max(50);

// ============================================
// OBTENER TODAS LAS SECCIONES (ordenadas)
// ============================================
// Ahora las secciones están por evento, necesitamos el eventId
export async function getSectionConfigurations(
  eventId: string,
): Promise<SectionConfiguration[]> {
  try {
    const sections = await prisma.sectionConfiguration.findMany({
      where: { eventId },
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
    logError("Error obteniendo secciones", error);
    return [];
  }
}

// ============================================
// ACTUALIZAR ORDEN Y ENABLED DE SECCIONES
// ============================================
export const updateSectionsOrder = withEventAuth(
  async (
    ctx,
    sections: { id: string; order: number; isEnabled: boolean }[],
  ): Promise<ActionState> => {
    try {
      // Validate input with Zod
      const validated = updateSectionsOrderSchema.safeParse(sections);
      if (!validated.success) {
        return { success: false, error: "Datos de secciones inválidos" };
      }

      // SECURITY: Verify ALL section IDs belong to the user's event
      const sectionIds = validated.data.map((s) => s.id);
      const ownedSections = await prisma.sectionConfiguration.count({
        where: { id: { in: sectionIds }, eventId: ctx.event.eventId },
      });

      if (ownedSections !== sectionIds.length) {
        return {
          success: false,
          error: "Una o más secciones no pertenecen a tu evento",
        };
      }

      // Estrategia: Usar Promise.all para updates en paralelo (evita N+1)
      // Primero setear valores temporales negativos, luego los finales
      const validatedSections = validated.data;
      await prisma.$transaction(async (tx) => {
        // Paso 1: Setear todos los order a valores temporales negativos (en paralelo)
        await Promise.all(
          validatedSections.map((section, i) =>
            tx.sectionConfiguration.update({
              where: { id: section.id },
              data: { order: -1000 - i }, // -1000, -1001, -1002, etc
            }),
          ),
        );

        // Paso 2: Actualizar con los valores finales (order + isEnabled) (en paralelo)
        await Promise.all(
          validatedSections.map((section) =>
            tx.sectionConfiguration.update({
              where: { id: section.id },
              data: {
                order: section.order,
                isEnabled: section.isEnabled,
              },
            }),
          ),
        );
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
      logError("Error actualizando secciones", error);
      return {
        success: false,
        error: "Error al guardar los cambios. Intenta nuevamente.",
      };
    }
  },
);

// ============================================
// ACTUALIZAR SETTINGS DE UNA SECCIÓN
// ============================================
export const updateSectionSettings = withEventAuth(
  async (
    ctx,
    id: string,
    key: SectionConfiguration["key"],
    settings: Record<string, unknown>,
  ): Promise<ActionState> => {
    try {
      // Validar id y key con Zod
      const validated = updateSectionSettingsSchema.safeParse({ id, key });
      if (!validated.success) {
        return {
          success: false,
          error: "Datos inválidos",
        };
      }

      // SECURITY: Verify section belongs to user's event before updating
      const section = await prisma.sectionConfiguration.findFirst({
        where: { id: validated.data.id, eventId: ctx.event.eventId },
        select: { id: true },
      });

      if (!section) {
        return { success: false, error: "Sección no encontrada" };
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
      logError("Error actualizando settings de sección", error);
      return {
        success: false,
        error: "Error al actualizar la configuración. Intenta nuevamente.",
      };
    }
  },
);

// ============================================
// AGREGAR UNA SECCIÓN AL FINAL DE LA LISTA
// ============================================
export const addSection = withEventAuth(
  async (ctx, key: string): Promise<ActionState> => {
    try {
      // Validar input con Zod
      const validated = addSectionSchema.safeParse({ key });
      if (!validated.success) {
        return {
          success: false,
          error: "Sección no válida",
        };
      }

      // Verificar que la sección no exista ya para este evento
      // EXCEPCIÓN: Los dividers pueden agregarse múltiples veces
      if (validated.data.key !== "divider") {
        const existing = await prisma.sectionConfiguration.findFirst({
          where: {
            eventId: ctx.event.eventId,
            key: validated.data.key,
          },
        });

        if (existing) {
          return {
            success: false,
            error: "Esta sección ya está agregada",
          };
        }
      }

      // Obtener el orden máximo actual para este evento
      const maxOrder = await prisma.sectionConfiguration.findFirst({
        where: { eventId: ctx.event.eventId },
        orderBy: { order: "desc" },
        select: { order: true },
      });

      const newOrder = (maxOrder?.order ?? -1) + 1;

      // Crear la nueva sección para este evento
      await prisma.sectionConfiguration.create({
        data: {
          eventId: ctx.event.eventId,
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
      logError("Error agregando sección", error);
      return {
        success: false,
        error: "Error al agregar la sección. Intenta nuevamente.",
      };
    }
  },
);

// ============================================
// ELIMINAR UNA SECCIÓN
// ============================================
export const removeSection = withEventAuth(
  async (ctx, id: string): Promise<ActionState> => {
    try {
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
        select: { order: true, eventId: true },
      });

      if (!section) {
        return {
          success: false,
          error: "Sección no encontrada",
        };
      }

      // Verificar que la sección pertenece al evento del usuario
      if (section.eventId !== ctx.event.eventId) {
        return {
          success: false,
          error: "No autorizado",
        };
      }

      await prisma.$transaction(async (tx) => {
        // 1. Eliminar la sección
        await tx.sectionConfiguration.delete({
          where: { id: validated.data.id },
        });

        // 2. Obtener todas las secciones restantes del evento
        const remainingSections = await tx.sectionConfiguration.findMany({
          where: { eventId: ctx.event.eventId },
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
      logError("Error eliminando sección", error);
      return {
        success: false,
        error: "Error al eliminar la sección. Intenta nuevamente.",
      };
    }
  },
);
