import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import AppSidebar from "@/components/backoffice/AppSidebar";
import { getUserTierContext } from "@/lib/tier-enforcement-prisma";
import {
  getUserAccessibleEvents,
  getUserEventContext,
} from "@/lib/event-context-prisma";
import { getEventTheme } from "@/app/actions/theme";
import { THEME_IDS } from "@/types/theme";
import type { EventThemeData } from "@/app/actions/theme";

interface ProtectedLayoutProps {
  children: ReactNode;
}

export default async function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  // Verificar autenticación con Better Auth
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/backoffice/login");
  }

  // Obtener tier, eventos y theme en paralelo
  const [tierContext, accessibleEvents, eventContext] = await Promise.all([
    getUserTierContext(session.user.id),
    getUserAccessibleEvents(session.user.id),
    getUserEventContext(session.user.id),
  ]);

  const events = accessibleEvents.map((e) => ({
    id: e.id,
    name: e.name,
    isOwner: e.isOwner,
  }));

  // Obtener theme del evento activo
  const themeData: EventThemeData = eventContext?.eventId
    ? await getEventTheme(eventContext.eventId)
    : { themeId: THEME_IDS.CLASSIC, customColors: null };

  return (
    <AppSidebar
      events={events}
      activeEventId={eventContext?.eventId || null}
      tier={tierContext.tier}
      themeData={themeData}
    >
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto max-w-screen-xl px-2 md:px-4 py-4 md:py-6">
          {children}
        </div>
      </div>
    </AppSidebar>
  );
}
