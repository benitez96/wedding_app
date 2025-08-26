'use client'

import { useState } from 'react'
import { deleteInvitation } from '../app/actions/invitations'
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  Button
} from '@heroui/react'
import { AlertTriangle } from 'lucide-react'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  invitation: { id: string; guestName: string } | null
}

export default function DeleteConfirmationModal({ isOpen, onClose, onSuccess, invitation }: DeleteConfirmationModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    if (!invitation) return

    setIsDeleting(true)
    setError('')

    try {
      const result = await deleteInvitation(invitation.id)
      
      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.error || 'Error al eliminar la invitación')
      }
    } catch (error) {
      setError('Error inesperado al eliminar la invitación')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    setError('')
    setIsDeleting(false)
    onClose()
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="sm"
      placement="center"
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
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-warning" size={20} />
            <h2 className="text-xl font-bold">Confirmar Eliminación</h2>
          </div>
        </ModalHeader>
        
        <ModalBody>
          {error && (
            <div className="p-3 bg-danger-50 border border-danger-200 text-danger-700 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <p className="text-default-600">
            ¿Estás seguro de que quieres eliminar la invitación de{' '}
            <span className="font-semibold">{invitation?.guestName}</span>?
          </p>
          <p className="text-sm text-default-500 mt-2">
            Esta acción no se puede deshacer y se eliminarán todos los datos asociados a esta invitación.
          </p>
        </ModalBody>
        
        <ModalFooter>
          <Button 
            color="default" 
            variant="light" 
            onPress={handleClose}
            isDisabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button 
            color="danger" 
            onPress={handleDelete}
            isLoading={isDeleting}
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
