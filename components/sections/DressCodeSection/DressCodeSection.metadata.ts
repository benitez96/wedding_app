import { z } from "zod";

export const DRESS_CODE_SECTION_KEY = "dress_code" as const;

export const DressCodeSectionMetadata = {
  key: DRESS_CODE_SECTION_KEY,
  name: "Dress Code",
  description: "Código de vestimenta y sugerencias de colores",
  icon: "👔",
  defaultOrder: 5,
  defaultEnabled: true,
};

export const DressCodeSectionSettingsSchema = z.object({
  dressCode: z.string().default("Formal"),
  subtitle: z.string().default("(No blanco)"),
  showColorSuggestions: z.boolean().default(true),

  icon: z
    .enum([
      "none",
      "rings-1",
      "rings-2",
      "celebration-1",
      "celebration-2",
      "gift-1",
      "gift-2",
      "photos-1",
      "photos-2",
      "instagram",
      "dress-code",
      "accommodation",
      "church",
      "disco-ball",
      "rsvp",
      "calendar",
      "music",
    ])
    .default("dress-code"),
  iconUrl: z.string().optional(),

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

export type DressCodeSectionSettings = z.infer<
  typeof DressCodeSectionSettingsSchema
>;
