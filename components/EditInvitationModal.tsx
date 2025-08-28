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
  NumberInput,
  Form
} from '@heroui/react'
import InvitationStatusSelect from './InvitationStatusSelect'
import { useCSRF } from '@/hooks/useCSRF'

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
    maxGuests: 1
  })
  const [invitationStatus, setInvitationStatus] = useState('pending')
  const [guestCount, setGuestCount] = useState(1)
  const { addCSRFToFormData } = useCSRF()

  // Actualizar el formulario cuando cambie la invitación
  useEffect(() => {
    if (invitation) {
      setFormData({
        guestName: invitation.guestName,
        guestNickname: invitation.guestNickname || '',
        guestPhone: invitation.guestPhone || '',
        maxGuests: invitation.maxGuests
      })

      // Determinar el estado de la invitación
      if (!invitation.hasResponded) {
        setInvitationStatus('pending')
        setGuestCount(1)
      } else if (invitation.isAttending) {
        setInvitationStatus('attending')
        setGuestCount(invitation.guestCount || 1)
      } else {
        setInvitationStatus('not_attending')
        setGuestCount(1)
      }
    }
  }, [invitation])

  const handleAction = async (formData: FormData) => {
    if (!invitation) return

    try {
      // Agregar token CSRF al formulario
      addCSRFToFormData(formData)

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
    setInvitationStatus('pending')
    setGuestCount(1)
    onClose()
  }

  const handleInputChange = (field: string, value: string | number) => {
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

              <NumberInput
                label="Máximo de Invitados"
                name="maxGuests"
                min={1}
                max={10}
                variant="bordered"
                isRequired
                description="Número máximo de invitados permitidos"
                value={formData.maxGuests}
                onValueChange={(value) => handleInputChange('maxGuests', value)}
              />

              <InvitationStatusSelect
                status={invitationStatus}
                guestCount={guestCount}
                maxGuests={formData.maxGuests}
                onStatusChange={setInvitationStatus}
                onGuestCountChange={setGuestCount}
              />

              {/* Campos ocultos para enviar los valores */}
              <input type="hidden" name="hasResponded" value={invitationStatus !== 'pending' ? 'true' : 'false'} />
              <input type="hidden" name="isAttending" value={invitationStatus === 'attending' ? 'true' : 'false'} />
              <input type="hidden" name="guestCount" value={invitationStatus === 'attending' ? guestCount : ''} />
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
