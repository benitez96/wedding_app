import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/invitations/";
import { getSectionConfigurations } from "@/app/actions/sections";
import {
  getWeddingDate,
  getRemindRestingDays,
} from "@/lib/get-configurations-prisma";
import { updateTokenAccessMetrics } from "@/app/actions/metrics";
import InvitationClientWidgets from "@/app/(invitation)/InvitationClientWidgets";
import DynamicSectionRenderer from "@/components/sections/DynamicSectionRenderer";

// Cache agresivo: revalidar cada hora
export const revalidate = 3600;

export default async function Home() {
  // Primero obtener el usuario para saber el eventId
  const userResult = await getCurrentUser();

  // Verificar autenticación
  if (!userResult.success || !userResult.user) {
    redirect("/error?message=necesita-invitacion");
  }

  const user = userResult.user;

  // Ahora obtener los datos del evento (scoped por eventId)
  const [sections, weddingDate, remindRestingDays] = await Promise.all([
    getSectionConfigurations(user.eventId),
    getWeddingDate(user.eventId),
    getRemindRestingDays(user.eventId),
  ]);

  // Extraer setting del botón flotante desde la sección RSVP
  const rsvpSection = sections.find((s) => s.key === "rsvp");
  const showFloatingButton =
    (rsvpSection?.settings?.showFloatingButton as boolean | undefined) ?? true;

  // Actualizar métricas de acceso (non-blocking)
  if (user.tokenId && typeof user.tokenId === "string") {
    // Fire and forget - no await
    void updateTokenAccessMetrics(user.tokenId);
  }

  return (
    <>
      {/* Client widgets (floating buttons, music, etc) */}
      <InvitationClientWidgets
        weddingTimestamp={weddingDate.getTime()}
        remindRestingDays={remindRestingDays}
        showFloatingButton={showFloatingButton}
      />

      {/* Renderizado dinámico de secciones basado en DB */}
      <DynamicSectionRenderer
        sections={sections}
        user={{
          id: user.invitationId as string,
          guestName: user.guestName,
          maxGuests: user.maxGuests,
          hasResponded: user.hasResponded,
          isAttending: user.isAttending,
          guestCount: user.guestCount,
        }}
      />
    </>
  );
}
