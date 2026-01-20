import { z } from "zod";

export const GIFT_SECTION_KEY = "gift" as const;

export const GiftSectionMetadata = {
  key: GIFT_SECTION_KEY,
  name: "Regalos",
  description: "Información sobre regalos y alias bancario",
  icon: "🎁",
  defaultOrder: 6,
  defaultEnabled: true,
};

export const GiftSectionSettingsSchema = z.object({
  title: z.string().default("REGALOS"),
  description: z
    .string()
    .default("Tu compañía es el mejor regalo, pero si deseás ayudarnos…"),
  alias: z.string().default("DANI.SOL.HONEYMOON"),
  footerText: z.string().default("Ayudanos con nuestra luna de miel"),
  iconUrl: z.string().default("/icons/regalo-2.gif"),
});

export type GiftSectionSettings = z.infer<typeof GiftSectionSettingsSchema>;
