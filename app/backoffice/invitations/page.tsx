'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getInvitations, createInvitation, updateInvitation, deleteInvitation } from '@/app/actions/invitations'
import CreateInvitationModal from '@/components/CreateInvitationModal'
import EditInvitationModal from '@/components/EditInvitationModal'
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal'
import {
  Button,
  Input,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Card,
  CardBody,
  Spinner,
  useDisclosure
} from '@heroui/react'
import { Search, Plus, Edit, Trash2, Eye } from 'lucide-react'

interface Invitation {
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
}

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null)
  const [invitationToDelete, setInvitationToDelete] = useState<{ id: string; guestName: string } | null>(null)
  const router = useRouter()
  
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { 
    isOpen: isEditOpen, 
    onOpen: onEditOpen, 
    onClose: onEditClose 
  } = useDisclosure()
  const { 
    isOpen: isDeleteOpen, 
    onOpen: onDeleteOpen, 
    onClose: onDeleteClose 
  } = useDisclosure()

  // Cargar invitaciones
  useEffect(() => {
    fetchInvitations()
  }, [])

  // Buscar invitaciones cuando cambie el término de búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchInvitations(searchTerm)
      }
    }, 300) // Debounce de 300ms

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const fetchInvitations = async (search?: string) => {
    try {
      if (search !== undefined) {
        setSearchLoading(true)
      }
      
      const result = await getInvitations(search)
      if (result.success && result.data) {
        setInvitations(result.data)
      } else {
        console.error('Error:', result.error)
      }
    } catch (error) {
      console.error('Error al cargar invitaciones:', error)
    } finally {
      setLoading(false)
      setSearchLoading(false)
    }
  }

  const handleCreateInvitation = () => {
    onOpen()
  }

  const handleInvitationCreated = () => {
    fetchInvitations(searchTerm)
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
    fetchInvitations(searchTerm)
    setSelectedInvitation(null)
  }

  const handleInvitationDeleted = () => {
    fetchInvitations(searchTerm)
    setInvitationToDelete(null)
  }

  const handleRowClick = (invitation: Invitation) => {
    router.push(`/backoffice/invitations/${invitation.id}`)
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-ES')
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Invitaciones</h1>
        <Button
          color="primary"
          onPress={handleCreateInvitation}
          startContent={<Plus size={18} />}
        >
          Crear Invitación
        </Button>
      </div>

      {/* Filtro de búsqueda */}
      <div className="mb-6">
        <Input
          placeholder="Buscar por nombre o apodo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          startContent={<Search size={18} className="text-default-400" />}
          endContent={searchLoading && <Spinner size="sm" />}
          variant="bordered"
          className="max-w-xs"
        />
      </div>

      {/* Tabla de invitaciones */}
      <Table 
        aria-label="Tabla de invitaciones"
        className="mb-6"
      >
        <TableHeader>
          <TableColumn>INVITADO</TableColumn>
          <TableColumn>TELÉFONO</TableColumn>
          <TableColumn>MÁX. INVITADOS</TableColumn>
          <TableColumn>ESTADO</TableColumn>
          <TableColumn>CONFIRMADOS</TableColumn>
          <TableColumn>FECHA RESPUESTA</TableColumn>
          <TableColumn>ACCIONES</TableColumn>
        </TableHeader>
        <TableBody emptyContent={
          searchTerm ? 'No se encontraron invitaciones que coincidan con la búsqueda' : 'No hay invitaciones registradas'
        }>
          {invitations.map((invitation) => (
            <TableRow key={invitation.id}>
              <TableCell>
                <div 
                  className="cursor-pointer hover:bg-default-50 p-2 -m-2 rounded transition-colors flex items-center justify-between group"
                  onClick={() => handleRowClick(invitation)}
                >
                  <div>
                    <div className="font-medium">
                      {invitation.guestName}
                    </div>
                    {invitation.guestNickname && (
                      <div className="text-sm text-default-500">
                        "{invitation.guestNickname}"
                      </div>
                    )}
                  </div>
                  <Eye size={16} className="text-default-400 group-hover:text-primary transition-colors" />
                </div>
              </TableCell>
              <TableCell>
                {invitation.guestPhone || '-'}
              </TableCell>
              <TableCell>
                {invitation.maxGuests}
              </TableCell>
              <TableCell>
                {getStatusChip(invitation)}
              </TableCell>
              <TableCell>
                {invitation.guestCount || '-'}
              </TableCell>
              <TableCell>
                {formatDate(invitation.respondedAt)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="light"
                    color="primary"
                    isIconOnly
                    onPress={() => handleEditInvitation(invitation)}
                  >
                    <Edit size={16} />
                  </Button>
                  <Button
                    size="sm"
                    variant="light"
                    color="danger"
                    isIconOnly
                    onPress={() => handleDeleteInvitation(invitation)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-primary">{invitations.length}</div>
            <div className="text-sm text-default-500">Total Invitaciones</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-warning">
              {invitations.filter(i => !i.hasResponded).length}
            </div>
            <div className="text-sm text-default-500">Pendientes</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-success">
              {invitations.filter(i => i.isAttending).length}
            </div>
            <div className="text-sm text-default-500">Confirmados</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-danger">
              {invitations.filter(i => i.hasResponded && !i.isAttending).length}
            </div>
            <div className="text-sm text-default-500">No Asistirán</div>
          </CardBody>
        </Card>
      </div>

      {/* Modal para crear invitación */}
      <CreateInvitationModal
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={handleInvitationCreated}
      />

      {/* Modal para editar invitación */}
      <EditInvitationModal
        isOpen={isEditOpen}
        onClose={onEditClose}
        onSuccess={handleInvitationUpdated}
        invitation={selectedInvitation}
      />

      {/* Modal de confirmación para eliminar */}
      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onSuccess={handleInvitationDeleted}
        invitation={invitationToDelete}
      />
    </div>
  )
}
