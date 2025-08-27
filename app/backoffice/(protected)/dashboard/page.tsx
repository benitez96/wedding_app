import { Card, CardBody, CardHeader } from '@heroui/react'
import { Users, Mail, CheckCircle, XCircle } from 'lucide-react'
import prisma from '@/lib/prisma'

async function getDashboardStats() {
  const [
    totalInvitations,
    respondedInvitations,
    attendingInvitations,
    notAttendingInvitations
  ] = await Promise.all([
    prisma.invitation.count(),
    prisma.invitation.count({ where: { hasResponded: true } }),
    prisma.invitation.count({ where: { isAttending: true } }),
    prisma.invitation.count({ where: { isAttending: false } })
  ])

  return {
    totalInvitations,
    respondedInvitations,
    attendingInvitations,
    notAttendingInvitations,
    responseRate: totalInvitations > 0 ? Math.round((respondedInvitations / totalInvitations) * 100) : 0
  }
}

export default async function Backoffice() {
  const stats = await getDashboardStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Resumen de invitaciones y respuestas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total de Invitaciones */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Invitaciones</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalInvitations}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Invitaciones Respondidas */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Han Respondido</p>
                <p className="text-2xl font-bold text-gray-900">{stats.respondedInvitations}</p>
                <p className="text-sm text-gray-500">{stats.responseRate}% de respuesta</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Asistirán */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Asistirán</p>
                <p className="text-2xl font-bold text-green-600">{stats.attendingInvitations}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* No Asistirán */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">No Asistirán</p>
                <p className="text-2xl font-bold text-red-600">{stats.notAttendingInvitations}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Acciones Rápidas */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Acciones Rápidas</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <a 
              href="/backoffice/invitations" 
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h4 className="font-medium text-gray-900">Gestionar Invitaciones</h4>
              <p className="text-sm text-gray-600 mt-1">Ver y editar todas las invitaciones</p>
            </a>
            
            <a 
              href="/backoffice/invitations" 
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h4 className="font-medium text-gray-900">Crear Nueva Invitación</h4>
              <p className="text-sm text-gray-600 mt-1">Agregar un nuevo invitado</p>
            </a>
            
            <a 
              href="/backoffice/invitations" 
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h4 className="font-medium text-gray-900">Generar Tokens</h4>
              <p className="text-sm text-gray-600 mt-1">Crear tokens de acceso para invitados</p>
            </a>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}