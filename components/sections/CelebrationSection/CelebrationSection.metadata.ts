import { z } from "zod";

export const CELEBRATION_SECTION_KEY = "celebration" as const;

export const CelebrationSectionMetadata = {
  key: CELEBRATION_SECTION_KEY,
  name: "Celebración",
  description: "Información sobre la fiesta",
  icon: "🎊",
  defaultOrder: 4,
  defaultEnabled: true,
};

export const CelebrationSectionSettingsSchema = z.object({
  description: z
    .string()
    .default("Despues de la Ceremonia festejaremos en el Club Union"),
  venueName: z.string().default("Club Union"),
  mapsUrl: z
    .string()
    .url()
    .default("https://maps.app.goo.gl/AjTWBW7Y25sENdw36"),
  iconUrl: z.string().default("/icons/copas-fiesta-1.gif"),
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

export type CelebrationSectionSettings = z.infer<
  typeof CelebrationSectionSettingsSchema
>;
