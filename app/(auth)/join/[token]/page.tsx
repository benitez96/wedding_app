import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getInviteLinkInfo,
  acceptInviteLink,
} from "@/app/actions/collaborators";
import JoinEventClient from "./JoinEventClient";

interface JoinPageProps {
  params: Promise<{ token: string }>;
}

export default async function JoinPage({ params }: JoinPageProps) {
  const { token } = await params;

  // Obtener info del link
  const linkInfo = await getInviteLinkInfo(token);

  if (!linkInfo.success || !linkInfo.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
        <h1 className="text-2xl font-bold">Link no válido</h1>
        <p className="text-default-500 text-center">
          {linkInfo.error ?? "Este link de invitación no es válido o ha expirado."}
        </p>
      </div>
    );
  }

  // Verificar si el usuario está autenticado
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    // No autenticado: mostrar info del evento y redirigir a login
    return (
      <JoinEventClient
        token={token}
        eventName={linkInfo.data.eventName}
        eventDescription={linkInfo.data.eventDescription ?? null}
        isAuthenticated={false}
      />
    );
  }

  // Autenticado: aceptar automáticamente
  const result = await acceptInviteLink(token);

  if (result.success && result.data) {
    redirect("/backoffice/dashboard");
  }

  return (
    <JoinEventClient
      token={token}
      eventName={linkInfo.data.eventName}
      eventDescription={linkInfo.data.eventDescription ?? null}
      isAuthenticated={true}
      error={result.error}
    />
  );
}
