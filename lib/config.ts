/**
 * Configuración centralizada y segura de variables de entorno
 */

export function getRequiredEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Variable de entorno requerida: ${name}`)
  }
  return value
}

export function getOptionalEnvVar(name: string, defaultValue?: string): string | undefined {
  return process.env[name] || defaultValue
}

// Variables críticas de seguridad
export const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-for-development-only'
export const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/wedding_app'

// Variables opcionales con valores por defecto seguros
export const NODE_ENV = getOptionalEnvVar('NODE_ENV', 'development')
export const PORT = getOptionalEnvVar('PORT', '3000')

// Configuración de seguridad
export const SECURITY_CONFIG = {
  // JWT
  JWT_ALGORITHM: 'HS512' as const,
  JWT_ISSUER: 'wedding-app',
  JWT_ADMIN_AUDIENCE: 'wedding-admin',
  JWT_INVITATION_AUDIENCE: 'wedding-invitation',
  
  // Cookies
  COOKIE_SECURE: NODE_ENV === 'production',
  COOKIE_SAME_SITE: 'lax' as const,
  
  // Rate limiting
  RATE_LIMIT_WINDOWS: {
    'invitation-token': 15 * 60 * 1000, // 15 minutos
    'admin-login': 15 * 60 * 1000, // 15 minutos
    'invitation-actions': 60 * 60 * 1000 // 1 hora
  },
  
  // Sesiones
  ADMIN_SESSION_DURATION: 24 * 60 * 60, // 24 horas
  INVITATION_SESSION_DURATION: 180 * 24 * 60 * 60 // 180 días
}

// Validar configuración crítica solo en producción
if (NODE_ENV === 'production') {
  if (JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres')
  }
  
  if (JWT_SECRET === 'default-secret-for-development-only' || JWT_SECRET === 'secret-jwt') {
    throw new Error('JWT_SECRET no puede ser el valor por defecto en producción')
  }
}
