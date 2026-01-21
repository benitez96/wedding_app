import { z } from "zod";

export const DATE_SECTION_KEY = "date" as const;

export const DateSectionMetadata = {
  key: DATE_SECTION_KEY,
  name: "Fecha y Countdown",
  description: "Fecha de la boda y contador regresivo",
  icon: "📅",
  defaultOrder: 2,
  defaultEnabled: true,
};

export const DateSectionSettingsSchema = z.object({
  showCountdown: z.boolean().default(true),
  titleText: z.string().default("Te esperamos el día"),
  // Fecha y hora del evento en formato ISO (YYYY-MM-DDTHH:mm)
  weddingDateTime: z.string().datetime({ local: true }).optional(),
  hasAlternateBg: z.boolean().default(false),
});

export type DateSectionSettings = z.infer<typeof DateSectionSettingsSchema>;
