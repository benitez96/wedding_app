import "server-only";

import { betterAuth } from "better-auth";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "../app/generated/prisma";
import { validatePasswordStrength } from "@/lib/password-policy";
import { logError } from "@/lib/logger";

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
    minPasswordLength: 10,
    maxPasswordLength: 128,
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

  // Rate limiting (Better Auth built-in, persisted in PostgreSQL)
  rateLimit: {
    enabled: true,
    window: 60, // 1 minuto
    max: 100, // 100 requests por minuto (includes session checks, sign-in, etc.)
    storage: "database", // Persists across restarts, shared between instances
    customRules: {
      "/sign-in/email": {
        window: 60,
        max: 5, // 5 login attempts per minute
      },
      "/sign-up/email": {
        window: 60,
        max: 3, // 3 registrations per minute
      },
      "/forget-password": {
        window: 300,
        max: 3, // 3 password reset requests per 5 minutes
      },
    },
  },

  // Hooks para password policy enforcement and security audit logging
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      // Enforce strong password policy on sign-up and password change
      if (ctx.path === "/sign-up/email" || ctx.path === "/change-password") {
        const password = ctx.body?.password || ctx.body?.newPassword;

        if (password && typeof password === "string") {
          const validation = validatePasswordStrength(password);

          if (!validation.valid) {
            throw new APIError("BAD_REQUEST", {
              message: validation.message!,
            });
          }
        }
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      // Log sign-in attempts (success and failure) to SecurityLog
      if (ctx.path === "/sign-in/email") {
        const ip =
          ctx.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          ctx.headers?.get("x-real-ip") ||
          "unknown";
        const userAgent = ctx.headers?.get("user-agent") || "Unknown";
        const returned = ctx.context.returned;
        const isSuccess =
          returned instanceof Response
            ? returned.status === 200
            : !!ctx.context.newSession;

        prisma.securityLog
          .create({
            data: {
              type: isSuccess ? "login_success" : "login_failed",
              ip,
              userAgent,
              details: { path: ctx.path },
            },
          })
          .catch(() => {
            // Non-blocking — don't fail auth if logging fails
          });
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        // Hook que se ejecuta DESPUÉS de crear un usuario
        async after(user) {
          // CRITICAL: Setup user subscription and default event
          // This runs synchronously to ensure user setup is complete
          try {
            // Importar dinámicamente para evitar circular dependencies
            const { createSubscription, createDefaultEventForUser } =
              await import("@/lib/subscription-manager-prisma");

            // 1. Crear suscripción FREE automáticamente
            await createSubscription({
              userId: user.id,
              tier: "FREE",
              status: "active",
              reason: "New user registration",
              changedBy: "system",
            });

            // 2. Crear evento por defecto para que comience a editar
            await createDefaultEventForUser(user.id);
          } catch (error) {
            // CRITICAL ERROR: User was created but setup failed
            // Log to security logs for monitoring
            logError(`Failed to setup user ${user.id}`, error);

            // Store in SecurityLog for admin visibility
            await prisma.securityLog
              .create({
                data: {
                  type: "user_setup_failed",
                  ip: "127.0.0.1", // Internal system operation
                  userAgent: "better-auth-hook",
                  details: {
                    userId: user.id,
                    email: user.email,
                    error: error instanceof Error ? error.message : "Unknown",
                  },
                },
              })
              .catch(() => {
                // If even logging fails, there's nothing more we can do
              });

            // Re-throw to signal failure (Better Auth will handle)
            throw error;
          }
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
