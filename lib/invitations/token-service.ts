/**
 * Business logic for invitation token generation
 * Testable service layer - NO server actions here
 */

/**
 * Genera un token ID criptográficamente seguro para invitaciones
 * 21 caracteres, base64url, ~126 bits de entropía
 * Usado directamente en URLs: /r/{id}
 */
export async function generateTokenId(): Promise<string> {
  const crypto = await import("crypto");
  return crypto.randomBytes(16).toString("base64url").slice(0, 21);
}

/**
 * Calcula la fecha de expiración por defecto (1 año desde ahora)
 * Puede ser revocado manualmente desde backoffice
 */
export function calculateDefaultExpiration(): Date {
  const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
  return new Date(Date.now() + ONE_YEAR_MS);
}

/**
 * Calcula expiración personalizada
 */
export function calculateExpiration(daysFromNow: number): Date {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return new Date(Date.now() + daysFromNow * MS_PER_DAY);
}
