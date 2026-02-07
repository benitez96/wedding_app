import { z } from "zod";

export const DIVIDER_SECTION_KEY = "divider" as const;

export const DividerSectionMetadata = {
  key: DIVIDER_SECTION_KEY,
  name: "Separador",
  description: "Divisor decorativo entre secciones",
  icon: "✨",
  defaultOrder: 999,
  defaultEnabled: true,
};

export const DividerSectionSettingsSchema = z.object({
  variant: z.enum(["simple", "heart", "ornate", "elegant"]).default("heart"),
  delay: z.number().min(0).max(2).default(0.2),
  hasAlternateBg: z.boolean().default(false),
});

export type DividerSectionSettings = z.infer<
  typeof DividerSectionSettingsSchema
>;
