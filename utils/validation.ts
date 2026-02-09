import { z, type ZodError } from "zod";

// Invitation validation schemas
export const invitationSchema = z.object({
  guestName: z
    .string()
    .min(1, "Guest name is required")
    .max(100, "Guest name cannot exceed 100 characters")
    .transform((val) => val.trim()),
  guestNickname: z
    .string()
    .max(50, "Nickname cannot exceed 50 characters")
    .optional()
    .transform((val) => val?.trim() || ""),
  guestPhone: z
    .string()
    .max(20, "Phone number cannot exceed 20 characters")
    .optional()
    .transform((val) => val?.trim() || ""),
  maxGuests: z.coerce
    .number()
    .int("Maximum guests must be an integer")
    .min(1, "Must allow at least 1 guest")
    .max(10, "Cannot exceed 10 guests"),
  hasResponded: z.boolean().optional(),
  isAttending: z.boolean().optional(),
  guestCount: z.coerce
    .number()
    .int("Guest count must be an integer")
    .min(1, "Must be at least 1")
    .max(10, "Cannot exceed 10")
    .optional()
    .nullable(),
});

// Invitation response schema
export const invitationResponseSchema = z.object({
  isAttending: z.boolean(),
  guestCount: z
    .number()
    .int("Guest count must be an integer")
    .min(1, "Must be at least 1")
    .max(10, "Cannot exceed 10")
    .optional(),
  message: z
    .string()
    .max(500, "Message cannot exceed 500 characters")
    .optional(),
});

// Admin login schema
export const adminLoginSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username cannot exceed 50 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, hyphens and underscores",
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters"),
  honeypotValue: z.string().optional(),
});

// Search schema
export const searchSchema = z.object({
  searchTerm: z
    .string()
    .max(100, "Search term cannot exceed 100 characters")
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/,
      "Search term can only contain letters and spaces",
    )
    .optional(),
});

// Message schema
export const messageSchema = z.object({
  message: z
    .string()
    .min(1, "Message is required")
    .max(1000, "Message cannot exceed 1000 characters")
    .regex(/^[^<>]*$/, "Message cannot contain HTML characters"),
  type: z.enum(["wish", "memory", "advice"]).optional(),
});

// Basic string sanitization
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove dangerous HTML characters
    .replace(/\s+/g, " "); // Normalize spaces
}

// Sanitize HTML to prevent XSS
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// Sanitize names (allows letters, spaces and common characters)
export function sanitizeName(input: string): string {
  return input
    .trim()
    .replace(/[<>\\"']/g, "") // Remove dangerous characters
    .replace(/\s+/g, " ") // Normalize spaces
    .slice(0, 100); // Limit length
}

// Sanitize phone numbers (only numbers, spaces, +, -, parentheses)
export function sanitizePhone(input: string): string {
  return input
    .trim()
    .replace(/[^\d\s+\-()]/g, "") // Only allow valid phone characters
    .slice(0, 20); // Limit length
}

// Sanitize IDs (alphanumeric, hyphens, underscores)
export function sanitizeId(input: string): string {
  return input
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "") // Only alphanumeric, hyphens and underscores
    .slice(0, 50); // Limit length
}

// Sanitize search queries (remove dangerous special characters)
export function sanitizeSearch(input: string): string {
  return input
    .trim()
    .replace(/[<>\\"'%&;\\/]/g, "") // Remove dangerous search characters
    .replace(/\s+/g, " ") // Normalize spaces
    .slice(0, 100); // Limit length
}

// Validate and sanitize data with Zod schemas
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

      return { success: false, error: "Invalid input data" };
    }
    return { success: false, error: "Unknown validation error" };
  }
}

// Invitation ID validation
export const invitationIdSchema = z
  .string()
  .min(1, "Invitation ID is required")
  .max(50, "Invalid invitation ID")
  .regex(/^[a-zA-Z0-9_-]+$/, "Invalid invitation ID");

// Token validation
export const tokenSchema = z
  .string()
  .min(1, "Token is required")
  .max(100, "Invalid token")
  .regex(/^[a-zA-Z0-9_-]+$/, "Invalid token");
