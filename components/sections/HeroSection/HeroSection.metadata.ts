import { z } from "zod";

export const HERO_SECTION_KEY = "hero" as const;

export const HeroSectionMetadata = {
  key: HERO_SECTION_KEY,
  name: "Hero",
  description: "Imagen principal y título de la invitación",
  icon: "🎉",
  defaultOrder: 0,
  defaultEnabled: true,
};

export const TEXT_COLORS = {
  BLACK: "black",
  WHITE: "white",
} as const;

export const LAYOUT_MODES = {
  OVERLAY: "overlay",
  STACKED: "stacked",
} as const;

export const HeroSectionSettingsSchema = z.object({
  imageUrl: z.string().optional(),
  title: z.string().optional(),
  showScrollIndicator: z.boolean().default(true),
  enableOverlay: z.boolean().default(false),
  enableFadeEffect: z.boolean().default(false),
  textColor: z
    .enum([TEXT_COLORS.BLACK, TEXT_COLORS.WHITE])
    .default(TEXT_COLORS.BLACK),
  layoutMode: z
    .enum([LAYOUT_MODES.OVERLAY, LAYOUT_MODES.STACKED])
    .default(LAYOUT_MODES.OVERLAY),
  mediaType: z.enum(["image", "video"]).default("image"),
});

export type HeroSectionSettings = z.infer<typeof HeroSectionSettingsSchema>;
