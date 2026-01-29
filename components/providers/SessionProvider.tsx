"use client";

import type { ReactNode } from "react";

/**
 * Session Provider para Better Auth
 *
 * Better Auth maneja las sesiones automáticamente a través de cookies HTTP-only,
 * por lo que no necesitamos un provider context tradicional.
 *
 * Este componente existe solo por consistencia y para futuras extensiones
 * (como agregar listeners de sesión, refresh automático, etc.)
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
