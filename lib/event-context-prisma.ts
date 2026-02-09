/**
 * Prisma implementation of EventContextStorage
 */

import "server-only";

import prisma from "@/lib/prisma";
import type {
  EventContextStorage,
  AccessibleEvent,
  EventContext,
} from "@/lib/event-context";
import { EventContextService } from "@/lib/event-context";

/**
 * Implementación de EventContextStorage usando Prisma
 */
export class PrismaEventContextStorage implements EventContextStorage {
  async findOwnedEvents(userId: string): Promise<
    Array<{
      id: string;
      name: string;
      slug: string;
      description: string | null;
    }>
  > {
    return prisma.event.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findMemberships(userId: string): Promise<
    Array<{
      permissions: bigint;
      event: {
        id: string;
        name: string;
        slug: string;
        description: string | null;
      };
    }>
  > {
    return prisma.eventMember.findMany({
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
    });
  }

  async findEventByOwner(
    eventId: string,
    userId: string,
  ): Promise<{ id: string; name: string } | null> {
    return prisma.event.findFirst({
      where: {
        id: eventId,
        ownerId: userId,
      },
      select: { id: true, name: true },
    });
  }

  async findMembershipByEvent(
    eventId: string,
    userId: string,
  ): Promise<{
    permissions: bigint;
    revokedAt: Date | null;
    event: { id: string; name: string };
  } | null> {
    return prisma.eventMember.findUnique({
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
  }
}

/**
 * Singleton instance del service con Prisma storage
 */
const prismaStorage = new PrismaEventContextStorage();
export const eventContextService = new EventContextService(prismaStorage);

// Re-export service methods para backward compatibility
export async function getUserAccessibleEvents(
  userId: string,
): Promise<AccessibleEvent[]> {
  return eventContextService.getUserAccessibleEvents(userId);
}

export async function getUserEventContext(
  userId: string,
): Promise<EventContext | null> {
  return eventContextService.getUserEventContext(userId);
}

export async function verifyEventAccess(
  userId: string,
  eventId: string,
): Promise<EventContext | null> {
  return eventContextService.verifyEventAccess(userId, eventId);
}
