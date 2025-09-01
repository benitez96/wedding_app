'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUserData } from '@/app/actions/protected-invitations'
import LoadingSpinner from './LoadingSpinner'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const result = await getCurrentUserData()
        
        if (result.success && result.user) {
          setIsAuthenticated(true)
        } else {
          // Usuario no autenticado, redirigir a error
          router.push('/error?message=necesita-invitacion')
          return
        }
      } catch (error) {
        console.error('Error al verificar autenticación:', error)
        router.push('/error?message=error-verificando-autenticacion')
        return
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    return null // No renderizar nada mientras se redirige
  }

  return <>{children}</>
}
