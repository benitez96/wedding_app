/**
 * Barrel export for lib/ utilities
 *
 * This centralizes imports from lib/ to simplify imports across the codebase.
 *
 * @example
 * ```typescript
 * // Before:
 * import { hasPermission } from "@/lib/permissions";
 * import { sanitizeString } from "@/lib/sanitize";
 * import { logError } from "@/lib/logger";
 *
 * // After:
 * import { hasPermission, sanitizeString, logError } from "@/lib";
 * ```
 */

// Authentication
export * from "./auth-client";
export * from "./invitation-auth";
export * from "./server-auth";

// Permissions
export * from "./permissions";

// Sanitization & Validation
export * from "./sanitize";
export * from "./invitation-tokens";
export * from "./password-policy";

// Utilities
export * from "./logger";
export * from "./slug";

// Rate Limiting
export {
  rateLimiterService,
  getClientIP,
  recordAttempt,
} from "./rate-limiter-prisma";

// Config
export { getJwtSecret, getSecurityConfig } from "./config";

// Contexts & Services
export * from "./event-context-prisma";
export * from "./tier-enforcement-prisma";
export * from "./subscription-manager-prisma";
export * from "./get-configurations-prisma";
