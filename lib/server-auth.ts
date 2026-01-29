import { headers } from "next/headers";
import { auth } from "./auth";
import type { User } from "./auth";
import {
  getUserEventContext,
  type EventContext,
} from "./event-context";
import {
  getUserTierContext,
  type UserTierContext,
} from "./tier-enforcement";
import { hasPermission } from "./permissions";

/**
 * Verificar autenticación del usuario
 * Reemplaza verifyAdminAuth del sistema legacy
 */
export async function verifyUserAuth(): Promise<{
  success: boolean;
  user?: User;
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return { success: false, error: "no-session" };
    }

    return {
      success: true,
      user: session.user,
    };
  } catch (error) {
    console.error("Error verificando autenticación:", error);
    return { success: false, error: "verification-error" };
  }
}

/**
 * Wrapper para proteger server actions
 * Reemplaza withAdminAuth del sistema legacy
 *
 * Uso:
 * ```typescript
 * export const myAction = withAuth(async (user, arg1, arg2) => {
 *   // user está disponible aquí
 *   return { success: true }
 * })
 * ```
 */
export function withAuth<T extends any[], R>(
  action: (user: User, ...args: T) => Promise<R>,
) {
  return async (...args: T): Promise<R> => {
    const authResult = await verifyUserAuth();

    if (!authResult.success || !authResult.user) {
      throw new Error("No autorizado");
    }

    return action(authResult.user, ...args);
  };
}

/**
 * Contexto enriquecido para server actions que requieren evento
 */
export interface EventAuthContext {
  user: User;
  event: EventContext;
  tierContext: UserTierContext;
}

/**
 * Wrapper para server actions que necesitan contexto de evento + tier
 *
 * Opcionalmente verifica un permiso requerido (para colaboradores).
 *
 * Uso:
 * ```typescript
 * export const myAction = withEventAuth(async (ctx, arg1) => {
 *   // ctx.user, ctx.event, ctx.tierContext
 *   return { success: true }
 * })
 *
 * // Con permiso requerido:
 * export const myAction = withEventAuth(async (ctx, arg1) => {
 *   return { success: true }
 * }, PERMISSIONS.GUESTS_CREATE)
 * ```
 */
export function withEventAuth<T extends any[], R>(
  action: (ctx: EventAuthContext, ...args: T) => Promise<R>,
  requiredPermission?: bigint,
) {
  return async (...args: T): Promise<R> => {
    const authResult = await verifyUserAuth();

    if (!authResult.success || !authResult.user) {
      throw new Error("No autorizado");
    }

    const user = authResult.user;

    const [event, tierContext] = await Promise.all([
      getUserEventContext(user.id),
      getUserTierContext(user.id),
    ]);

    if (!event) {
      throw new Error("No se encontró un evento activo");
    }

    // Verificar permiso si se requiere (owners siempre pasan)
    if (requiredPermission && !event.isOwner) {
      if (!hasPermission(event.permissions, requiredPermission)) {
        throw new Error("No tienes permisos para realizar esta acción");
      }
    }

    return action({ user, event, tierContext }, ...args);
  };
}
