import { z } from "zod";

export const DATE_SECTION_KEY = "date" as const;

export const DateSectionMetadata = {
  key: DATE_SECTION_KEY,
  name: "Fecha y Countdown",
  description: "Fecha de la boda y contador regresivo",
  icon: "📅",
  defaultOrder: 2,
  defaultEnabled: true,
};

export const DateSectionSettingsSchema = z.object({
  showCountdown: z.boolean().default(true),
  titleText: z.string().default("Te esperamos el día"),
  // Fecha y hora del evento en formato ISO (YYYY-MM-DDTHH:mm)
  weddingDateTime: z.string().datetime({ local: true }).optional(),
  hasAlternateBg: z.boolean().default(false),

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

export type DateSectionSettings = z.infer<typeof DateSectionSettingsSchema>;
