/**
 * Configuración centralizada y segura de variables de entorno
 *
 * Auth is handled by Better Auth (BETTER_AUTH_SECRET / BETTER_AUTH_URL).
 * Invitation guest sessions still use JWT_SECRET via jose.
 */

import { logWarning } from "@/lib/logger";

export function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable de entorno requerida: ${name}`);
  }
  return value;
}

export function getOptionalEnvVar(
  name: string,
  defaultValue?: string,
): string | undefined {
  return process.env[name] || defaultValue;
}

// Variables de entorno
export const DATABASE_URL = getRequiredEnvVar("DATABASE_URL");
export const NODE_ENV = getOptionalEnvVar("NODE_ENV", "development");
export const PORT = getOptionalEnvVar("PORT", "3000");

/**
 * JWT_SECRET - Used ONLY for invitation guest sessions (jose JWT).
 * Admin/backoffice auth is fully managed by Better Auth.
 */
export const JWT_SECRET = getRequiredEnvVar("JWT_SECRET");

/**
 * Security config for invitation guest sessions
 * Admin/backoffice auth is handled by Better Auth (separate system)
 */
export const SECURITY_CONFIG = {
  // JWT for guest sessions (jose)
  JWT_ALGORITHM: "HS512" as const,
  JWT_ISSUER: "wedding-app",
  JWT_INVITATION_AUDIENCE: "wedding-invitation",

  // Cookie security
  COOKIE_SECURE: NODE_ENV === "production",
  COOKIE_SAME_SITE: "lax" as const,
  COOKIE_HTTP_ONLY: true,

  // Guest session expiry (180 days)
  INVITATION_SESSION_DURATION: 180 * 24 * 60 * 60,
};

// Validación de configuración crítica
function validateSecurityConfig() {
  if (JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET debe tener al menos 32 caracteres");
  }

  if (
    JWT_SECRET === "default-secret-for-development-only" ||
    JWT_SECRET === "secret-jwt" ||
    JWT_SECRET === "tu-super-secreto-jwt-de-al-menos-32-caracteres-aqui"
  ) {
    throw new Error("JWT_SECRET no puede ser un valor de ejemplo");
  }

  if (NODE_ENV === "production") {
    if (
      !DATABASE_URL.includes("ssl=true") &&
      !DATABASE_URL.includes("sslmode=require")
    ) {
      logWarning("Security", "DATABASE_URL no incluye SSL en producción");
    }
  }
}

// Ejecutar validaciones
validateSecurityConfig();
