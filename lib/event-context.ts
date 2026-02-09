import "server-only";

import { cookies } from "next/headers";
import { getUserTierContext } from "@/lib/tier-enforcement-prisma";
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

// ============================================================================
// PURE BUSINESS LOGIC - No database dependencies
// ============================================================================

/**
 * Combina eventos propios y de colaboración
 */
export function combineAccessibleEvents(
  ownedEvents: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
  }>,
  memberships: Array<{
    permissions: bigint;
    event: {
      id: string;
      name: string;
      slug: string;
      description: string | null;
    };
  }>,
): AccessibleEvent[] {
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
 * Selecciona el evento apropiado según tier y cookie
 */
export function selectActiveEvent(
  events: AccessibleEvent[],
  tier: string,
  activeEventId?: string,
): AccessibleEvent | null {
  if (events.length === 0) {
    return null;
  }

  // FREE/BASIC: siempre el primer evento propio (o primero disponible)
  if (tier !== "COMPANY") {
    const ownedEvent = events.find((e) => e.isOwner);
    return ownedEvent ?? events[0];
  }

  // COMPANY: respetar cookie de evento activo
  if (activeEventId) {
    const activeEvent = events.find((e) => e.id === activeEventId);
    if (activeEvent) {
      return activeEvent;
    }
  }

  // Fallback: primer evento
  return events[0];
}

/**
 * Convierte AccessibleEvent a EventContext
 */
export function toEventContext(event: AccessibleEvent): EventContext {
  return {
    eventId: event.id,
    eventName: event.name,
    isOwner: event.isOwner,
    permissions: event.permissions,
  };
}

/**
 * Lee cookie de evento activo
 */
export async function getActiveEventCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_EVENT_COOKIE)?.value;
}

// ============================================================================
// DATABASE OPERATIONS - Depend on external database adapter
// ============================================================================

/**
 * Database adapter interface for event context
 */
export interface EventContextStorage {
  findOwnedEvents(userId: string): Promise<
    Array<{
      id: string;
      name: string;
      slug: string;
      description: string | null;
    }>
  >;

  findMemberships(userId: string): Promise<
    Array<{
      permissions: bigint;
      event: {
        id: string;
        name: string;
        slug: string;
        description: string | null;
      };
    }>
  >;

  findEventByOwner(
    eventId: string,
    userId: string,
  ): Promise<{ id: string; name: string } | null>;

  findMembershipByEvent(
    eventId: string,
    userId: string,
  ): Promise<{
    permissions: bigint;
    revokedAt: Date | null;
    event: { id: string; name: string };
  } | null>;
}

/**
 * Event context service with dependency injection
 */
export class EventContextService {
  constructor(private storage: EventContextStorage) {}

  async getUserAccessibleEvents(userId: string): Promise<AccessibleEvent[]> {
    const [ownedEvents, memberships] = await Promise.all([
      this.storage.findOwnedEvents(userId),
      this.storage.findMemberships(userId),
    ]);

    return combineAccessibleEvents(ownedEvents, memberships);
  }

  async getUserEventContext(userId: string): Promise<EventContext | null> {
    const { tier } = await getUserTierContext(userId);
    const events = await this.getUserAccessibleEvents(userId);

    if (events.length === 0) {
      return null;
    }

    const activeEventId = await getActiveEventCookie();
    const selectedEvent = selectActiveEvent(events, tier, activeEventId);

    if (!selectedEvent) {
      return null;
    }

    return toEventContext(selectedEvent);
  }

  async verifyEventAccess(
    userId: string,
    eventId: string,
  ): Promise<EventContext | null> {
    // Verificar si es owner
    const event = await this.storage.findEventByOwner(eventId, userId);

    if (event) {
      return {
        eventId: event.id,
        eventName: event.name,
        isOwner: true,
        permissions: PERMISSION_PRESETS.OWNER,
      };
    }

    // Verificar si es colaborador
    const membership = await this.storage.findMembershipByEvent(
      eventId,
      userId,
    );

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
}
