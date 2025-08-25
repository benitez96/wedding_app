import { getInvitationWithTokens } from '../../../actions/invitations'
import { notFound } from 'next/navigation'
import InvitationDetailPage from './InvitationDetailPage'

interface InvitationDetailProps {
  params: {
    id: string
  }
}

export default async function InvitationDetail({ params }: InvitationDetailProps) {
  const result = await getInvitationWithTokens(params.id)
  
  if (!result.success || !result.data) {
    notFound()
  }

  return <InvitationDetailPage invitation={result.data} />
}
