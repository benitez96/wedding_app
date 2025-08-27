import { Suspense } from 'react'
import { getInvitations } from '@/app/actions/invitations'
import InvitationsTable from './InvitationsTable'
import InvitationsHeader from './InvitationsHeader'
import InvitationsSummary from './InvitationsSummary'
import { Spinner } from '@heroui/react'

interface InvitationsPageProps {
  searchParams: Promise<{
    search?: string
  }>
}

export default async function InvitationsPage({ searchParams }: InvitationsPageProps) {
  const params = await searchParams
  const searchTerm = params.search || ''
  const result = await getInvitations(searchTerm)
  
  if (!result.success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-danger mb-2">Error al cargar invitaciones</h2>
          <p className="text-default-500">{result.error}</p>
        </div>
      </div>
    )
  }

  const invitations = result.data || []

  return (
    <div>
      <Suspense fallback={<Spinner size="lg" />}>
        <InvitationsHeader />
      </Suspense>

      <Suspense fallback={<Spinner size="lg" />}>
        <InvitationsTable 
          invitations={invitations} 
          searchTerm={searchTerm}
        />
      </Suspense>

      <Suspense fallback={<Spinner size="lg" />}>
        <InvitationsSummary />
      </Suspense>
    </div>
  )
}
