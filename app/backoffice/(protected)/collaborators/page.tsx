import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Divider } from "@heroui/react";
import { auth } from "@/lib/auth";
import { getUserTierContext } from "@/lib/tier-enforcement-prisma";
import CollaboratorsList from "@/components/backoffice/CollaboratorsList";
import InviteLinksSection from "@/components/backoffice/InviteLinksSection";

export default async function CollaboratorsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/backoffice/login");
  }

  const tierContext = await getUserTierContext(session.user.id);

  if (!tierContext.limits.canHaveCollaborators) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <h1 className="text-2xl font-bold">Miembros</h1>
        <p className="text-default-500 text-center max-w-md">
          La funcionalidad de miembros está disponible en el plan Company.
          Actualiza tu plan para invitar a otros usuarios a gestionar tus
          eventos.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Miembros</h1>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Links de Invitación</h2>
        <InviteLinksSection />
      </section>

      <Divider />

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Miembros Actuales</h2>
        <CollaboratorsList />
      </section>
    </div>
  );
}
