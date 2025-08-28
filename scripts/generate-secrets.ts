#!/usr/bin/env node

import { randomBytes } from 'crypto'

/**
 * Script para generar secretos seguros para producción
 * Uso: npx tsx scripts/generate-secrets.ts
 */

function generateSecureSecret(length: number = 64): string {
  return randomBytes(length).toString('hex')
}

function generateJWTSecret(): string {
  return generateSecureSecret(32) // 64 caracteres hex = 32 bytes
}

function generateDatabasePassword(): string {
  return generateSecureSecret(16) // 32 caracteres hex = 16 bytes
}

function generateAPIKey(): string {
  return `sk_${generateSecureSecret(24)}` // 48 caracteres + prefijo
}

function main() {
  console.log('🔐 Generando secretos seguros para producción...\n')
  
  const secrets = {
    JWT_SECRET: generateJWTSecret(),
    DATABASE_PASSWORD: generateDatabasePassword(),
    API_KEY: generateAPIKey(),
    SESSION_SECRET: generateSecureSecret(32),
    ENCRYPTION_KEY: generateSecureSecret(32)
  }
  
  console.log('📋 Secretos generados:')
  console.log('='.repeat(50))
  
  Object.entries(secrets).forEach(([key, value]) => {
    console.log(`${key}=${value}`)
  })
  
  console.log('\n📝 Variables de entorno recomendadas:')
  console.log('='.repeat(50))
  
  Object.entries(secrets).forEach(([key, value]) => {
    console.log(`export ${key}="${value}"`)
  })
  
  console.log('\n⚠️  IMPORTANTE:')
  console.log('- Guarda estos secretos en un lugar seguro')
  console.log('- Nunca los compartas o subas a control de versiones')
  console.log('- Usa un gestor de secretos en producción')
  console.log('- Rota los secretos regularmente')
  
  console.log('\n🔧 Para usar en .env:')
  console.log('='.repeat(50))
  
  Object.entries(secrets).forEach(([key, value]) => {
    console.log(`${key}=${value}`)
  })
  
  console.log('\n✅ Secretos generados exitosamente!')
}

if (require.main === module) {
  main()
}

export {
  generateSecureSecret,
  generateJWTSecret,
  generateDatabasePassword,
  generateAPIKey
}
