import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import BackofficeNavbar from "../BackofficeNavbar";
import { getUserTierContext } from "@/lib/tier-enforcement";
import {
  getUserAccessibleEvents,
  getUserEventContext,
} from "@/lib/event-context";

interface ProtectedLayoutProps {
  children: React.ReactNode;
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

  // Obtener tier y eventos en paralelo
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navbar con menú (solo para usuarios logueados) */}
      <BackofficeNavbar
        showMenu={true}
        tier={tierContext.tier}
        events={events}
        activeEventId={eventContext?.eventId}
      />

      {/* Main Content */}
      <main className="container mx-auto max-w-screen-xl px-2 md:px-4 py-4 md:py-6">
        {children}
      </main>
    </div>
  );
}
