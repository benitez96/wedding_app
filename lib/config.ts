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

// Variables críticas de seguridad - NO valores por defecto
export const JWT_SECRET = getRequiredEnvVar('JWT_SECRET')
export const DATABASE_URL = getRequiredEnvVar('DATABASE_URL')

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
  COOKIE_HTTP_ONLY: true,
  
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

// Validación de configuración crítica
function validateSecurityConfig() {
  if (JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres')
  }
  
  if (JWT_SECRET === 'default-secret-for-development-only' || 
      JWT_SECRET === 'secret-jwt' ||
      JWT_SECRET === 'tu-super-secreto-jwt-de-al-menos-32-caracteres-aqui') {
    throw new Error('JWT_SECRET no puede ser un valor de ejemplo')
  }
  
  if (NODE_ENV === 'production') {
    if (!DATABASE_URL.includes('ssl=true') && !DATABASE_URL.includes('sslmode=require')) {
      console.warn('⚠️  ADVERTENCIA: DATABASE_URL no incluye SSL en producción')
    }
  }
}

// Ejecutar validaciones
validateSecurityConfig()
