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

export const HeroSectionSettingsSchema = z.object({
  imageUrl: z.string().optional(),
  title: z.string().optional(),
  showScrollIndicator: z.boolean().default(true),
});

export type HeroSectionSettings = z.infer<typeof HeroSectionSettingsSchema>;
