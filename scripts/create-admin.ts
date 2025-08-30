#!/usr/bin/env tsx

import { createAdminUser } from '../app/actions/admin'
import readline from 'node:readline'

// Pregunta normal (muestra lo que se escribe)
function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ 
    input: process.stdin, 
    output: process.stdout, 
    terminal: true 
  })
  
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close()
      resolve(answer)
    })
  })
}

// Pregunta oculta (no muestra nada mientras tipeás)
function promptHidden(question: string): Promise<string> {
  const rl = readline.createInterface({ 
    input: process.stdin, 
    output: process.stdout, 
    terminal: true 
  })

  // Guardamos el método original para restaurarlo después
  const origWrite = (rl as any)._writeToOutput

  return new Promise(resolve => {
    // Primero mostramos el prompt normalmente
    rl.question(question, answer => {
      // Restaurar comportamiento normal y salto de línea "manual"
      (rl as any)._writeToOutput = origWrite
      process.stdout.write('\n')
      rl.close()
      resolve(answer)
    })

    // Después de que se muestre el prompt, silenciamos la entrada
    setTimeout(() => {
      ;(rl as any)._writeToOutput = function _writeToOutput(_stringToWrite: string) {
        // No escribimos nada mientras se tipea la contraseña
      }
    }, 0)

    // Si el usuario hace Ctrl+C, cerramos prolijamente
    rl.on('SIGINT', () => {
      (rl as any)._writeToOutput = origWrite
      process.stdout.write('\n❌ Cancelado.\n')
      rl.close()
      process.exit(130)
    })
  })
}

async function main() {
  console.log('🎭 Creando usuario administrador')
  console.log('================================\n')
  
  try {
    // Solicitar username
    const username = await prompt('👤 Username: ')
    
    if (!username.trim()) {
      console.log('❌ El username no puede estar vacío')
      process.exit(1)
    }
    
    // Solicitar contraseña de forma segura
    const password = await promptHidden('🔒 Password: ')
    
    if (!password) {
      console.log('❌ La contraseña no puede estar vacía')
      process.exit(1)
    }
    
    // Confirmar contraseña
    const confirmPassword = await promptHidden('🔐 Confirmar password: ')
    
    if (password !== confirmPassword) {
      console.log('❌ Las contraseñas no coinciden')
      process.exit(1)
    }
    
    console.log('\n⏳ Creando usuario admin...')
    
    const result = await createAdminUser(username.trim(), password)
    
    if (result.success) {
      console.log('\n✅ ¡Usuario admin creado exitosamente!')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`👤 Usuario: ${result.user?.username}`)
      console.log(`🆔 ID: ${result.user?.id}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🎉 ¡Ya puedes acceder al backoffice!')
    } else {
      console.log('\n❌ Error al crear usuario admin:', result.error)
      process.exit(1)
    }
  } catch (error) {
    console.error('\n💥 Error inesperado:', error)
    process.exit(1)
  }
}

main()
