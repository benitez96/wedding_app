"use server";

import { withAuth } from "@/lib/server-auth";
import type { User } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { enforceEventLimit } from "@/lib/tier-enforcement";
import {
  getUserAccessibleEvents,
  type AccessibleEvent,
} from "@/lib/event-context";

const ACTIVE_EVENT_COOKIE = "active-event-id";

/**
 * Obtiene todos los eventos accesibles por el usuario (propios + colaborador)
 */
export const getEvents = withAuth(async (user: User) => {
  try {
    const events = await getUserAccessibleEvents(user.id);

    // Serializar BigInt para enviar al cliente
    const serialized = events.map((e) => ({
      id: e.id,
      name: e.name,
      slug: e.slug,
      description: e.description,
      isOwner: e.isOwner,
      permissions: e.permissions.toString(),
    }));

    return { success: true, data: serialized };
  } catch (error) {
    console.error("Error al obtener eventos:", error);
    return { success: false, error: "Error al cargar los eventos" };
  }
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

    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;

    if (!name || name.trim().length === 0) {
      return { success: false, error: "El nombre del evento es requerido" };
    }

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
    console.error("Error al crear evento:", error);
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

      revalidatePath("/backoffice");
      return { success: true };
    } catch (error) {
      console.error("Error al cambiar evento activo:", error);
      return { success: false, error: "Error al cambiar el evento" };
    }
  },
);
