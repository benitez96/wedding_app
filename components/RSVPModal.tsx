'use client'

import { useState, useEffect } from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react'
import { Users, Heart } from 'lucide-react'
import { getCurrentUser, updateInvitationResponse } from '@/app/actions/invitations'
import CustomRadioGroup from './sections/RSVPStatus/CustomRadioGroup'
import GuestCountSelector from './GuestCountSelector'
import { useCSRF } from '@/hooks/useCSRF'

interface RSVPModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function RSVPModal({ isOpen, onClose, onSuccess }: RSVPModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [response, setResponse] = useState<'attending' | 'declining' | null>(null)
  const [guestCount, setGuestCount] = useState<number>(1)
  const [error, setError] = useState('')
  const { csrfData } = useCSRF()

  useEffect(() => {
    if (isOpen) {
      loadUserData()
    }
  }, [isOpen])

  const loadUserData = async () => {
    try {
      const result = await getCurrentUser()
      if (result.success && result.user) {
        setUser(result.user)
        
        // Si ya respondió, cargar su respuesta actual
        if (result.user.hasResponded) {
          setResponse(result.user.isAttending ? 'attending' : 'declining')
          setGuestCount(result.user.guestCount || result.user.maxGuests)
        } else {
          setResponse(null)
          setGuestCount(result.user.maxGuests)
        }
      } else {
        setError('No se pudo cargar la información de la invitación')
      }
    } catch (error) {
      setError('Error al cargar la información')
    }
  }

  const handleSubmit = async () => {
    if (!response || !user) return

    setIsLoading(true)
    setError('')

    try {
      const result = await updateInvitationResponse({
        isAttending: response === 'attending',
        guestCount: response === 'attending' ? guestCount : null,
        csrfToken: csrfData?.token
      })

      if (result.success) {
        onSuccess()
        onClose()
        // Resetear el formulario
        setResponse(null)
        setGuestCount(1)
      } else {
        setError(result.error || 'Error al enviar la respuesta')
      }
    } catch (error) {
      setError('Error al procesar la respuesta')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
      setError('')
    }
  }

  const getModalTitle = () => {
    if (!user) return 'Confirmar Asistencia'
    return user.hasResponded ? 'Cambiar Respuesta' : 'Confirmar Asistencia'
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 text-center">
          <div className="flex justify-center mb-2">
            <Heart className="text-pink-500" size={32} />
          </div>
          <h3 className="text-xl font-bold">{getModalTitle()}</h3>
          <p className="text-sm text-default-500">
            {user?.guestNickname ? `${user.guestNickname}` : user?.guestName}
          </p>
        </ModalHeader>
        
        <ModalBody className="space-y-6">
          {error && (
            <div className="bg-danger-50 border border-danger-200 rounded-lg p-3">
              <p className="text-danger-600 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-4 text-center">¿Vas a asistir a nuestra boda?</h4>
              <CustomRadioGroup
                value={response}
                onValueChange={setResponse}
              />
            </div>

            {response === 'attending' && user?.maxGuests > 1 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <label className="font-medium">¿Cuántas personas van a asistir?</label>
                </div>
                <div className="flex items-center gap-3">
                  <GuestCountSelector
                    value={guestCount}
                    onChange={setGuestCount}
                    min={1}
                    max={user?.maxGuests || 1}
                  />
                  <span className="text-sm text-default-500">
                    de {user?.maxGuests} máximo
                  </span>
                </div>
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="light"
            onPress={handleClose}
            isDisabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={isLoading}
            isDisabled={!response}
          >
            {user?.hasResponded ? 'Actualizar Respuesta' : (response === 'attending' ? 'Confirmar Asistencia' : 'Enviar Respuesta')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
