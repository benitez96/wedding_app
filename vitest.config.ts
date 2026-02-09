import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  // Vite plugins - auto-import React in JSX (test environment only)
  plugins: [react()],

  // Set Vite cache directory to avoid permission issues
  cacheDir: ".vite-cache",

  test: {
    // Environment variables for tests
    // These are set BEFORE any modules are imported
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://localhost:5432/wedding_test",
      JWT_SECRET: "test-jwt-secret-with-at-least-32-characters-for-testing!!",
      NEXT_PUBLIC_WEDDING_DATE: "20260214193000",
    },

    // Entorno jsdom para tests de React
    // Usamos jsdom por defecto pero se puede override por test
    environment: "jsdom",

    // Globals: describe, it, expect sin imports
    // Mejor práctica: usar globals para compatibilidad con Jest
    globals: true,

    // Setup files - se ejecutan antes de cada archivo de test
    setupFiles: ["./vitest.setup.ts"],

    // Patterns de archivos de test
    // Only look for tests in the tests/ directory
    include: ["tests/**/*.{test,spec}.{js,ts,jsx,tsx}"],

    // Excluir directorios que no tienen tests
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/coverage/**",
      "**/prisma/**",
      "**/.git/**",
      "**/scripts/**", // Scripts internos no se testean
    ],

    // Coverage con V8 (más rápido que Istanbul)
    coverage: {
      provider: "v8",

      // Múltiples formatos de reporte
      // - text: Output en consola
      // - html: Reporte visual navegable
      // - lcov: Para integraciones CI (Codecov, Coveralls)
      // - json: Para procesamiento programático
      reporter: ["text", "json", "html", "lcov"],

      // Directorio donde se guardan los reportes
      reportsDirectory: "./coverage",

      // Archivos a incluir en el reporte de coverage
      include: [
        "utils/**/*.{ts,tsx}",
        "lib/**/*.{ts,tsx}",
        "hooks/**/*.{ts,tsx}",
        "components/**/*.{ts,tsx}",
        "app/actions/schemas.ts", // Solo schemas, no actions completas
      ],

      // Archivos a excluir del coverage
      exclude: [
        "**/*.d.ts",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/index.{ts,tsx}", // Archivos barrel
        "**/*.config.{ts,js}",
        "**/types/**",
        "**/*.metadata.ts",
        "**/*.stories.{ts,tsx}", // Si tenés Storybook
        "**/node_modules/**",
        // Excluir adapters Prisma (no son lógica de negocio, solo DB glue)
        "**/*-prisma.{ts,tsx}",
        // Excluir QR scanner (React hook con Web APIs, se testea con E2E)
        "**/lib/qr/**",
        // Excluir IndexedDB wrapper (wrapper de librería idb, se testea con E2E)
        "**/lib/offline/indexedDB.ts",
        // Excluir archivos de configuración de Better Auth (se testea con E2E)
        "**/lib/auth.ts",
        "**/lib/auth-client.ts",
      ],

      // Thresholds de coverage
      // Empezamos bajos y los subimos gradualmente a medida que agregamos tests
      // Meta final: 80% en todos
      thresholds: {
        lines: 10,
        functions: 10,
        branches: 10,
        statements: 10,
        // Descomentar cuando estemos cerca del objetivo
        // autoUpdate: true, // Auto-actualiza thresholds cuando mejoramos
      },
    },

    // Timeouts (en ms)
    testTimeout: 10000, // 10s para tests individuales
    hookTimeout: 10000, // 10s para hooks (beforeAll, afterAll, etc)

    // Mock configuration
    // clearMocks: Limpia call history después de cada test
    // restoreMocks: Restaura implementación original después de cada test
    // unstubEnvs: Restaura env vars después de cada test
    // unstubGlobals: Restaura globals después de cada test
    clearMocks: true,
    restoreMocks: true,
    mockReset: false, // No reseteamos la implementación (solo call history)
    unstubEnvs: true, // Restore env vars after each test
    unstubGlobals: true, // Restore globals after each test

    // Pool de ejecución
    // threads: Más rápido, usa workers
    // forks: Más aislado, usa procesos separados
    pool: "threads",

    // Isolate: Cada archivo de test corre en un contexto aislado
    // Previene bleeding de estado entre archivos
    isolate: true,

    // CSS/Assets handling
    // Vitest por defecto mockea CSS modules
    css: false, // No procesar CSS en tests (más rápido)

    // Watch mode configuración
    watch: false, // Desactivado por defecto (usar flag --watch)

    // Reporters para output
    reporters: ["verbose"], // 'default', 'verbose', 'dot', 'json'

    // Retry failed tests (útil para tests flaky)
    retry: 0, // No reintentar por defecto

    // Bail on first failure (útil para CI)
    bail: 0, // 0 = no bail, N = stop after N failures
  },

  // Resolver aliases (mismo que tsconfig.json)
  // IMPORTANTE: Mantener sincronizado con tsconfig paths
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // Mock server-only para tests (solo funciona en Next.js server)
      "server-only": path.resolve(__dirname, "tests/mocks/server-only.ts"),
    },
  },
});
