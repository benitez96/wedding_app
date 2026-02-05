import { z, type ZodError } from "zod";

// Esquemas de validación para invitaciones
export const invitationSchema = z.object({
  guestName: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .transform((val) => val.trim()),
  guestNickname: z
    .string()
    .max(50, "El apodo no puede exceder 50 caracteres")
    .optional()
    .transform((val) => val?.trim() || ""),
  guestPhone: z
    .string()
    .max(20, "El teléfono no puede exceder 20 caracteres")
    .optional()
    .transform((val) => val?.trim() || ""),
  maxGuests: z.coerce
    .number()
    .int("El máximo de invitados debe ser un número entero")
    .min(1, "Debe permitir al menos 1 invitado")
    .max(10, "No puede exceder 10 invitados"),
  hasResponded: z.boolean().optional(),
  isAttending: z.boolean().optional(),
  guestCount: z.coerce
    .number()
    .int("El número de invitados debe ser un número entero")
    .min(1, "Debe ser al menos 1")
    .max(10, "No puede exceder 10")
    .optional()
    .nullable(),
});

// Esquema para respuesta de invitación
export const invitationResponseSchema = z.object({
  isAttending: z.boolean(),
  guestCount: z
    .number()
    .int("El número de invitados debe ser un número entero")
    .min(1, "Debe ser al menos 1")
    .max(10, "No puede exceder 10")
    .optional(),
  message: z
    .string()
    .max(500, "El mensaje no puede exceder 500 caracteres")
    .optional(),
});

// Esquema para login de admin
export const adminLoginSchema = z.object({
  username: z
    .string()
    .min(3, "El usuario debe tener al menos 3 caracteres")
    .max(50, "El usuario no puede exceder 50 caracteres")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "El usuario solo puede contener letras, números, guiones y guiones bajos",
    ),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(128, "La contraseña no puede exceder 128 caracteres"),
  honeypotValue: z.string().optional(),
});

// Esquema para búsqueda
export const searchSchema = z.object({
  searchTerm: z
    .string()
    .max(100, "El término de búsqueda no puede exceder 100 caracteres")
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/,
      "El término de búsqueda solo puede contener letras y espacios",
    )
    .optional(),
});

// Esquema para mensajes
export const messageSchema = z.object({
  message: z
    .string()
    .min(1, "El mensaje es requerido")
    .max(1000, "El mensaje no puede exceder 1000 caracteres")
    .regex(/^[^<>]*$/, "El mensaje no puede contener caracteres HTML"),
  type: z.enum(["wish", "memory", "advice"]).optional(),
});

// Función para sanitizar strings básica
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remover caracteres HTML peligrosos
    .replace(/\s+/g, " "); // Normalizar espacios
}

// Función para sanitizar HTML (prevenir XSS)
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// Función para sanitizar nombres (permite letras, espacios y caracteres comunes)
export function sanitizeName(input: string): string {
  return input
    .trim()
    .replace(/[<>\\"']/g, "") // Remover caracteres peligrosos
    .replace(/\s+/g, " ") // Normalizar espacios
    .slice(0, 100); // Limitar longitud
}

// Función para sanitizar teléfonos (solo números, espacios, +, -, paréntesis)
export function sanitizePhone(input: string): string {
  return input
    .trim()
    .replace(/[^\d\s+\-()]/g, "") // Solo permitir caracteres válidos para teléfono
    .slice(0, 20); // Limitar longitud
}

// Función para sanitizar IDs (alfanumérico, guiones, guiones bajos)
export function sanitizeId(input: string): string {
  return input
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "") // Solo alfanumérico, guiones y guiones bajos
    .slice(0, 50); // Limitar longitud
}

// Función para sanitizar búsqueda (remover caracteres especiales peligrosos)
export function sanitizeSearch(input: string): string {
  return input
    .trim()
    .replace(/[<>\\"'%&;\\/]/g, "") // Remover caracteres peligrosos para búsqueda
    .replace(/\s+/g, " ") // Normalizar espacios
    .slice(0, 100); // Limitar longitud
}

// Función para validar y sanitizar datos
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as ZodError;
      const firstIssue = zodError.issues[0];
      if (firstIssue) {
        return { success: false, error: firstIssue.message };
      }

      return { success: false, error: "Datos de entrada inválidos" };
    }
    return { success: false, error: "Error de validación desconocido" };
  }
}

// Función para validar ID de invitación
export const invitationIdSchema = z
  .string()
  .min(1, "ID de invitación requerido")
  .max(50, "ID de invitación inválido")
  .regex(/^[a-zA-Z0-9_-]+$/, "ID de invitación inválido");

// Función para validar token
export const tokenSchema = z
  .string()
  .min(1, "Token requerido")
  .max(100, "Token inválido")
  .regex(/^[a-zA-Z0-9_-]+$/, "Token inválido");
