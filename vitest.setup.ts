/**
 * Vitest Setup File
 *
 * Este archivo se ejecuta antes de cada archivo de test.
 * Configuración global de testing environment.
 */

import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, vi } from "vitest";

/**
 * Mock de server-only para que los tests funcionen
 * server-only solo funciona en Next.js server, no en tests
 */
vi.mock("server-only", () => ({}));

/**
 * Mock global de Prisma para prevenir intentos de conexión a DB en tests
 * Prisma se importa en varios módulos y puede intentar conectarse automáticamente
 * Cada test que necesite Prisma debe hacer su propio mock específico
 */
vi.mock("@/lib/prisma", () => ({
  default: {
    // Mock de métodos comunes que podrían ser llamados
    $disconnect: vi.fn(),
    $connect: vi.fn(),
    configuration: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

/**
 * Cleanup automático de React Testing Library
 * Se ejecuta después de CADA test para limpiar el DOM
 */
afterEach(() => {
  cleanup();
});

/**
 * Setup after test environment is initialized
 *
 * NOTE: Environment variables are set in vitest.config.ts (test.env)
 * BEFORE any modules are imported. This ensures lib/config.ts can load.
 */

beforeAll(() => {
  // Verify env vars are set (should be set by vitest.config.ts)
  if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
    throw new Error(
      "Test environment variables not set. Check vitest.config.ts",
    );
  }
});

/**
 * Mock de APIs del navegador que no existen en jsdom
 */
beforeAll(() => {
  // Mock de window.matchMedia (usado por muchos componentes responsive)
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated
      removeListener: vi.fn(), // Deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock de IntersectionObserver (usado por lazy loading, animaciones, etc)
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: null,
    rootMargin: "",
    thresholds: [],
    takeRecords: vi.fn().mockReturnValue([]),
  }));

  // Mock de ResizeObserver (usado por componentes que reaccionan a cambios de tamaño)
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock de requestAnimationFrame (usado por animaciones)
  global.requestAnimationFrame = vi.fn().mockImplementation((cb) => {
    setTimeout(cb, 0);
    return 0;
  });

  global.cancelAnimationFrame = vi.fn();
});

/**
 * Configuración de timezone para tests de fechas
 * Forzamos UTC para que los tests sean consistentes sin importar la zona horaria local
 */
beforeAll(() => {
  // Mockear Date para usar siempre UTC en tests si es necesario
  // Esto previene flakiness por diferencias de timezone
  const originalDate = Date;

  // Si necesitás mockear una fecha específica globalmente:
  // vi.setSystemTime(new Date('2026-02-14T19:30:00.000Z'));
});

/**
 * Suppress console warnings específicos que no aportan valor en tests
 * OJO: NO suprimas TODO, solo warnings conocidos y esperados
 */
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    // Suprimir warnings de React 19 esperados
    const message = String(args[0]);

    if (
      message.includes("Warning: ReactDOM.render") ||
      message.includes(
        "Not implemented: HTMLFormElement.prototype.requestSubmit",
      )
    ) {
      return;
    }

    originalConsoleError(...args);
  };

  console.warn = (...args: unknown[]) => {
    const message = String(args[0]);

    // Suprimir warnings específicos que conocés y no son importantes
    if (message.includes("componentWillReceiveProps")) {
      return;
    }

    originalConsoleWarn(...args);
  };
});

/**
 * Helper: Esperar a que todos los microtasks se completen
 * Útil para tests async
 */
export const flushPromises = () =>
  new Promise((resolve) => setImmediate(resolve));
