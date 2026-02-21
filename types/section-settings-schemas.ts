/**
 * Shared Zod schemas for section settings
 * Single source of truth for reusable section configuration
 */

import { z } from "zod";
import { SECTION_ICON_VALUES } from "./section-icon";

// Icon schema - reusable across all sections
export const SectionIconFieldSchema = z.enum(SECTION_ICON_VALUES);

// Decoration SVG schema
export const DecorationSvgSchema = z.enum([
  "none",
  "flower",
  "leaf",
  "heart",
  "branch",
  "branch-2",
]);

// Decoration Pattern schema (no "none" - pattern is required if svg is selected)
export const DecorationPatternSchema = z.enum([
  "corners",
  "scattered-grid-alt",
  "scattered-grid-progressive",
  "scattered-grid-radial",
  "border-top",
  "border-bottom",
  "border-both",
  "border-left",
  "border-right",
  "border-sides",
  "tiled",
  "center",
]);

// Common section fields that most sections share
export const CommonSectionFieldsSchema = z.object({
  // Icon
  icon: SectionIconFieldSchema.default("none"),

  // Deprecated: keep for backwards compatibility
  iconUrl: z.string().optional(),

  // Background
  hasAlternateBg: z.boolean().default(false),

  // Decorations
  decorationSvg: DecorationSvgSchema.default("none"),
  decorationPattern: DecorationPatternSchema.default("corners"),
  decorationOpacity: z.number().min(0).max(100).default(10),
  decorationSize: z.number().min(20).max(200).default(60),
});

// Extract types for reuse
export type CommonSectionFields = z.infer<typeof CommonSectionFieldsSchema>;
export type DecorationSvg = z.infer<typeof DecorationSvgSchema>;
export type DecorationPattern = z.infer<typeof DecorationPatternSchema>;
