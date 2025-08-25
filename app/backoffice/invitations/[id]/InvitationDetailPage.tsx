'use client'

import { 
  Card,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Divider,
  Button
} from '@heroui/react'
import { ExternalLink, Calendar, Phone, Users, CheckCircle, XCircle, Clock, Copy, Check, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface InvitationToken {
  id: string
  token: string
  isUsed: boolean
  firstAccessAt: Date | null
  lastAccessAt: Date | null
  deviceId: string | null
  userAgent: string | null
  accessCount: number
  createdAt: Date
  updatedAt: Date
}

interface InvitationWithTokens {
  id: string
  guestName: string
  guestNickname: string | null
  guestPhone: string | null
  maxGuests: number
  hasResponded: boolean
  isAttending: boolean | null
  guestCount: number | null
  respondedAt: Date | null
  createdAt: Date
  updatedAt: Date
  tokens: InvitationToken[]
}

interface InvitationDetailPageProps {
  invitation: InvitationWithTokens
}

export default function InvitationDetailPage({ invitation }: InvitationDetailPageProps) {
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const router = useRouter()

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusChip = (invitation: InvitationWithTokens) => {
    if (!invitation.hasResponded) {
      return <Chip color="warning" variant="flat" size="sm">Pendiente</Chip>
    }
    if (invitation.isAttending) {
      return <Chip color="success" variant="flat" size="sm">Confirmado</Chip>
    }
    return <Chip color="danger" variant="flat" size="sm">No asistirá</Chip>
  }

  const getTokenStatusChip = (token: InvitationToken) => {
    if (token.isUsed) {
      return <Chip color="success" variant="flat" size="sm">Usado</Chip>
    }
    return <Chip color="default" variant="flat" size="sm">Disponible</Chip>
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedToken(text)
      setTimeout(() => setCopiedToken(null), 2000)
    } catch (error) {
      console.error('Error al copiar al portapapeles:', error)
    }
  }

  const openInvitationLink = (token: string) => {
    const url = `${window.location.origin}/r/${token}`
    window.open(url, '_blank')
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="light"
            isIconOnly
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold">Detalles de la Invitación</h1>
        </div>
        {getStatusChip(invitation)}
      </div>

      {/* Información de la invitación */}
      <Card>
        <CardBody className="gap-4">
          <h2 className="text-lg font-semibold">Información del Invitado</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-default-500" />
                <span className="font-medium">Nombre:</span>
                <span>{invitation.guestName}</span>
              </div>
              
              {invitation.guestNickname && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Apodo:</span>
                  <span className="italic">"{invitation.guestNickname}"</span>
                </div>
              )}
              
              {invitation.guestPhone && (
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-default-500" />
                  <span className="font-medium">Teléfono:</span>
                  <span>{invitation.guestPhone}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-default-500" />
                <span className="font-medium">Máximo de invitados:</span>
                <span>{invitation.maxGuests}</span>
              </div>
              
              {invitation.hasResponded && (
                <>
                  <div className="flex items-center gap-2">
                    {invitation.isAttending ? (
                      <CheckCircle size={16} className="text-success" />
                    ) : (
                      <XCircle size={16} className="text-danger" />
                    )}
                    <span className="font-medium">Confirmados:</span>
                    <span>{invitation.guestCount || 0}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-default-500" />
                    <span className="font-medium">Respondió el:</span>
                    <span>{formatDate(invitation.respondedAt)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <Divider />
          
          <div className="flex items-center gap-2 text-sm text-default-500">
            <Clock size={14} />
            <span>Creada el {formatDate(invitation.createdAt)}</span>
          </div>
        </CardBody>
      </Card>

      {/* Tabla de tokens */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Tokens de Acceso</h2>
            <Chip color="primary" variant="flat" size="sm">
              {invitation.tokens.length} token{invitation.tokens.length !== 1 ? 's' : ''}
            </Chip>
          </div>
          
          <Table 
            aria-label="Tabla de tokens"
            className="min-h-[200px]"
            selectionMode="none"
          >
            <TableHeader>
              <TableColumn>TOKEN</TableColumn>
              <TableColumn>ESTADO</TableColumn>
              <TableColumn>ACCESOS</TableColumn>
              <TableColumn>PRIMER ACCESO</TableColumn>
              <TableColumn>ÚLTIMO ACCESO</TableColumn>
              <TableColumn>ACCIONES</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No hay tokens generados para esta invitación">
              {invitation.tokens.map((token) => (
                <TableRow key={token.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-default-100 px-2 py-1 rounded font-mono">
                        {token.token.substring(0, 8)}...
                      </code>
                      <Button
                        size="sm"
                        variant="light"
                        isIconOnly
                        onPress={() => copyToClipboard(token.token)}
                      >
                        {copiedToken === token.token ? (
                          <Check size={14} className="text-success" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getTokenStatusChip(token)}
                  </TableCell>
                  <TableCell>
                    {token.accessCount}
                  </TableCell>
                  <TableCell>
                    {formatDate(token.firstAccessAt)}
                  </TableCell>
                  <TableCell>
                    {formatDate(token.lastAccessAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="light"
                        color="primary"
                        isIconOnly
                        onPress={() => openInvitationLink(token.token)}
                      >
                        <ExternalLink size={14} />
                      </Button>
                      {token.deviceId && (
                        <div className="text-xs text-default-500 ml-2">
                          ID: {token.deviceId.substring(0, 8)}...
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  )
}
