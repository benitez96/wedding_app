"use server";

import { withAuth } from "@/lib/server-auth";
import type { User } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { enforceEventLimit } from "@/lib/tier-enforcement-prisma";
import { getUserAccessibleEvents } from "@/lib/event-context-prisma";
import { logError } from "@/lib/logger";
import { z } from "zod";

const ACTIVE_EVENT_COOKIE = "active-event-id";

const createEventSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .transform((val) => val.trim()),
  description: z
    .string()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
});

/**
 * Crea un nuevo evento (enforce event limit)
 */
export const createEvent = withAuth(async (user: User, formData: FormData) => {
  try {
    // Verificar limite de eventos
    const enforcement = await enforceEventLimit(user.id);
    if (!enforcement.allowed) {
      return {
        success: false,
        error: enforcement.reason,
        limitReached: true,
      };
    }

    const rawName = formData.get("name") as string;
    const rawDescription = formData.get("description") as string | null;

    // Validate with Zod
    const validation = createEventSchema.safeParse({
      name: rawName,
      description: rawDescription,
    });
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message ?? "Datos inválidos",
      };
    }

    const { name, description } = validation.data;

    // Generar slug unico
    const baseSlug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    let slug = baseSlug;
    let counter = 1;

    while (
      await prisma.event.findUnique({
        where: { slug },
      })
    ) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const event = await prisma.event.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        ownerId: user.id,
        activeTheme: "classic",
        sections: {
          create: [
            { key: "hero", order: 1, isEnabled: true },
            { key: "date", order: 2, isEnabled: true },
            { key: "ceremony", order: 3, isEnabled: true },
            { key: "celebration", order: 4, isEnabled: true },
            { key: "rsvp", order: 5, isEnabled: true },
          ],
        },
      },
      include: {
        sections: true,
      },
    });

    revalidatePath("/backoffice");
    return { success: true, data: event };
  } catch (error) {
    logError("Error al crear evento", error);
    return { success: false, error: "Error al crear el evento" };
  }
});

/**
 * Cambia el evento activo (setea cookie)
 */
export const switchActiveEvent = withAuth(
  async (user: User, eventId: string) => {
    try {
      // Verificar que el usuario tiene acceso al evento
      const events = await getUserAccessibleEvents(user.id);
      const hasAccess = events.some((e) => e.id === eventId);

      if (!hasAccess) {
        return { success: false, error: "No tienes acceso a este evento" };
      }

      const cookieStore = await cookies();
      cookieStore.set(ACTIVE_EVENT_COOKIE, eventId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: "/",
      });

      // Invalidate backoffice layout to refresh theme
      revalidatePath("/backoffice", "layout");
      return { success: true };
    } catch (error) {
      logError("Error al cambiar evento activo", error);
      return { success: false, error: "Error al cambiar el evento" };
    }
  },
);
