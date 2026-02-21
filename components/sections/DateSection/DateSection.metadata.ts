import { z } from "zod";
import { CommonSectionFieldsSchema } from "@/types/section-settings-schemas";

export const DATE_SECTION_KEY = "date" as const;

export const DateSectionMetadata = {
  key: DATE_SECTION_KEY,
  name: "Fecha y Countdown",
  description: "Fecha de la boda y contador regresivo",
  icon: "📅",
  defaultOrder: 2,
  defaultEnabled: true,
};

export const DateSectionSettingsSchema = z
  .object({
    showCountdown: z.boolean().default(true),
    titleText: z.string().default("Te esperamos el día"),
    weddingDateTime: z.string().datetime({ local: true }).optional(),
  })
  .merge(CommonSectionFieldsSchema);

export type DateSectionSettings = z.infer<typeof DateSectionSettingsSchema>;
