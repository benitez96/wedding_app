import { z } from "zod";
import { CommonSectionFieldsSchema } from "@/types/section-settings-schemas";

export const INSTAGRAM_SECTION_KEY = "instagram" as const;

export const InstagramSectionMetadata = {
  key: INSTAGRAM_SECTION_KEY,
  name: "Instagram",
  description: "Link a Instagram para compartir fotos",
  icon: "📸",
  defaultOrder: 7,
  defaultEnabled: true,
};

export const InstagramSectionSettingsSchema = z
  .object({
    quoteText: z.string().default("Si hay foto, hay historia!"),
    instagramHandle: z.string().default("@wedding_danysol"),
    instagramUrl: z
      .string()
      .default("https://www.instagram.com/wedding_danysol"),
    description: z
      .string()
      .default(
        "Seguinos en nuestra cuenta de instagram y etiquetanos en tus fotos y videos!",
      ),
  })
  .merge(CommonSectionFieldsSchema)
  .merge(
    z.object({
      icon: CommonSectionFieldsSchema.shape.icon.default("instagram"),
    }),
  );

export type InstagramSectionSettings = z.infer<
  typeof InstagramSectionSettingsSchema
>;
