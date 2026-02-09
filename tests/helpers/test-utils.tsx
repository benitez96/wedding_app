/**
 * Test Utilities
 *
 * Helpers y utilidades compartidas para tests.
 * Importá estos helpers en tus tests para reducir boilerplate.
 */

import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

/**
 * Custom render que incluye providers necesarios
 * 
 * @example
 * const { getByText } = renderWithProviders(<MyComponent />)
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  // Acá podés agregar providers globales cuando los necesites
  // Por ejemplo: ThemeProvider, SessionProvider, etc.
  
  function Wrapper({ children }: { children: ReactNode }) {
    return <>{children}</>;
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Helper para esperar a que se completen todas las promesas pendientes
 * Útil cuando tenés efectos async o timers
 *
 * @example
 * await waitForPromises()
 */
export const waitForPromises = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Helper para crear mocks de FormData
 *
 * @example
 * const formData = createFormData({ email: 'test@example.com' })
 */
export function createFormData(data: Record<string, string>): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });
  return formData;
}

/**
 * Helper para tests de errores async
 *
 * @example
 * await expectAsyncError(
 *   async () => await failingFunction(),
 *   'Expected error message'
 * )
 */
export async function expectAsyncError(
  fn: () => Promise<unknown>,
  errorMessage?: string,
): Promise<void> {
  let error: Error | undefined;

  try {
    await fn();
  } catch (e) {
    error = e as Error;
  }

  if (!error) {
    throw new Error("Expected function to throw an error, but it didn't");
  }

  if (errorMessage && !error.message.includes(errorMessage)) {
    throw new Error(
      `Expected error message to include "${errorMessage}", but got "${error.message}"`,
    );
  }
}

/**
 * Helper para mockear localStorage
 *
 * @example
 * const localStorage = mockLocalStorage({ theme: 'dark' })
 */
export function mockLocalStorage(initialData: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(initialData));

  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
}

/**
 * Helper para generar datos de prueba random
 * Útil para property-based testing
 */
export const generators = {
  /**
   * Genera un email aleatorio
   */
  email: () => `user${Math.random().toString(36).slice(2)}@example.com`,

  /**
   * Genera un string aleatorio
   */
  string: (length = 10) =>
    Math.random()
      .toString(36)
      .substring(2, 2 + length),

  /**
   * Genera un número aleatorio entre min y max
   */
  number: (min = 0, max = 100) =>
    Math.floor(Math.random() * (max - min + 1)) + min,

  /**
   * Genera un nombre completo aleatorio
   */
  fullName: () => {
    const names = ["Juan", "María", "Pedro", "Ana", "Luis", "Carmen"];
    const surnames = ["Pérez", "García", "López", "Martínez", "González"];
    return `${names[generators.number(0, names.length - 1)]} ${surnames[generators.number(0, surnames.length - 1)]}`;
  },

  /**
   * Genera un teléfono argentino aleatorio
   */
  phoneAR: () => {
    const area = generators.number(11, 388);
    const number = generators.number(1000000, 9999999);
    return `+54 ${area} ${number}`;
  },
};

/**
 * Helper para tests que necesitan IDs únicos
 */
export const createTestId = (() => {
  let counter = 0;
  return (prefix = "test") => `${prefix}-${++counter}`;
})();

/**
 * Re-export de utilidades comunes de testing-library
 * Para tener todo en un solo lugar
 */
export {
  screen,
  waitFor,
  within,
  fireEvent,
  act,
} from "@testing-library/react";
