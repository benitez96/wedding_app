'use client'

import { useState, useEffect } from 'react'
import { Select, SelectItem, NumberInput } from '@heroui/react'

interface InvitationStatusSelectProps {
  status: string
  guestCount: number
  maxGuests: number
  onStatusChange: (status: string) => void
  onGuestCountChange: (count: number) => void
  disabled?: boolean
}

export default function InvitationStatusSelect({
  status,
  guestCount,
  maxGuests,
  onStatusChange,
  onGuestCountChange,
  disabled = false
}: InvitationStatusSelectProps) {
  const [localStatus, setLocalStatus] = useState(status)
  const [localGuestCount, setLocalGuestCount] = useState(guestCount)

  useEffect(() => {
    setLocalStatus(status)
  }, [status])

  useEffect(() => {
    setLocalGuestCount(guestCount)
  }, [guestCount])

  // Validar guestCount cuando cambie maxGuests
  useEffect(() => {
    if (localStatus === 'attending' && localGuestCount > maxGuests) {
      const newCount = maxGuests
      setLocalGuestCount(newCount)
      onGuestCountChange(newCount)
    }
  }, [maxGuests, localStatus, localGuestCount, onGuestCountChange])

  const handleStatusChange = (newStatus: string) => {
    setLocalStatus(newStatus)
    onStatusChange(newStatus)
    
    // Resetear guestCount cuando no es "attending"
    if (newStatus !== 'attending') {
      setLocalGuestCount(1)
      onGuestCountChange(1)
    } else {
      // Si es "attending", establecer el valor mínimo
      const newCount = Math.max(1, Math.min(localGuestCount, maxGuests))
      setLocalGuestCount(newCount)
      onGuestCountChange(newCount)
    }
  }

  const handleGuestCountChange = (newCount: number) => {
    setLocalGuestCount(newCount)
    onGuestCountChange(newCount)
  }

  return (
    <div className="flex flex-col gap-4">
      <Select
        label="Estado de la Invitación"
        value={localStatus}
        onSelectionChange={(keys) => {
          const selectedKey = Array.from(keys)[0] as string
          handleStatusChange(selectedKey)
        }}
        variant="bordered"
        isRequired
        disabled={disabled}
        description="Estado actual de la respuesta del invitado"
      >
        <SelectItem key="pending" >
          Pendiente
        </SelectItem>
        <SelectItem key="attending" >
          Asistirá
        </SelectItem>
        <SelectItem key="not_attending" >
          No asistirá
        </SelectItem>
      </Select>

      {localStatus === 'attending' && (
        <NumberInput
          label="Número de Asistentes"
          value={localGuestCount}
          onValueChange={handleGuestCountChange}
          min={1}
          max={maxGuests}
          variant="bordered"
          isRequired
          description={`Máximo ${maxGuests} invitados permitidos`}
          disabled={disabled}
        />
      )}
    </div>
  )
}
