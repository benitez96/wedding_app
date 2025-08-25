import { notFound } from 'next/navigation'
import { getInvitationWithTokens } from '@/app/actions/invitations'
import InvitationDetailModal from '@/components/InvitationDetailModal'

interface InterceptedInvitationDetailProps {
  params: {
    id: string
  }
}

export default async function InterceptedInvitationDetail({ params }: InterceptedInvitationDetailProps) {
  const result = await getInvitationWithTokens(params.id)
  
  if (!result.success || !result.data) {
    notFound()
  }

  return <InvitationDetailModal invitation={result.data} />
}
