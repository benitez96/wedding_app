/**
 * Logger utilitario para manejo seguro de errores
 *
 * En desarrollo: loggea información completa para debugging
 * En producción: loggea solo contexto para evitar exposición de información sensible
 */

/* eslint-disable no-console */

const _LOG_LEVEL = {
  ERROR: "error",
  WARN: "warn",
  INFO: "info",
} as const;

type LogLevel = (typeof _LOG_LEVEL)[keyof typeof _LOG_LEVEL];

interface LogOptions {
  level?: LogLevel;
  metadata?: Record<string, unknown>;
}

/**
 * Loggea un error de forma segura según el ambiente
 *
 * @param context - Descripción del contexto donde ocurrió el error
 * @param error - El error a loggear (puede ser unknown)
 * @param options - Opciones adicionales de logging
 *
 * @example
 * ```typescript
 * try {
 *   await someOperation()
 * } catch (error) {
 *   logError('Error al procesar invitación', error)
 *   return { success: false, error: 'operation-failed' }
 * }
 * ```
 */
export function logError(
  context: string,
  error: unknown,
  options: LogOptions = {},
): void {
  const { level = "error", metadata } = options;
  const isDevelopment = process.env.NODE_ENV === "development";

  if (isDevelopment) {
    // En desarrollo: información completa para debugging
    console[level](`[${context}]`, error, metadata ? { metadata } : "");
  } else {
    // En producción: solo contexto para evitar exposición de información sensible
    console[level](`[${context}]`);

    // Si hay metadata, loggearla de forma segura (sin valores sensibles)
    if (metadata) {
      const safeMetadata = sanitizeMetadata(metadata);
      if (Object.keys(safeMetadata).length > 0) {
        console[level]("Metadata:", safeMetadata);
      }
    }

    // Production monitoring could be added here (Sentry, LogRocket, etc.)
  }
}

/**
 * Loggea una advertencia de forma segura
 */
export function logWarning(
  context: string,
  message: string,
  metadata?: Record<string, unknown>,
): void {
  logError(context, new Error(message), { level: "warn", metadata });
}

/**
 * Loggea información de forma segura
 */
export function logInfo(
  context: string,
  message: string,
  metadata?: Record<string, unknown>,
): void {
  logError(context, new Error(message), { level: "info", metadata });
}

/**
 * Sanitizes metadata by removing sensitive fields
 *
 * @param metadata - Metadata object to sanitize
 * @param depth - Current recursion depth (for preventing stack overflow)
 * @returns Sanitized metadata object
 */
function sanitizeMetadata(
  metadata: Record<string, unknown>,
  depth = 0,
): Record<string, unknown> {
  const MAX_DEPTH = 10; // Prevent stack overflow from deeply nested objects

  const sensitiveKeys = [
    "password",
    "token",
    "secret",
    "apikey", // Fixed: lowercase to match keyLower.includes() comparison
    "authorization",
    "cookie",
    "session",
  ];

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    const keyLower = key.toLowerCase();
    const isSensitive = sensitiveKeys.some((sensitive) =>
      keyLower.includes(sensitive),
    );

    if (isSensitive) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      if (depth >= MAX_DEPTH) {
        // Stop recursion at max depth
        sanitized[key] = "[MAX_DEPTH_EXCEEDED]";
      } else {
        // Recursively sanitize nested objects
        sanitized[key] = sanitizeMetadata(
          value as Record<string, unknown>,
          depth + 1,
        );
      }
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Formatea un error para logging seguro
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Error desconocido";
}
