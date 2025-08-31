'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Card,
  CardBody,
  useDisclosure
} from '@heroui/react'
import { Edit, Trash2 } from 'lucide-react'
import { Invitation } from './types'
import EditInvitationModal from '@/components/EditInvitationModal'
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal'
import { formatDate } from '@/utils/date'

interface InvitationsTableProps {
  invitations: Invitation[]
  searchTerm: string
}

export default function InvitationsTable({ invitations, searchTerm }: InvitationsTableProps) {
  const router = useRouter()
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null)
  const [invitationToDelete, setInvitationToDelete] = useState<{ id: string; guestName: string } | null>(null)
  
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()

  const handleRowClick = (invitation: Invitation) => {
    router.push(`/backoffice/invitations/${invitation.id}`)
  }

  const getStatusChip = (invitation: Invitation) => {
    if (!invitation.hasResponded) {
      return <Chip color="warning" variant="flat" size="sm">Pendiente</Chip>
    }
    if (invitation.isAttending) {
      return <Chip color="success" variant="flat" size="sm">Confirmado</Chip>
    }
    return <Chip color="danger" variant="flat" size="sm">No asistirá</Chip>
  }

  const handleEditInvitation = (invitation: Invitation) => {
    setSelectedInvitation(invitation)
    onEditOpen()
  }

  const handleDeleteInvitation = (invitation: Invitation) => {
    setInvitationToDelete({ id: invitation.id, guestName: invitation.guestName })
    onDeleteOpen()
  }

  const handleInvitationUpdated = () => {
    // Recargar la página para obtener datos actualizados
    router.refresh()
    setSelectedInvitation(null)
    onEditClose()
  }

  const handleInvitationDeleted = () => {
    // Recargar la página para obtener datos actualizados
    router.refresh()
    setInvitationToDelete(null)
    onDeleteClose()
  }

    return (
    <>
      <Card className="mb-6">
        <CardBody className="p-0">
          <Table 
            aria-label="Tabla de invitaciones"
            classNames={{
              wrapper: "min-h-[400px]",
              th: "text-default-500 border-b border-divider bg-default-50",
              td: "border-b border-divider",
              tr: "hover:bg-default-50 transition-colors",
              tbody: "divide-y divide-divider"
            }}
            selectionMode="none"
          >
            <TableHeader>
              <TableColumn className="text-left">INVITADO</TableColumn>
              <TableColumn className="text-left">TELÉFONO</TableColumn>
              <TableColumn className="text-center">ESTADO</TableColumn>
              <TableColumn className="text-center">CONFIRMADOS</TableColumn>
              <TableColumn className="text-center">MÁX. INVITADOS</TableColumn>
              <TableColumn className="text-center">FECHA RESPUESTA</TableColumn>
              <TableColumn className="text-center">ACCIONES</TableColumn>
            </TableHeader>
            <TableBody 
              emptyContent={
                <div className="text-center py-8">
                  <p className="text-default-500">
                    {searchTerm ? 'No se encontraron invitaciones que coincidan con la búsqueda' : 'No hay invitaciones registradas'}
                  </p>
                </div>
              }
            >
              {invitations.map((invitation) => (
                <TableRow key={invitation.id} className="cursor-pointer" onClick={() => handleRowClick(invitation)}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-foreground">
                        {invitation.guestName}
                      </div>
                      {invitation.guestNickname && (
                        <div className="text-sm text-default-500">
                          &ldquo;{invitation.guestNickname}&rdquo;
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-default-600">
                      {invitation.guestPhone || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      {getStatusChip(invitation)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <span className="font-medium text-foreground">
                        {invitation.guestCount || '-'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <span className="font-medium text-foreground">
                        {invitation.maxGuests}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <span className="text-default-600">
                        {formatDate(invitation.respondedAt)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        size="sm"
                        variant="light"
                        color="primary"
                        isIconOnly
                        onPress={() => handleEditInvitation(invitation)}
                        className="text-default-400 hover:text-primary"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="light"
                        color="danger"
                        isIconOnly
                        onPress={() => handleDeleteInvitation(invitation)}
                        className="text-default-400 hover:text-danger"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Modales */}
      <EditInvitationModal
        isOpen={isEditOpen}
        onClose={onEditClose}
        onSuccess={handleInvitationUpdated}
        invitation={selectedInvitation}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onSuccess={handleInvitationDeleted}
        invitation={invitationToDelete}
      />
    </>
  )
}
