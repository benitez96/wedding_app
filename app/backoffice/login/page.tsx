'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authenticateAdmin } from '@/app/actions/admin'
import { Button, Input, Card, CardBody, CardHeader } from '@heroui/react'
import { Eye, EyeOff, Lock, User } from 'lucide-react'

// Función para loggear eventos de honeypot
const logHoneypotEvent = (value: string) => {
  console.log('🍯 Honeypot triggered:', {
    value,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  })
}

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Verificar honeypot
    const formData = new FormData(e.target as HTMLFormElement)
    const honeypotValue = formData.get('website')
    
    if (honeypotValue) {
      // Si el honeypot está lleno, es probablemente un bot
      logHoneypotEvent(honeypotValue as string)
      setError('Usuario o contraseña incorrectos')
      setIsLoading(false)
      return
    }

    try {
      const result = await authenticateAdmin(username, password)
      
      if (result.success) {
        // Redirigir al dashboard del backoffice
        router.push('/backoffice')
        router.refresh()
      } else {
              setError('Usuario o contraseña incorrectos')
      }
    } catch (error) {
      console.error('Error en login:', error)
      setError('Usuario o contraseña incorrectos')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Panel de Administración
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Ingresa tus credenciales para acceder
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="pb-0">
            <h3 className="text-lg font-medium text-gray-900">Iniciar Sesión</h3>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  type="text"
                  label="Usuario"
                  placeholder="Ingresa tu usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  startContent={<User className="w-4 h-4" />}
                  isRequired
                  isDisabled={isLoading}
                />
              </div>

              {/* Honeypot field - oculto para usuarios reales, visible para bots */}
              <div className="absolute left-[-9999px] opacity-0 pointer-events-none">
                <Input
                  type="text"
                  name="website"
                  placeholder="No llenar este campo"
                  autoComplete="off"
                  tabIndex={-1}
                />
              </div>

              <div>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  label="Contraseña"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  startContent={<Lock className="w-4 h-4" />}
                  endContent={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  }
                  isRequired
                  isDisabled={isLoading}
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                  {error === 'credenciales-invalidas' 
                    ? 'Usuario o contraseña incorrectos'
                    : error === 'error-autenticando'
                    ? 'Error al autenticar. Intenta nuevamente.'
                    : error
                  }
                </div>
              )}

              <Button
                type="submit"
                color="primary"
                className="w-full"
                isLoading={isLoading}
                isDisabled={!username || !password}
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
