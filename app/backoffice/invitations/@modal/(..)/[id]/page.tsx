import { notFound } from 'next/navigation'
import { getInvitationWithTokens } from '@/app/actions/invitations'
import InvitationDetailModal from '@/components/InvitationDetailModal'

interface InterceptedInvitationDetailProps {
  params: Promise<{
    id: string
  }>
}

export default async function InterceptedInvitationDetail({ params }: InterceptedInvitationDetailProps) {
  const resolvedParams = await params
  const result = await getInvitationWithTokens(resolvedParams.id)
  
  if (!result.success || !result.data) {
    notFound()
  }

  return <InvitationDetailModal invitation={result.data} />
}
