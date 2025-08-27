#!/usr/bin/env tsx

import { createAdminUser } from '../app/actions/admin'

async function main() {
  const args = process.argv.slice(2)
  
  if (args.length !== 2) {
    console.log('Uso: pnpm create-admin <username> <password>')
    console.log('Ejemplo: pnpm create-admin admin123 miContraseñaSegura')
    process.exit(1)
  }

  const [username, password] = args

  console.log(`Creando usuario admin: ${username}`)
  
  try {
    const result = await createAdminUser(username, password)
    
    if (result.success) {
      console.log('✅ Usuario admin creado exitosamente!')
      console.log(`Usuario: ${result.user?.username}`)
      console.log(`ID: ${result.user?.id}`)
    } else {
      console.error('❌ Error al crear usuario admin:', result.error)
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Error inesperado:', error)
    process.exit(1)
  }
}

main()
