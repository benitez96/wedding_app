import { z } from "zod";
import { SectionIconSchema } from "@/types/section-icon";

export const CEREMONY_SECTION_KEY = "ceremony" as const;

export const CeremonySectionMetadata = {
  key: CEREMONY_SECTION_KEY,
  name: "Ceremonia",
  description: "Información sobre la ceremonia",
  icon: "💒",
  defaultOrder: 3,
  defaultEnabled: true,
};

export const CeremonySectionSettingsSchema = z.object({
  time: z.string().default("19:30hs"),
  venueName: z.string().default("Iglesia Nuestra Señora del Carmen"),
  mapsUrl: z
    .string()
    .url()
    .default("https://maps.app.goo.gl/pwTwQ4vJzbBt1h1C9"),

  // Section icon
  icon: SectionIconSchema.default("rings-1"),

  // Deprecated: mantener por compatibilidad
  iconUrl: z.string().optional(),

  showDirectionsButton: z.boolean().default(true),
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

export type CeremonySectionSettings = z.infer<
  typeof CeremonySectionSettingsSchema
>;
