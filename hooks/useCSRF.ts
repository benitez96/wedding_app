import { useState, useEffect } from 'react'

interface CSRFData {
  token: string
  fieldName: string
  hash: string
}

export function useCSRF() {
  const [csrfData, setCsrfData] = useState<CSRFData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCSRFToken = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch('/api/csrf-token')
        if (response.ok) {
          const data = await response.json()
          setCsrfData({
            token: data.token,
            fieldName: data.fieldName,
            hash: data.hash
          })
        } else {
          setError('Error obteniendo token CSRF')
        }
      } catch (error) {
        console.error('Error obteniendo token CSRF:', error)
        setError('Error de conexión')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCSRFToken()
  }, [])

  const addCSRFToFormData = (formData: FormData) => {
    if (csrfData) {
      formData.append(csrfData.fieldName, csrfData.token)
      formData.append('_csrf_hash', csrfData.hash)
    }
  }

  return {
    csrfData,
    isLoading,
    error,
    addCSRFToFormData
  }
}
