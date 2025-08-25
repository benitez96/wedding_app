'use client'

import { useState } from 'react'
import { createInvitation } from '../app/actions/invitations'
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  Button,
  Input,
  NumberInput,
  Form
} from '@heroui/react'

interface CreateInvitationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateInvitationModal({ isOpen, onClose, onSuccess }: CreateInvitationModalProps) {
  const [error, setError] = useState('')


  const handleAction = async (formData: FormData) => {
    try {
      const result = await createInvitation(formData)
      
      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.error || 'Error al crear la invitación')
      }
    } catch (error) {
      setError('Error inesperado al crear la invitación')
    }
  }

  const handleClose = () => {
    setError('')
    onClose()
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="md"
      placement="center"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">Crear Nueva Invitación</h2>
        </ModalHeader>
        
        <Form
          action={handleAction}
          className="flex flex-col gap-4"
        >
          <ModalBody
            className="w-full"
          >
            {error && (
              <div className="p-3 bg-danger-50 border border-danger-200 text-danger-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-4 w-full">
              <Input
                label="Nombre del Invitado"
                name="guestName"
                placeholder="Ej: Juan Pérez"
                variant="bordered"
                isRequired
                description="Nombre completo del invitado"
              />

              <Input
                label="Apodo"
                name="guestNickname"
                variant="bordered"
                description="Apodo o nombre de pila (opcional)"
              />

              <Input
                label="Teléfono"
                name="guestPhone"
                variant="bordered"
                type="tel"
                description="Número de teléfono (opcional)"
              />

              <NumberInput
                label="Máximo de Invitados"
                name="maxGuests"
                min={1}
                max={10}
                defaultValue={1}
                variant="bordered"
                isRequired
                description="Número máximo de invitados permitidos"
              />

            </div>
          </ModalBody>
          
          <ModalFooter
            className="w-full"
          >
            <Button 
              color="danger" 
              variant="light" 
              onPress={handleClose}
            >
              Cancelar
            </Button>
            <Button 
              color="primary" 
              type="submit"
            >
              Crear Invitación
            </Button>
          </ModalFooter>
        </Form>
      </ModalContent>
    </Modal>
  )
}
