/**
 * Vitest Global Setup
 *
 * Este archivo se ejecuta UNA VEZ antes de todos los tests EN UN PROCESO SEPARADO.
 *
 * IMPORTANTE: No usar para setear env vars porque no persisten al proceso de tests.
 * En su lugar, setear env vars en vitest.setup.ts a nivel módulo.
 *
 * Usar globalSetup solo para:
 * - Iniciar/detener servicios externos (DB, Redis, servidores)
 * - Setup costoso que solo necesita correr una vez
 * - Cleanup global después de todos los tests
 *
 * Actualmente NO USADO - Las env vars se setean en vitest.setup.ts
 */

export function setup() {
  // Setup global - ejemplo:
  // await startTestDatabase()
  // await seedTestData()
}

export function teardown() {
  // Cleanup global - ejemplo:
  // await stopTestDatabase()
  // await cleanupTestFiles()
}
