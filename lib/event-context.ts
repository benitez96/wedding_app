import "server-only";

import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { getUserTierContext } from "@/lib/tier-enforcement";
import { PERMISSION_PRESETS } from "@/lib/permissions";

const ACTIVE_EVENT_COOKIE = "active-event-id";

/**
 * Evento accesible por el usuario (propio o como colaborador)
 */
export interface AccessibleEvent {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isOwner: boolean;
  permissions: bigint;
}

/**
 * Contexto de evento para server actions
 */
export interface EventContext {
  eventId: string;
  eventName: string;
  isOwner: boolean;
  permissions: bigint;
}

/**
 * Obtiene todos los eventos accesibles por el usuario (propios + colaborador)
 */
export async function getUserAccessibleEvents(
  userId: string,
): Promise<AccessibleEvent[]> {
  const [ownedEvents, memberships] = await Promise.all([
    prisma.event.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.eventMember.findMany({
      where: {
        userId,
        revokedAt: null,
      },
      select: {
        permissions: true,
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
      },
    }),
  ]);

  const owned: AccessibleEvent[] = ownedEvents.map((e) => ({
    ...e,
    isOwner: true,
    permissions: PERMISSION_PRESETS.OWNER,
  }));

  const collaborated: AccessibleEvent[] = memberships.map((m) => ({
    ...m.event,
    isOwner: false,
    permissions: m.permissions,
  }));

  return [...owned, ...collaborated];
}

/**
 * Resuelve el evento activo del usuario.
 *
 * - FREE/BASIC: retorna su unico evento (ignora cookie)
 * - COMPANY: retorna el evento seleccionado via cookie, o el primero disponible
 */
export async function getUserEventContext(
  userId: string,
): Promise<EventContext | null> {
  const { tier } = await getUserTierContext(userId);
  const events = await getUserAccessibleEvents(userId);

  if (events.length === 0) {
    return null;
  }

  // FREE/BASIC: siempre el primer (unico) evento propio
  if (tier !== "COMPANY") {
    const ownedEvent = events.find((e) => e.isOwner);
    const event = ownedEvent ?? events[0];
    return {
      eventId: event.id,
      eventName: event.name,
      isOwner: event.isOwner,
      permissions: event.permissions,
    };
  }

  // COMPANY: respetar cookie de evento activo
  const cookieStore = await cookies();
  const activeEventId = cookieStore.get(ACTIVE_EVENT_COOKIE)?.value;

  if (activeEventId) {
    const activeEvent = events.find((e) => e.id === activeEventId);
    if (activeEvent) {
      return {
        eventId: activeEvent.id,
        eventName: activeEvent.name,
        isOwner: activeEvent.isOwner,
        permissions: activeEvent.permissions,
      };
    }
  }

  // Fallback: primer evento
  const event = events[0];
  return {
    eventId: event.id,
    eventName: event.name,
    isOwner: event.isOwner,
    permissions: event.permissions,
  };
}

/**
 * Verifica que el usuario tiene acceso a un evento especifico
 */
export async function verifyEventAccess(
  userId: string,
  eventId: string,
): Promise<EventContext | null> {
  // Verificar si es owner
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      ownerId: userId,
    },
    select: { id: true, name: true },
  });

  if (event) {
    return {
      eventId: event.id,
      eventName: event.name,
      isOwner: true,
      permissions: PERMISSION_PRESETS.OWNER,
    };
  }

  // Verificar si es colaborador
  const membership = await prisma.eventMember.findUnique({
    where: {
      eventId_userId: { eventId, userId },
    },
    select: {
      permissions: true,
      revokedAt: true,
      event: {
        select: { id: true, name: true },
      },
    },
  });

  if (membership && !membership.revokedAt) {
    return {
      eventId: membership.event.id,
      eventName: membership.event.name,
      isOwner: false,
      permissions: membership.permissions,
    };
  }

  return null;
}
