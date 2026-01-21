import { z } from "zod";

export const CELEBRATION_SECTION_KEY = "celebration" as const;

export const CelebrationSectionMetadata = {
  key: CELEBRATION_SECTION_KEY,
  name: "Celebración",
  description: "Información sobre la fiesta",
  icon: "🎊",
  defaultOrder: 4,
  defaultEnabled: true,
};

export const CelebrationSectionSettingsSchema = z.object({
  description: z
    .string()
    .default("Despues de la Ceremonia festejaremos en el Club Union"),
  venueName: z.string().default("Club Union"),
  mapsUrl: z
    .string()
    .url()
    .default("https://maps.app.goo.gl/AjTWBW7Y25sENdw36"),
  iconUrl: z.string().default("/icons/copas-fiesta-1.gif"),
  showDirectionsButton: z.boolean().default(true),
  hasAlternateBg: z.boolean().default(false),
});

export type CelebrationSectionSettings = z.infer<
  typeof CelebrationSectionSettingsSchema
>;
