"use client";

import { authClient } from "@/lib/auth-client";

/**
 * Hook to access session in Client Components
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { data: session, isPending, error } = useAuth();
 *
 *   if (isPending) return <Loading />;
 *   if (!session) return <Login />;
 *
 *   return <div>Hello {session.user.name}</div>;
 * }
 * ```
 */
export function useAuth() {
  return authClient.useSession();
}
