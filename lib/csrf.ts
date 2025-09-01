import { randomBytes, createHmac } from 'crypto'
import { JWT_SECRET } from './config'

// Configuración CSRF
const CSRF_CONFIG = {
  TOKEN_LENGTH: 32,
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

// Obtener token CSRF para formularios (sin cookies)
export async function getCSRFTokenForForm(): Promise<{ token: string; fieldName: string; hash: string }> {
  const token = generateCSRFToken()
  const hash = createCSRFHash(token)
  return {
    token,
    fieldName: CSRF_CONFIG.FORM_FIELD_NAME,
    hash
  }
}

// Validar token CSRF desde formulario (versión completa)
export async function validateCSRFToken(token: string, hash?: string): Promise<boolean> {
  try {
    if (!token) {
      return false
    }
    
    // Si tenemos hash, validar contra él
    if (hash) {
      return verifyCSRFToken(token, hash)
    }
    
    // Si no tenemos hash, verificar formato básico
    if (token.length < 32) {
      return false
    }
    
    // Verificar que el token sea hexadecimal válido
    if (!/^[a-f0-9]+$/i.test(token)) {
      return false
    }
    
    return true
  } catch (error) {
    return false
  }
}

// Wrapper para proteger server actions con CSRF
export function withCSRFProtection<R>(
  action: (formData: FormData) => Promise<R>
) {
  return async (formData: FormData): Promise<R> => {
    const token = formData.get(CSRF_CONFIG.FORM_FIELD_NAME) as string
    const hash = formData.get('_csrf_hash') as string
    
    if (!token || !(await validateCSRFToken(token, hash))) {
      throw new Error('Token CSRF inválido')
    }
    
    return action(formData)
  }
}
