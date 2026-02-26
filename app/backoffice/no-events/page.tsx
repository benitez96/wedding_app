import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserAccessibleEvents } from "@/lib/event-context-prisma";
import NoEventsView from "./NoEventsView";

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
