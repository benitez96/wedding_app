'use client'

import { useEffect, useState } from 'react'
import { getCurrentUserData } from '@/app/actions/protected-invitations'
import { getWeddingDate } from '@/utils/date'
import RSVPReminderModal from './RSVPReminderModal'

export default function RSVPReminderHandler() {
  const [showModal, setShowModal] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)

  useEffect(() => {
    checkAndShowReminder()
  }, [])

  const checkAndShowReminder = async () => {
    try {
      // Obtener datos del usuario
      const userResult = await getCurrentUserData()
      
      if (!userResult.success || !userResult.user) {
        setHasChecked(true)
        return
      }

      // Verificar si el usuario ya respondió
      if (userResult.user.hasResponded) {
        setHasChecked(true)
        return
      }

      // Calcular días restantes
      // Como el contenedor Docker está configurado con timezone Argentina,
      // new Date() ya devuelve la hora correcta de Argentina
      const weddingDate = getWeddingDate()
      const today = new Date()
      const diffTime = weddingDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      // Obtener el número de días desde la variable de entorno (default: 40)
      const remindRestingDays = parseInt(process.env.NEXT_PUBLIC_REMIND_RESTING || '40', 10)

      // Mostrar modal si faltan menos de los días configurados
      if (diffDays < remindRestingDays && diffDays > 0) {
        setShowModal(true)
      }
    } catch (error) {
      console.error('Error al verificar recordatorio RSVP:', error)
    } finally {
      setHasChecked(true)
    }
  }

  const handleGoToRSVP = () => {
    // Cerrar el modal primero y luego hacer scroll
    setShowModal(false)
    
    // Usar un pequeño delay para asegurar que el modal se cierre y el DOM esté listo
    setTimeout(() => {
      const rsvpSection = document.getElementById('rsvp-section')
      if (rsvpSection) {
        // Calcular offset para compensar cualquier header fijo
        const yOffset = -20
        const y = rsvpSection.getBoundingClientRect().top + window.pageYOffset + yOffset
        window.scrollTo({ top: y, behavior: 'smooth' })
        
        // Disparar evento personalizado para abrir el modal de RSVP
        // Usar un delay adicional para que el scroll termine primero
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('openRSVPModal'))
        }, 500)
      }
    }, 300)
  }

  if (!hasChecked) {
    return null
  }

  return (
    <RSVPReminderModal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      onGoToRSVP={handleGoToRSVP}
    />
  )
}

