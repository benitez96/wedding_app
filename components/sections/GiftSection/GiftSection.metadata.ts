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

export type GiftSectionSettings = z.infer<typeof GiftSectionSettingsSchema>;
