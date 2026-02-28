import { redirect } from "next/navigation";
import { headers } from "next/headers";
import NoEventsView from "./NoEventsView";
import { auth } from "@/lib/auth";
import { getUserAccessibleEvents } from "@/lib/event-context-prisma";

export default async function NoEventsPage() {
  // Verificar autenticación
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/backoffice/login");
  }

  // Verificar que realmente NO tenga eventos
  const events = await getUserAccessibleEvents(session.user.id);

  // Si tiene eventos, redirigir al backoffice normal
  if (events.length > 0) {
    redirect("/backoffice");
  }

  return <NoEventsView />;
}
