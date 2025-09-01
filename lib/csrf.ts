import { cookies } from 'next/headers'
import { randomBytes, createHmac } from 'crypto'
import { JWT_SECRET } from './config'

// Configuración CSRF
const CSRF_CONFIG = {
  TOKEN_LENGTH: 32,
  SESSION_KEY: 'csrf-token',
  HEADER_NAME: 'x-csrf-token',
  FORM_FIELD_NAME: '_csrf'
}

// Generar token CSRF
export function generateCSRFToken(): string {
  return randomBytes(CSRF_CONFIG.TOKEN_LENGTH).toString('hex')
}

// Crear hash del token para verificación
export function createCSRFHash(token: string): string {
  const hmac = createHmac('sha256', JWT_SECRET)
  hmac.update(token)
  return hmac.digest('hex')
}

// Verificar token CSRF
export function verifyCSRFToken(token: string, hash: string): boolean {
  const expectedHash = createCSRFHash(token)
  return expectedHash === hash
}

// Obtener token CSRF de la sesión
export async function getCSRFToken(): Promise<string> {
  const cookieStore = await cookies()
  const existingToken = cookieStore.get(CSRF_CONFIG.SESSION_KEY)
  
  if (existingToken) {
    // Si ya existe un token, necesitamos regenerarlo porque solo tenemos el hash
    // En una implementación real, podrías almacenar el token en session storage
    // Por ahora, regeneramos
  }
  
  // Generar nuevo token
  const newToken = generateCSRFToken()
  const tokenHash = createCSRFHash(newToken)
  
  // Configuración de cookies mejorada para producción
  const cookieOptions: any = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 // 1 hora
  }
  
  // En producción, configurar dominio si está disponible
  if (process.env.NODE_ENV === 'production' && process.env.DOMAIN) {
    cookieOptions.domain = process.env.DOMAIN
  }
  
  // Guardar el hash en cookie
  cookieStore.set(CSRF_CONFIG.SESSION_KEY, tokenHash, cookieOptions)
  
  return newToken
}

// Validar token CSRF desde formulario o header
export async function validateCSRFToken(token: string): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const storedHash = cookieStore.get(CSRF_CONFIG.SESSION_KEY)
    
    if (!storedHash || !token) {
      console.log('CSRF validation failed: missing token or stored hash', {
        hasToken: !!token,
        hasStoredHash: !!storedHash,
        tokenLength: token?.length,
        storedHashLength: storedHash?.value?.length
      })
      return false
    }
    
    const isValid = verifyCSRFToken(token, storedHash.value)
    
    if (!isValid) {
      console.log('CSRF validation failed: token mismatch', {
        tokenLength: token.length,
        storedHashLength: storedHash.value.length
      })
    }
    
    return isValid
  } catch (error) {
    console.error('Error validando CSRF token:', error)
    return false
  }
}

// Limpiar token CSRF
export async function clearCSRFToken(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(CSRF_CONFIG.SESSION_KEY)
}

// Wrapper para proteger server actions con CSRF
export function withCSRFProtection<R>(
  action: (formData: FormData) => Promise<R>
) {
  return async (formData: FormData): Promise<R> => {
    const token = formData.get(CSRF_CONFIG.FORM_FIELD_NAME) as string
    
    if (!token || !(await validateCSRFToken(token))) {
      throw new Error('Token CSRF inválido')
    }
    
    return action(formData)
  }
}

// Función para obtener token CSRF para formularios
export async function getCSRFTokenForForm(): Promise<{ token: string; fieldName: string }> {
  const token = await getCSRFToken()
  return {
    token,
    fieldName: CSRF_CONFIG.FORM_FIELD_NAME
  }
}
