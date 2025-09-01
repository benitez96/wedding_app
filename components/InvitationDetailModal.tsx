'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody,
  Button,
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
  useDisclosure,
  Tooltip
} from '@heroui/react'
import { X, ExternalLink, Calendar, Phone, Users, CheckCircle, XCircle, Clock, Copy, Check, Plus, Ban, Trash2, RotateCcw } from 'lucide-react'

import { InvitationWithTokens, InvitationToken } from '@/app/backoffice/(protected)/invitations/types'
import { createInvitationToken, revokeInvitationToken, reactivateInvitationToken, deleteInvitationToken } from '@/app/actions/protected-admin-invitations'
import { formatDateTime } from '@/utils/date'

interface InvitationDetailModalProps {
  invitation: InvitationWithTokens
}

export default function InvitationDetailModal({ invitation }: InvitationDetailModalProps) {
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [isCreatingToken, setIsCreatingToken] = useState(false)
  const router = useRouter()

  const handleClose = () => {
    router.back()
  }

  const getDeviceInfo = (userAgent: string | null) => {
    if (!userAgent || userAgent === 'Unknown') return 'Desconocido'
    
    // Detectar navegador
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    
    // Detectar dispositivo móvil
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return 'Móvil'
    }
    
    return 'Desktop'
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
    if (!token.isActive) {
      return <Chip color="danger" variant="flat" size="sm">Revocado</Chip>
    }
    if (token.isUsed) {
      return <Chip color="success" variant="flat" size="sm">Usado</Chip>
    }
    return <Chip color="default" variant="flat" size="sm">Disponible</Chip>
  }

  const copyToClipboard = async (tokenId: string) => {
    try {
      const invitationUrl = `${window.location.origin}/r/${tokenId}`
      await navigator.clipboard.writeText(invitationUrl)
      setCopiedToken(tokenId)
      setTimeout(() => setCopiedToken(null), 2000)
    } catch (error) {
      console.error('Error al copiar al portapapeles:', error)
    }
  }

  const openInvitationLink = (tokenId: string) => {
    const url = `${window.location.origin}/r/${tokenId}`
    window.open(url, '_blank')
  }

  const handleCreateToken = async () => {
    setIsCreatingToken(true)
    try {
      const result = await createInvitationToken(invitation.id)
      if (result.success) {
        // Recargar la página para mostrar el nuevo token
        router.refresh()
      } else {
        console.error('Error al crear token:', result.error)
        // Aquí podrías mostrar un toast de error
      }
    } catch (error) {
      console.error('Error al crear token:', error)
    } finally {
      setIsCreatingToken(false)
    }
  }

  const handleRevokeToken = async (tokenId: string) => {
    try {
      const result = await revokeInvitationToken(tokenId)
      if (result.success) {
        router.refresh()
      } else {
        console.error('Error al revocar token:', result.error)
      }
    } catch (error) {
      console.error('Error al revocar token:', error)
    }
  }

  const handleReactivateToken = async (tokenId: string) => {
    try {
      const result = await reactivateInvitationToken(tokenId)
      if (result.success) {
        router.refresh()
      } else {
        console.error('Error al reactivar token:', result.error)
      }
    } catch (error) {
      console.error('Error al reactivar token:', error)
    }
  }

  const handleDeleteToken = async (tokenId: string) => {
    try {
      const result = await deleteInvitationToken(tokenId)
      if (result.success) {
        router.refresh()
      } else {
        console.error('Error al eliminar token:', result.error)
      }
    } catch (error) {
      console.error('Error al eliminar token:', error)
    }
  }

  return (
    <Modal 
      isOpen={true} 
      onClose={handleClose}
      size="full"
      placement="center"
      scrollBehavior="inside"
      backdrop="blur"
      classNames={{
        backdrop: "bg-black/50 backdrop-blur-sm",
        base: "border-1 border-default-200 bg-background",
        header: "border-b-1 border-default-200",
        body: "py-6",
        footer: "border-t-1 border-default-200"
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center justify-between w-full">
            <h2 className="text-xl font-bold">Detalles de la Invitación</h2>
          </div>
        </ModalHeader>
        
        <ModalBody className="gap-6">
          {/* Información de la invitación */}
          <Card>
            <CardBody className="gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Información del Invitado</h3>
                {getStatusChip(invitation)}
              </div>
              
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
                      <span className="italic">&ldquo;{invitation.guestNickname}&rdquo;</span>
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
                        <span>{formatDateTime(invitation.respondedAt)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <Divider />
              
              <div className="flex items-center gap-2 text-sm text-default-500">
                <Clock size={14} />
                                    <span>Creada el {formatDateTime(invitation.createdAt)}</span>
              </div>
            </CardBody>
          </Card>

          {/* Tabla de tokens */}
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Tokens de Acceso</h3>
                <div className="flex items-center gap-2">
                  <Chip color="primary" variant="flat" size="sm">
                    {invitation.tokens.length} token{invitation.tokens.length !== 1 ? 's' : ''}
                  </Chip>
                  <Tooltip content="Crear nuevo token de acceso">
                    <Button
                      size="sm"
                      color="primary"
                      variant="flat"
                      startContent={<Plus size={16} />}
                      onPress={handleCreateToken}
                      isLoading={isCreatingToken}
                      isDisabled={isCreatingToken}
                    >
                      Generar Token
                    </Button>
                  </Tooltip>
                </div>
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
                  <TableColumn>DISPOSITIVO</TableColumn>
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
                            {token.id.substring(0, 8)}...
                          </code>
                          <Tooltip content="Copiar invitación">
                            <Button
                              size="sm"
                              variant="light"
                              isIconOnly
                              onPress={() => copyToClipboard(token.id)}
                            >
                              {copiedToken === token.id ? (
                                <Check size={14} className="text-success" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </Button>
                          </Tooltip>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Tooltip 
                          content={
                            token.isUsed && token.deviceId 
                              ? "Token vinculado a un dispositivo específico. No se puede usar desde otros dispositivos."
                              : undefined
                          }
                        >
                          <div>
                            {getTokenStatusChip(token)}
                          </div>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        {token.accessCount}
                      </TableCell>
                      <TableCell>
                        {token.userAgent ? (
                          <div className="text-xs">
                            <div className="font-medium text-primary">
                              {getDeviceInfo(token.userAgent)}
                            </div>
                            <div className="text-default-500 max-w-[200px] overflow-x-auto whitespace-nowrap">
                              {token.userAgent}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-default-400 italic">
                            No usado aún
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDateTime(token.firstAccessAt)}
                      </TableCell>
                      <TableCell>
                        {formatDateTime(token.lastAccessAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Tooltip content="Abrir invitación">
                            <Button
                              size="sm"
                              variant="light"
                              color="primary"
                              isIconOnly
                              onPress={() => openInvitationLink(token.id)}
                              isDisabled={!token.isActive}
                            >
                              <ExternalLink size={14} />
                            </Button>
                          </Tooltip>
                          
                          {token.isActive ? (
                            <Tooltip content="Revocar token">
                              <Button
                                size="sm"
                                variant="light"
                                color="warning"
                                isIconOnly
                                onPress={() => handleRevokeToken(token.id)}
                              >
                                <Ban size={14} />
                              </Button>
                            </Tooltip>
                          ) : (
                            <Tooltip content="Reactivar token">
                              <Button
                                size="sm"
                                variant="light"
                                color="success"
                                isIconOnly
                                onPress={() => handleReactivateToken(token.id)}
                              >
                                <RotateCcw size={14} />
                              </Button>
                            </Tooltip>
                          )}
                          
                          <Tooltip content="Eliminar token">
                            <Button
                              size="sm"
                              variant="light"
                              color="danger"
                              isIconOnly
                              onPress={() => handleDeleteToken(token.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
