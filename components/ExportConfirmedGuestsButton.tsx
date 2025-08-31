'use client'

import { Button } from '@heroui/button'
import { FileSpreadsheet } from 'lucide-react'
import { useState } from 'react'

export default function ExportConfirmedGuestsButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleExport = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/backoffice/export-confirmed-guests')
      
      if (!response.ok) {
        throw new Error('Error al exportar datos')
      }

      // Obtener el blob del archivo
      const blob = await response.blob()
      
      // Crear URL para descarga
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invitados-confirmados-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      
      // Limpiar
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error al exportar:', error)
      alert('Error al exportar los datos. Por favor, intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      color="success"
      variant="flat"
      startContent={isLoading ? undefined : <FileSpreadsheet className="w-4 h-4" />}
      isLoading={isLoading}
      onClick={handleExport}
      className="w-full"
    >
      {isLoading ? 'Generando...' : 'Exportar Confirmados'}
    </Button>
  )
}
