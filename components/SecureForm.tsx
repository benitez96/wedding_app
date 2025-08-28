'use client'

import { useState, useEffect } from 'react'
import { getCSRFTokenForForm } from '@/lib/csrf'

interface SecureFormProps {
  action: (formData: FormData) => Promise<any>
  children: React.ReactNode
  className?: string
  onSuccess?: (result: any) => void
  onError?: (error: string) => void
}

export default function SecureForm({ 
  action, 
  children, 
  className = '',
  onSuccess,
  onError 
}: SecureFormProps) {
  const [csrfToken, setCsrfToken] = useState<string>('')
  const [fieldName, setFieldName] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Obtener token CSRF al montar el componente
    const fetchCSRFToken = async () => {
      try {
        const response = await fetch('/api/csrf-token')
        if (response.ok) {
          const data = await response.json()
          setCsrfToken(data.token)
          setFieldName(data.fieldName)
        }
      } catch (error) {
        console.error('Error obteniendo token CSRF:', error)
      }
    }

    fetchCSRFToken()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      
      // Agregar token CSRF al formulario
      if (csrfToken && fieldName) {
        formData.append(fieldName, csrfToken)
      }

      const result = await action(formData)
      
      if (result.success) {
        onSuccess?.(result)
      } else {
        onError?.(result.error || 'Error desconocido')
      }
    } catch (error) {
      console.error('Error en formulario:', error)
      onError?.('Error al procesar el formulario')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      {children}
      {isLoading && (
        <div className="text-sm text-gray-500 mt-2">
          Procesando...
        </div>
      )}
    </form>
  )
}
