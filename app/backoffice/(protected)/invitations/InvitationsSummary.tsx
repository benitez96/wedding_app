import { Card, CardBody } from '@heroui/react'
import { getInvitationsStats } from '@/app/actions/invitations'
import { InvitationsStats } from './types'

interface InvitationsSummaryProps {
  // No necesita props, siempre muestra estadísticas globales
}

export default async function InvitationsSummary() {
  const result = await getInvitationsStats()
  
  if (!result.success) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-danger">Error</div>
            <div className="text-sm text-default-500">No se pudieron cargar las estadísticas</div>
          </CardBody>
        </Card>
      </div>
    )
  }

  const stats: InvitationsStats = result.data!

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardBody className="text-center">
          <div className="text-2xl font-bold text-primary">{stats.total}</div>
          <div className="text-sm text-default-500">Total Invitaciones</div>
        </CardBody>
      </Card>
      <Card>
        <CardBody className="text-center">
          <div className="text-2xl font-bold text-warning">{stats.pending}</div>
          <div className="text-sm text-default-500">Pendientes</div>
        </CardBody>
      </Card>
      <Card>
        <CardBody className="text-center">
          <div className="text-2xl font-bold text-success">{stats.confirmed}</div>
          <div className="text-sm text-default-500">Invitados Confirmados</div>
        </CardBody>
      </Card>
      <Card>
        <CardBody className="text-center">
          <div className="text-2xl font-bold text-danger">{stats.declined}</div>
          <div className="text-sm text-default-500">Invitaciones Rechazadas</div>
        </CardBody>
      </Card>
    </div>
  )
}
