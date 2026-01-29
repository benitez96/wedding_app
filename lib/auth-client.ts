"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Cliente de Better Auth para React
 *
 * Uso en componentes:
 *
 * ```tsx
 * import { authClient } from "@/lib/auth-client"
 *
 * function LoginForm() {
 *   const [isPending, setIsPending] = useState(false)
 *   const [error, setError] = useState<string>()
 *
 *   const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
 *     e.preventDefault()
 *     setIsPending(true)
 *     setError(undefined)
 *
 *     const formData = new FormData(e.currentTarget)
 *     const result = await authClient.signIn.email({
 *       email: formData.get("email") as string,
 *       password: formData.get("password") as string,
 *     })
 *
 *     if (result.error) {
 *       setError(result.error.message)
 *     }
 *     setIsPending(false)
 *   }
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <input name="email" type="email" required />
 *       <input name="password" type="password" required />
 *       <button disabled={isPending}>
 *         {isPending ? "Loading..." : "Sign In"}
 *       </button>
 *       {error && <p>{error}</p>}
 *     </form>
 *   )
 * }
 * ```
 *
 * Para verificar sesión:
 *
 * ```tsx
 * function Profile() {
 *   const { data: session, isPending } = authClient.useSession()
 *
 *   if (isPending) return <div>Loading...</div>
 *   if (!session) return <div>Not logged in</div>
 *
 *   return <div>Welcome {session.user.name}</div>
 * }
 * ```
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});
