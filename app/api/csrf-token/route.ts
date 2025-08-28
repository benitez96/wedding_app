import { NextRequest, NextResponse } from 'next/server'
import { getCSRFTokenForForm } from '@/lib/csrf'

export async function GET(request: NextRequest) {
  try {
    // Verificar que la petición viene del mismo origen
    const origin = request.headers.get('origin')
    const referer = request.headers.get('referer')
    
    // En producción, verificar origen
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || []
      if (origin && !allowedOrigins.includes(origin)) {
        return NextResponse.json(
          { error: 'Origen no permitido' },
          { status: 403 }
        )
      }
    }

    // Obtener token CSRF
    const { token, fieldName } = await getCSRFTokenForForm()

    return NextResponse.json({
      token,
      fieldName,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('Error generando token CSRF:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
