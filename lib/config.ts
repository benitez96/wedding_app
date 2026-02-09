/**
 * Configuración centralizada y segura de variables de entorno
 *
 * Auth is handled by Better Auth (BETTER_AUTH_SECRET / BETTER_AUTH_URL).
 * Invitation guest sessions still use JWT_SECRET via jose.
 */

import { logWarning } from "@/lib/logger";

// ============================================================================
// PURE FUNCTIONS - No side effects, fully testable
// ============================================================================

/**
 * Gets a required environment variable value
 * @throws Error if variable is missing or empty
 */
export function getRequiredEnvVar(
  name: string,
  env: Record<string, string | undefined> = process.env,
): string {
  const value = env[name];
  if (!value) {
    throw new Error(`Variable de entorno requerida: ${name}`);
  }
  return value;
}

/**
 * Gets an optional environment variable with fallback
 * Returns defaultValue if variable is missing or empty
 */
export function getOptionalEnvVar(
  name: string,
  defaultValue: string,
  env: Record<string, string | undefined> = process.env,
): string {
  return env[name] || defaultValue;
}

/**
 * Creates security configuration object (pure function)
 */
export function createSecurityConfig(nodeEnv: string) {
  return {
    // JWT for guest sessions (jose)
    JWT_ALGORITHM: "HS512" as const,
    JWT_ISSUER: "wedding-app",
    JWT_INVITATION_AUDIENCE: "wedding-invitation",

    // Cookie security
    COOKIE_SECURE: nodeEnv === "production",
    COOKIE_SAME_SITE: "lax" as const,
    COOKIE_HTTP_ONLY: true,

    // Guest session expiry (180 days)
    INVITATION_SESSION_DURATION: 180 * 24 * 60 * 60,
  };
}

/**
 * Validates JWT_SECRET meets security requirements (pure function)
 * @throws Error if validation fails
 */
export function validateJwtSecret(jwtSecret: string): void {
  if (jwtSecret.length < 32) {
    throw new Error("JWT_SECRET debe tener al menos 32 caracteres");
  }

  const forbiddenSecrets = [
    "default-secret-for-development-only",
    "secret-jwt",
    "tu-super-secreto-jwt-de-al-menos-32-caracteres-aqui",
  ];

  if (forbiddenSecrets.includes(jwtSecret)) {
    throw new Error("JWT_SECRET no puede ser un valor de ejemplo");
  }
}

/**
 * Validates DATABASE_URL has SSL in production (pure function with side effect warning)
 */
export function validateDatabaseUrl(
  databaseUrl: string,
  nodeEnv: string,
): void {
  if (nodeEnv === "production") {
    if (
      !databaseUrl.includes("ssl=true") &&
      !databaseUrl.includes("sslmode=require")
    ) {
      logWarning("Security", "DATABASE_URL no incluye SSL en producción");
    }
  }
}

// ============================================================================
// LAZY GETTERS - Environment variables loaded on-demand
// ============================================================================

let _DATABASE_URL: string | undefined;
let _NODE_ENV: string | undefined;
let _PORT: string | undefined;
let _JWT_SECRET: string | undefined;
let _SECURITY_CONFIG: ReturnType<typeof createSecurityConfig> | undefined;

/**
 * DATABASE_URL - Loaded lazily to avoid import-time errors in tests
 */
export function getDatabaseUrl(): string {
  if (_DATABASE_URL === undefined) {
    _DATABASE_URL = getRequiredEnvVar("DATABASE_URL");
  }
  return _DATABASE_URL;
}

/**
 * NODE_ENV - Loaded lazily with default
 */
export function getNodeEnv(): string {
  if (_NODE_ENV === undefined) {
    _NODE_ENV = getOptionalEnvVar("NODE_ENV", "development");
  }
  return _NODE_ENV;
}

/**
 * PORT - Loaded lazily with default
 */
export function getPort(): string {
  if (_PORT === undefined) {
    _PORT = getOptionalEnvVar("PORT", "3000");
  }
  return _PORT;
}

/**
 * JWT_SECRET - Used ONLY for invitation guest sessions (jose JWT).
 * Admin/backoffice auth is fully managed by Better Auth.
 * Loaded lazily to avoid import-time errors in tests
 */
export function getJwtSecret(): string {
  if (_JWT_SECRET === undefined) {
    _JWT_SECRET = getRequiredEnvVar("JWT_SECRET");
  }
  return _JWT_SECRET;
}

/**
 * Security config for invitation guest sessions
 * Admin/backoffice auth is handled by Better Auth (separate system)
 * Loaded lazily to avoid import-time errors in tests
 */
export function getSecurityConfig(): ReturnType<typeof createSecurityConfig> {
  if (_SECURITY_CONFIG === undefined) {
    _SECURITY_CONFIG = createSecurityConfig(getNodeEnv());
  }
  return _SECURITY_CONFIG;
}

/**
 * Validates all configuration at runtime
 * Call this in your app startup (e.g., instrumentation.ts or middleware)
 *
 * NOT called automatically on import to allow testing.
 * You must call this manually in your app's entry point.
 */
export function validateConfig(): void {
  validateJwtSecret(getJwtSecret());
  validateDatabaseUrl(getDatabaseUrl(), getNodeEnv());
}

// NOTE: validateConfig() is NOT called here automatically.
// You must call it manually in your app's startup code.
// This allows tests to import this module without triggering validation.
