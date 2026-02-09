import { headers } from "next/headers";

/**
 * Rate limit configuration by action type
 * Admin login removed - Better Auth handles its own rate limiting
 */
export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

export const RATE_LIMIT_CONFIGS = {
  // Invitation token processing
  "invitation-token": {
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 24 * 60 * 60 * 1000, // 24 hours
  },
  // General invitation guest actions
  "invitation-actions": {
    maxAttempts: 50,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 2 * 60 * 60 * 1000, // 2 hours
  },
} as const;

export type RateLimitActionType = keyof typeof RATE_LIMIT_CONFIGS;

// ============================================================================
// PURE BUSINESS LOGIC - No database dependencies
// ============================================================================

/**
 * Calcula si un intento está dentro de la ventana de tiempo
 */
export function isWithinWindow(
  attemptDate: Date,
  now: Date,
  windowMs: number,
): boolean {
  return now.getTime() - attemptDate.getTime() < windowMs;
}

/**
 * Calcula cuántos intentos quedan disponibles
 */
export function calculateRemainingAttempts(
  currentAttempts: number,
  maxAttempts: number,
): number {
  return Math.max(0, maxAttempts - currentAttempts);
}

/**
 * Determina si se debe bloquear basado en número de intentos
 */
export function shouldBlock(
  attemptCount: number,
  maxAttempts: number,
): boolean {
  return attemptCount >= maxAttempts;
}

/**
 * Calcula la fecha hasta cuando bloquear
 */
export function calculateBlockedUntil(
  now: Date,
  blockDurationMs: number,
): Date {
  return new Date(now.getTime() + blockDurationMs);
}

/**
 * Calcula la fecha de inicio de la ventana de tiempo
 */
export function calculateWindowStart(now: Date, windowMs: number): Date {
  return new Date(now.getTime() - windowMs);
}

/**
 * Genera el mensaje de razón de bloqueo
 */
export function generateBlockReason(
  maxAttempts: number,
  windowMs: number,
): string {
  const windowMinutes = windowMs / 1000 / 60;
  return `Excedió límite de ${maxAttempts} intentos en ${windowMinutes} minutos`;
}

/**
 * Calcula la fecha de bloqueo para honeypot (7 días)
 */
export function calculateHoneypotBlockDuration(now: Date): Date {
  const HONEYPOT_BLOCK_DAYS = 7;
  return new Date(now.getTime() + HONEYPOT_BLOCK_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Genera el mensaje de razón para honeypot
 */
export function generateHoneypotReason(details?: string): string {
  return `Honeypot activado${details ? `: ${details}` : ""}`;
}

// ============================================================================
// DATABASE OPERATIONS - Depend on external database adapter
// ============================================================================

/**
 * Database adapter interface for rate limiting
 * Permite inyectar diferentes implementaciones (Prisma, mock, etc)
 */
export interface RateLimitStorage {
  findActiveBlock(
    ip: string,
    actionType: RateLimitActionType,
    now: Date,
  ): Promise<{ blockedUntil: Date } | null>;

  deleteOldAttempts(
    ip: string,
    actionType: RateLimitActionType,
    windowStart: Date,
  ): Promise<void>;

  countAttemptsInWindow(
    ip: string,
    actionType: RateLimitActionType,
    windowStart: Date,
  ): Promise<number>;

  createAttempt(
    ip: string,
    actionType: RateLimitActionType,
    success: boolean,
  ): Promise<void>;

  createBlock(
    ip: string,
    actionType: RateLimitActionType,
    blockedUntil: Date,
    reason: string,
  ): Promise<void>;

  logSecurityEvent(
    type: string,
    ip: string,
    details: Record<string, unknown>,
  ): Promise<void>;

  deleteOldAttemptsGlobal(olderThan: Date): Promise<void>;

  deleteExpiredBlocks(now: Date): Promise<void>;
}

// ============================================================================
// RATE LIMITER SERVICE - Uses injected storage adapter
// ============================================================================

/**
 * Rate limiter service with dependency injection
 * No tiene dependencias directas de Prisma, usa el adapter inyectado
 */
export class RateLimiterService {
  constructor(private storage: RateLimitStorage) {}

  async isIPBlocked(
    ip: string,
    actionType: RateLimitActionType,
  ): Promise<{ blocked: boolean; block?: { blockedUntil: Date } | null }> {
    const now = new Date();
    const activeBlock = await this.storage.findActiveBlock(ip, actionType, now);
    return { blocked: !!activeBlock, block: activeBlock };
  }

  async recordAttempt(
    ip: string,
    actionType: RateLimitActionType,
    success: boolean = false,
  ): Promise<{
    allowed: boolean;
    remainingAttempts: number;
    blockedUntil?: Date;
  }> {
    const now = new Date();
    const config = RATE_LIMIT_CONFIGS[actionType];

    // Verificar si ya está bloqueado
    const { blocked, block } = await this.isIPBlocked(ip, actionType);
    if (blocked) {
      return {
        allowed: false,
        remainingAttempts: 0,
        blockedUntil: block?.blockedUntil,
      };
    }

    // Limpiar intentos antiguos fuera de la ventana
    const windowStart = calculateWindowStart(now, config.windowMs);
    await this.storage.deleteOldAttempts(ip, actionType, windowStart);

    // Contar intentos en la ventana actual
    const attemptsInWindow = await this.storage.countAttemptsInWindow(
      ip,
      actionType,
      windowStart,
    );

    // Registrar el intento actual
    await this.storage.createAttempt(ip, actionType, success);

    const remainingAttempts = calculateRemainingAttempts(
      attemptsInWindow + 1,
      config.maxAttempts,
    );

    // Si se excedió el límite, bloquear la IP
    if (shouldBlock(attemptsInWindow, config.maxAttempts)) {
      const blockedUntil = calculateBlockedUntil(now, config.blockDurationMs);
      const reason = generateBlockReason(config.maxAttempts, config.windowMs);

      await this.storage.createBlock(ip, actionType, blockedUntil, reason);

      // Log to SecurityLog (non-blocking)
      await this.storage
        .logSecurityEvent("rate_limit_triggered", ip, {
          actionType,
          maxAttempts: config.maxAttempts,
        })
        .catch(() => {});

      return {
        allowed: false,
        remainingAttempts: 0,
        blockedUntil,
      };
    }

    return {
      allowed: true,
      remainingAttempts,
    };
  }

  async checkRateLimit(
    ip: string,
    actionType: RateLimitActionType,
  ): Promise<{
    allowed: boolean;
    remainingAttempts: number;
    blockedUntil?: Date;
  }> {
    const now = new Date();
    const config = RATE_LIMIT_CONFIGS[actionType];

    // Verificar si está bloqueado
    const { blocked, block } = await this.isIPBlocked(ip, actionType);
    if (blocked) {
      return {
        allowed: false,
        remainingAttempts: 0,
        blockedUntil: block?.blockedUntil,
      };
    }

    // Contar intentos en la ventana actual
    const windowStart = calculateWindowStart(now, config.windowMs);
    const attemptsInWindow = await this.storage.countAttemptsInWindow(
      ip,
      actionType,
      windowStart,
    );

    return {
      allowed: attemptsInWindow < config.maxAttempts,
      remainingAttempts: calculateRemainingAttempts(
        attemptsInWindow,
        config.maxAttempts,
      ),
    };
  }

  async blockIPForHoneypot(
    ip: string,
    actionType: RateLimitActionType,
    details?: string,
  ): Promise<void> {
    const now = new Date();
    const blockedUntil = calculateHoneypotBlockDuration(now);
    const reason = generateHoneypotReason(details);

    await this.storage.createBlock(ip, actionType, blockedUntil, reason);

    // Log to SecurityLog (non-blocking)
    await this.storage
      .logSecurityEvent("honeypot_triggered", ip, {
        actionType,
        details: details || null,
      })
      .catch(() => {});
  }

  async cleanupOldRateLimitData(): Promise<void> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    await this.storage.deleteOldAttemptsGlobal(oneDayAgo);
    await this.storage.deleteExpiredBlocks(now);
  }
}

// ============================================================================
// UTILITY FUNCTIONS - No dependency injection needed
// ============================================================================

/**
 * Función para obtener la IP real del cliente
 */
export async function getClientIP(): Promise<string> {
  const headersList = await headers();

  // Intentar obtener IP de diferentes headers (para diferentes configuraciones de proxy)
  const ip =
    headersList.get("x-forwarded-for") ||
    headersList.get("x-real-ip") ||
    headersList.get("cf-connecting-ip") || // Cloudflare
    headersList.get("x-client-ip") ||
    "unknown";

  // Si hay múltiples IPs (x-forwarded-for puede contener varias), tomar la primera
  return ip.split(",")[0].trim();
}
