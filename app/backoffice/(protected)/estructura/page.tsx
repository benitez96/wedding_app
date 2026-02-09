import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserEventContext } from "@/lib/event-context-prisma";
import EstructuraClient from "./EstructuraClient";
import { getSectionConfigurations } from "@/app/actions/sections";

// Forzar renderizado dinámico (no estático)
export const dynamic = "force-dynamic";

export default async function EstructuraPage() {
  // Obtener el evento del usuario
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/backoffice/login");
  }

  const eventContext = await getUserEventContext(session.user.id);

  if (!eventContext?.eventId) {
    redirect("/backoffice");
  }

  // Obtener secciones del evento
  const sections = await getSectionConfigurations(eventContext.eventId);

  return <EstructuraClient initialSections={sections} />;
}
