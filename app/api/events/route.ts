import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PERMISSION_PRESETS } from "@/lib/permissions";
import { logError } from "@/lib/logger";

/**
 * GET /api/events
 * Obtiene los eventos del usuario autenticado (propios + colaborador)
 */
export async function GET(_request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Obtener eventos propios + eventos como colaborador en paralelo
    const [ownedEvents, memberships] = await Promise.all([
      prisma.event.findMany({
        where: { ownerId: userId },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          createdAt: true,
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
              createdAt: true,
            },
          },
        },
      }),
    ]);

    const owned = ownedEvents.map((e) => ({
      ...e,
      isOwner: true,
      permissions: PERMISSION_PRESETS.OWNER.toString(),
    }));

    const collaborated = memberships.map((m) => ({
      ...m.event,
      isOwner: false,
      permissions: m.permissions.toString(),
    }));

    return Response.json([...owned, ...collaborated]);
  } catch (error) {
    logError("GET /api/events", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
