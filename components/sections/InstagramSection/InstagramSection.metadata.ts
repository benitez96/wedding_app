import { z } from "zod";
import { SectionIcons } from "@/types/section-icon";

export const INSTAGRAM_SECTION_KEY = "instagram" as const;

export const InstagramSectionMetadata = {
  key: INSTAGRAM_SECTION_KEY,
  name: "Instagram",
  description: "Link a Instagram para compartir fotos",
  icon: "📸",
  defaultOrder: 7,
  defaultEnabled: true,
};

export const InstagramSectionSettingsSchema = z.object({
  quoteText: z.string().default("Si hay foto, hay historia!"),
  instagramHandle: z.string().default("@wedding_danysol"),
  instagramUrl: z.string().default("https://www.instagram.com/wedding_danysol"),
  description: z
    .string()
    .default(
      "Seguinos en nuestra cuenta de instagram y etiquetanos en tus fotos y videos!",
    ),

  // Sistema nuevo de íconos
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
    .default("instagram"),

  // Deprecated: mantener por compatibilidad hacia atrás
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

export type InstagramSectionSettings = z.infer<
  typeof InstagramSectionSettingsSchema
>;
