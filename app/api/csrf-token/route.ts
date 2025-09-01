import { NextRequest, NextResponse } from 'next/server'
import { getCSRFTokenForForm } from '@/lib/csrf'

export async function GET(request: NextRequest) {
  try {
    // Verificar que la petición viene del mismo origen
    const origin = request.headers.get('origin')
    const referer = request.headers.get('referer')
    const host = request.headers.get('host')
    
    // En producción, verificar origen de manera estricta
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = process.env.CORS_ORIGIN?.split(',').filter(Boolean) || []
      const domain = process.env.DOMAIN
      
      // Validar que CORS_ORIGIN esté configurado
      if (allowedOrigins.length === 0) {
        console.error('CSRF: CORS_ORIGIN no configurado en producción')
        return NextResponse.json(
          { error: 'Configuración de seguridad incompleta' },
          { status: 500 }
        )
      }
      
      // Verificar si el origen está permitido
      if (origin && allowedOrigins.length > 0) {
        const isAllowed = allowedOrigins.some(allowedOrigin => {
          return origin === allowedOrigin || 
                 origin.endsWith(`.${allowedOrigin.replace('https://', '')}`)
        })
        
        if (!isAllowed) {
          console.error('CSRF: Origin not allowed', { origin, allowedOrigins })
          return NextResponse.json(
            { error: 'Origen no permitido' },
            { status: 403 }
          )
        }
      }
    }

    // Obtener token CSRF con hash
    const { token, fieldName, hash } = await getCSRFTokenForForm()

    const response = NextResponse.json({
      token,
      fieldName,
      hash,
      timestamp: Date.now()
    })
    
    // Agregar headers CORS si es necesario
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('Access-Control-Allow-Origin', origin || '*')
      response.headers.set('Access-Control-Allow-Credentials', 'true')
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    }

    return response
  } catch (error) {
    console.error('Error generando token CSRF:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Manejar preflight OPTIONS requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  
  const response = new NextResponse(null, { status: 200 })
  
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Access-Control-Allow-Origin', origin || '*')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }
  
  return response
}
