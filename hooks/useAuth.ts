"use client";

import { authClient } from "@/lib/auth-client";

/**
 * Hook para acceder a la sesión en Client Components
 *
 * Uso:
 * ```tsx
 * function MyComponent() {
 *   const { data: session, isPending, error } = useAuth();
 *
 *   if (isPending) return <Loading />;
 *   if (!session) return <Login />;
 *
 *   return <div>Hola {session.user.name}</div>;
 * }
 * ```
 */
export function useAuth() {
  return authClient.useSession();
}
