import { Card, CardBody, CardHeader } from '@heroui/react'
import { AlertTriangle, XCircle, Shield } from 'lucide-react'

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
          title: 'Invitación Ya Utilizada',
          description: 'Esta invitación ya ha sido utilizada. Cada enlace de invitación solo puede ser utilizado una vez.',
          icon: <Shield className="text-warning" size={48} />,
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="flex flex-col items-center gap-4 pb-2">
          {errorInfo.icon}
          <h1 className="text-xl font-bold text-center">{errorInfo.title}</h1>
        </CardHeader>
        <CardBody className="text-center">
          <p className="text-default-600 mb-6">
            {errorInfo.description}
          </p>
          
          {message === 'token-ya-usado-otro-dispositivo' && (
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-4">
              <p className="text-warning-800 text-sm">
                <strong>¿Necesitas ayuda?</strong><br />
                Contacta a los organizadores para solicitar un nuevo enlace de invitación.
              </p>
            </div>
          )}
          
          <a 
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Volver al Inicio
          </a>
        </CardBody>
      </Card>
    </div>
  )
}
