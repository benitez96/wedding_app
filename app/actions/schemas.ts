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

// Derived from THEME_IDS so adding a new theme never requires touching this file
export const themeIdSchema = z.enum(
  Object.values(THEME_IDS) as [string, ...string[]],
);

// Regex que acepta exactamente #RRGGBB (6 dígitos hex, mayúsculas o minúsculas)
// No acepta: shorthand (#RGB), rgba, hsl, nombres CSS, ni var() → sin inyecciones
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

const hexColorSchema = z.string().regex(HEX_COLOR_REGEX, {
  error: "Debe ser un color hex válido (ej: #A1B2C3)",
});

export const customThemeColorsSchema = z.object({
  background: hexColorSchema,
  foreground: hexColorSchema,
  primary: hexColorSchema,
  secondary: hexColorSchema,
  accent: hexColorSchema,
});

export type CustomThemeColorsInput = z.infer<typeof customThemeColorsSchema>;
