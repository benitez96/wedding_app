import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

/**
 * Route handler de Better Auth
 *
 * Better Auth expone automáticamente todos los endpoints necesarios:
 *
 * POST /api/auth/sign-up/email - Registro con email/password
 * POST /api/auth/sign-in/email - Login con email/password
 * POST /api/auth/sign-out - Logout
 * GET  /api/auth/session - Obtener sesión actual
 * POST /api/auth/update-user - Actualizar información del usuario
 *
 * Y muchos más según los plugins habilitados
 */
export const { GET, POST } = toNextJsHandler(auth);
