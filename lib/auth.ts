import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "../app/generated/prisma";

// Crear instancia de Prisma para Better Auth
// Esta instancia se crea aquí porque es necesaria para el adapter
// La marcamos como "server-only" para evitar que se cargue en edge runtime
const prisma = new PrismaClient();

// Validar que las variables de entorno de Google estén configuradas (opcional)
const GOOGLE_ENABLED =
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

/**
 * Configuración de Better Auth
 *
 * Better Auth maneja:
 * - Autenticación con email/password
 * - Sessions con cookies seguras
 * - CSRF protection
 * - Rate limiting automático
 *
 * Variables de entorno requeridas:
 * - BETTER_AUTH_SECRET (generar con: openssl rand -base64 32)
 * - BETTER_AUTH_URL (base URL de la app)
 * - DATABASE_URL (Prisma)
 */
export const auth = betterAuth({
  // Database adapter
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // Email & Password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },

  // Social Providers
  socialProviders: {
    google: GOOGLE_ENABLED
      ? {
          clientId: process.env.GOOGLE_CLIENT_ID as string,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }
      : undefined,
  },

  // Session management
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 días
    updateAge: 60 * 60 * 24, // Actualizar cada día
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutos de cache
    },
  },

  // User configuration
  user: {
    // Campos adicionales del usuario (además de email, name, image)
    // Los campos de subscription se manejan en la tabla Subscription (relación 1:1)
    additionalFields: {},
  },

  // Security
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    crossSubDomainCookies: {
      enabled: false,
    },
  },

  // Rate limiting (Better Auth ya tiene rate limiting built-in)
  rateLimit: {
    enabled: true,
    window: 60, // 1 minuto
    max: 10, // 10 requests por minuto
  },

  // Hooks para logging y defaults
  databaseHooks: {
    user: {
      create: {
        // Hook que se ejecuta DESPUÉS de crear un usuario
        async after(user) {
          console.log(`[Auth] New user created: ${user.email}`);

          // Cargar las funciones dinámicamente para evitar dependencias circulares
          // y ejecutar en background sin bloquear el registro
          Promise.resolve()
            .then(async () => {
              try {
                // Importar dinámicamente para evitar circular dependencies
                const { createSubscription, createDefaultEventForUser } =
                  await import("@/lib/subscription-manager");

                // 1. Crear suscripción FREE automáticamente
                await createSubscription({
                  userId: user.id,
                  tier: "FREE",
                  status: "active",
                  reason: "New user registration",
                  changedBy: "system",
                });
                console.log(
                  `[Auth] Subscription created for user ${user.id} (FREE tier)`,
                );

                // 2. Crear evento por defecto para que comience a editar
                const defaultEvent = await createDefaultEventForUser(user.id);
                console.log(
                  `[Auth] Default event created for user ${user.id}: ${defaultEvent.slug}`,
                );
              } catch (error) {
                console.error(
                  `[Auth] Error setting up new user ${user.id}:`,
                  error,
                );
                // Log pero no fallar - el usuario ya fue creado
                // El admin puede crear la suscripción manualmente si es necesario
              }
            })
            .catch((error) => {
              console.error(`[Auth] Unexpected error in user setup:`, error);
            });
        },
      },
    },
    session: {
      create: {
        async after(session) {
          console.log(`[Auth] New session created for user: ${session.userId}`);
        },
      },
    },
  },
});

/**
 * Tipos inferidos de Better Auth
 * Usar en lugar de definir manualmente
 */
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
