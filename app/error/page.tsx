import { Card, CardBody, CardHeader } from '@heroui/react'
import { AlertTriangle, XCircle, Shield, Mail } from 'lucide-react'

interface ErrorPageProps {
  searchParams: {
    message?: string
  }
}

export default async function ErrorPage({ searchParams }: ErrorPageProps) {
  const { message } = await searchParams

  const getErrorInfo = (message?: string) => {
    switch (message) {
      case 'token-invalido':
        return {
          title: 'Token Inválido',
          description: 'El enlace de invitación no es válido o ha expirado.',
          icon: <XCircle className="text-danger" size={48} />,
          color: 'danger'
        }
      case 'token-ya-usado':
        return {
          title: 'Invitación ya utilizada',
          description: 'Esta invitación ya ha sido utilizada. Cada enlace de invitación solo puede ser utilizado una vez.',
          icon: <Shield className="text-warning" size={48} />,
          color: 'warning'
        }
      case 'necesita-invitacion':
        return {
          title: 'Necesitas una invitación',
          description: 'Para acceder a esta página necesitas un enlace de invitación. Por favor, contacta a los novios para obtener tu invitación.',
          icon: <Mail className="text-primary" size={48} />,
          color: 'primary'
        }
      case 'error-verificando-autenticacion':
        return {
          title: 'Error de Autenticación',
          description: 'Ocurrió un error al verificar tu autenticación. Por favor, intenta acceder nuevamente con tu enlace de invitación.',
          icon: <AlertTriangle className="text-warning" size={48} />,
          color: 'warning'
        }
      case 'error-procesando-token':
        return {
          title: 'Error del Sistema',
          description: 'Ocurrió un error al procesar tu invitación. Por favor, intenta nuevamente.',
          icon: <AlertTriangle className="text-danger" size={48} />,
          color: 'danger'
        }
      default:
        return {
          title: 'Error Desconocido',
          description: 'Ha ocurrido un error inesperado.',
          icon: <AlertTriangle className="text-default" size={48} />,
          color: 'default'
        }
    }
  }

  const errorInfo = getErrorInfo(message)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="flex flex-col items-center gap-4 pb-2">
          {errorInfo.icon}
          <h1 className="text-xl font-bold text-center">{errorInfo.title}</h1>
        </CardHeader>
        <CardBody className="text-center">
          <p className="text-default-600 mb-6">
            {errorInfo.description}
          </p>
          <p className="text-default-600 mb-6">
            Contactanos para obtener un nuevo enlace.
          </p>
        </CardBody>
      </Card>
    </div>
  )
}
