import { z, type ZodError } from "zod";

// Re-export sanitization functions from the canonical source
// This maintains backward compatibility for existing imports
export {
  sanitizeString,
  sanitizeName,
  sanitizePhone,
  sanitizeText,
  sanitizeHtml,
  sanitizeId,
  sanitizeSearch,
  sanitizeObject,
} from "@/lib/sanitize";

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
    .optional()
    .nullable(),
  // Extended RSVP fields — only present when enabled in section settings
  menuPreference: z
    .string()
    .max(100, "Menu preference cannot exceed 100 characters")
    .regex(/^[^<>]*$/, "Menu preference cannot contain HTML characters")
    .optional()
    .nullable(),
  dietaryRestrictions: z
    .string()
    .max(500, "Dietary restrictions cannot exceed 500 characters")
    .regex(/^[^<>]*$/, "Dietary restrictions cannot contain HTML characters")
    .optional()
    .nullable(),
  messageForCouple: z
    .string()
    .max(1000, "Message cannot exceed 1000 characters")
    .regex(/^[^<>]*$/, "Message cannot contain HTML characters")
    .optional()
    .nullable(),
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
