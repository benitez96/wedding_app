import { z } from "zod";

export const QUOTE_SECTION_KEY = "quote" as const;

export const QuoteSectionMetadata = {
  key: QUOTE_SECTION_KEY,
  name: "Frase",
  description: "Frase o cita especial",
  icon: "💬",
  defaultOrder: 1,
  defaultEnabled: true,
};

export const QuoteSectionSettingsSchema = z.object({
  quoteText: z
    .string()
    .default(
      "El amor nos unió, y queremos compartir nuestra felicidad con vos.",
    ),
  showQuote: z.boolean().default(true),
  hasAlternateBg: z.boolean().default(true), // QuoteSection tiene bg por defecto

  // 🌸 Sistema de decoraciones
  decorationSvg: z
    .enum(["none", "flower", "leaf", "heart", "branch", "branch-2"])
    .default("none"),
  decorationPattern: z
    .enum([
      "none",
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
    ])
    .default("none"),
  decorationOpacity: z.number().min(0).max(100).default(10),
  decorationSize: z.number().min(20).max(200).default(60),
});

export type QuoteSectionSettings = z.infer<typeof QuoteSectionSettingsSchema>;
