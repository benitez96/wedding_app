/**
 * Password policy validation - Pure business logic
 *
 * Requisitos de contraseña segura:
 * - Al menos 1 mayúscula
 * - Al menos 1 minúscula
 * - Al menos 1 número
 * - Al menos 1 carácter especial
 */

export interface PasswordValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Valida que una contraseña cumpla con la política de seguridad
 *
 * @param password - Contraseña a validar
 * @returns Resultado de validación con mensaje de error si aplica
 *
 * @example
 * ```typescript
 * const result = validatePasswordStrength("Password123!");
 * if (!result.valid) {
 *   throw new Error(result.message);
 * }
 * ```
 */
export function validatePasswordStrength(
  password: string,
): PasswordValidationResult {
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
    return {
      valid: false,
      message:
        "La contraseña debe incluir mayúsculas, minúsculas, números y caracteres especiales",
    };
  }

  return { valid: true };
}

/**
 * Valida requisitos individuales de la contraseña
 *
 * @param password - Contraseña a analizar
 * @returns Objeto con cada requisito cumplido o no
 */
export function getPasswordRequirements(password: string): {
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
} {
  return {
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };
}
