// Forzar renderizado dinámico (no estático)
export const dynamic = "force-dynamic";

interface InvitationDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function InvitationDetailPage({
  params: _params,
}: InvitationDetailPageProps) {
  return <></>;
}
