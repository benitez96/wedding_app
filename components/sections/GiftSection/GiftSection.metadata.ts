import { z } from "zod";
import { CommonSectionFieldsSchema } from "@/types/section-settings-schemas";

export const GIFT_SECTION_KEY = "gift" as const;

export const GiftSectionMetadata = {
  key: GIFT_SECTION_KEY,
  name: "Regalos",
  description: "Información sobre regalos y alias bancario",
  icon: "🎁",
  defaultOrder: 6,
  defaultEnabled: true,
};

export const GiftSectionSettingsSchema = z
  .object({
    title: z.string().default("REGALOS"),
    description: z
      .string()
      .default("Tu compañía es el mejor regalo, pero si deseás ayudarnos…"),
    alias: z.string().default("DANI.SOL.HONEYMOON"),
    footerText: z.string().default("Ayudanos con nuestra luna de miel"),
  })
  .merge(CommonSectionFieldsSchema)
  .merge(
    z.object({
      icon: CommonSectionFieldsSchema.shape.icon.default("gift-2"),
    }),
  );

export type GiftSectionSettings = z.infer<typeof GiftSectionSettingsSchema>;
