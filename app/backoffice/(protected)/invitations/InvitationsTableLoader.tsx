import InvitationsTable from "./InvitationsTable";
import { getInvitations } from "@/app/actions/protected-admin-invitations";

interface InvitationsTableLoaderProps {
  searchTerm: string;
}

/**
 * Server Component que carga las invitaciones y las pasa a la tabla.
 * Separado para permitir streaming real con Suspense.
 */
export default async function InvitationsTableLoader({
  searchTerm,
}: InvitationsTableLoaderProps) {
  const result = await getInvitations(searchTerm);

  if (!result.success) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-danger mb-2">
            Error al cargar invitaciones
          </h2>
          <p className="text-default-500">{result.error}</p>
        </div>
      </div>
    );
  }

  const invitations = result.data || [];

  return <InvitationsTable invitations={invitations} searchTerm={searchTerm} />;
}
