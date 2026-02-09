/**
 * Centralized Zod schemas for server actions
 *
 * Extracted for testability - pure validation logic separate from DB operations
 */

import { z } from "zod";
import { THEME_IDS } from "@/types/theme";
import { isSectionKey } from "@/components/sections/metadata";

// ============================================================================
// EVENT SCHEMAS
// ============================================================================

export const createEventSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .transform((val) => val.trim()),
  description: z
    .string()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
});

// ============================================================================
// SECTION SCHEMAS
// ============================================================================

export const addSectionSchema = z.object({
  key: z.string().refine((key) => isSectionKey(key), {
    message: "Invalid section key",
  }),
});

export const removeSectionSchema = z.object({
  id: z.string().cuid({ message: "Invalid ID format" }),
});

export const updateSectionSettingsSchema = z.object({
  id: z.string().cuid({ message: "Invalid ID format" }),
  key: z.string().refine((key) => isSectionKey(key), {
    message: "Invalid section key",
  }),
});

export const updateSectionsOrderSchema = z
  .array(
    z.object({
      id: z.string().cuid({ message: "Invalid ID format" }),
      order: z.number().int().min(0),
      isEnabled: z.boolean(),
    }),
  )
  .min(1)
  .max(50);

// ============================================================================
// CHECK-IN SCHEMAS
// ============================================================================

export const createCheckInSchema = z.object({
  invitationId: z.string().cuid(),
  guestsCount: z.number().int().min(1).max(20),
  deviceId: z.string().optional(),
  clientId: z.string().optional(),
});

export const scanQRSchema = z.object({
  tokenId: z.string().min(1, "Token inválido"),
  eventId: z.string().cuid(),
});

export const getInvitationsCacheSchema = z.object({
  eventId: z.string().cuid(),
});

// ============================================================================
// THEME SCHEMAS
// ============================================================================

export const themeIdSchema = z.enum([
  THEME_IDS.CLASSIC,
  THEME_IDS.WARM,
  THEME_IDS.PASTEL_GREEN,
]);
