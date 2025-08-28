import { NextRequest, NextResponse } from 'next/server'
import { exportConfirmedGuestsToExcel } from '@/app/actions/backoffice'

export async function GET(request: NextRequest) {
  try {
    const result = await exportConfirmedGuestsToExcel()
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    // Crear la respuesta con el archivo Excel
    const response = new NextResponse(result.data)
    
    // Configurar headers para descarga
    response.headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response.headers.set('Content-Disposition', `attachment; filename="${result.filename}"`)
    
    return response
  } catch (error) {
    console.error('Error en endpoint de exportación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
