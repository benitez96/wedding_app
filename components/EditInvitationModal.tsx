'use client'

import { useState, useEffect } from 'react'
import { updateInvitation } from '../app/actions/invitations'
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  Button,
  Input,
  Form
} from '@heroui/react'

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

interface EditInvitationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  invitation: Invitation | null
}

export default function EditInvitationModal({ isOpen, onClose, onSuccess, invitation }: EditInvitationModalProps) {
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    guestName: '',
    guestNickname: '',
    guestPhone: '',
    maxGuests: '1'
  })

  // Actualizar el formulario cuando cambie la invitación
  useEffect(() => {
    if (invitation) {
      setFormData({
        guestName: invitation.guestName,
        guestNickname: invitation.guestNickname || '',
        guestPhone: invitation.guestPhone || '',
        maxGuests: invitation.maxGuests.toString()
      })
    }
  }, [invitation])

  const handleAction = async (formData: FormData) => {
    if (!invitation) return

    try {
      const result = await updateInvitation(invitation.id, formData)
      
      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.error || 'Error al actualizar la invitación')
      }
    } catch (error) {
      setError('Error inesperado al actualizar la invitación')
    }
  }

  const handleClose = () => {
    setError('')
    onClose()
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
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
          <h2 className="text-xl font-bold">Editar Invitación</h2>
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
                value={formData.guestName}
                onChange={(e) => handleInputChange('guestName', e.target.value)}
              />

              <Input
                label="Apodo"
                name="guestNickname"
                variant="bordered"
                description="Apodo o nombre de pila (opcional)"
                value={formData.guestNickname}
                onChange={(e) => handleInputChange('guestNickname', e.target.value)}
              />

              <Input
                label="Teléfono"
                name="guestPhone"
                variant="bordered"
                type="tel"
                description="Número de teléfono (opcional)"
                value={formData.guestPhone}
                onChange={(e) => handleInputChange('guestPhone', e.target.value)}
              />

              <Input
                label="Máximo de Invitados"
                name="maxGuests"
                type="number"
                min="1"
                max="10"
                variant="bordered"
                isRequired
                description="Número máximo de invitados permitidos"
                value={formData.maxGuests}
                onChange={(e) => handleInputChange('maxGuests', e.target.value)}
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
              Actualizar Invitación
            </Button>
          </ModalFooter>
        </Form>
      </ModalContent>
    </Modal>
  )
}
