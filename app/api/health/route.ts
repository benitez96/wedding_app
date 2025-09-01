import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Verificar que la aplicación está funcionando
    return NextResponse.json(
      { 
        status: 'ok'
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error'
      },
      { status: 503 }
    )
  }
}
