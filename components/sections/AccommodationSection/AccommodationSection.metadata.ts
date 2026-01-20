import { z } from "zod";

export const ACCOMMODATION_SECTION_KEY = "accommodation" as const;

export const AccommodationSectionMetadata = {
  key: ACCOMMODATION_SECTION_KEY,
  name: "Alojamiento",
  description: "Lista de opciones de alojamiento cercanas",
  icon: "🏨",
  defaultOrder: 10,
  defaultEnabled: true,
};

export const AccommodationSectionSettingsSchema = z.object({
  title: z.string().default("ALOJAMIENTOS"),
  description: z
    .string()
    .default(
      "Sabemos que podés venir de lejos, así que te facilitamos algunos teléfonos de alojamientos cercanos",
    ),
  iconUrl: z.string().default("/icons/accommodation.gif"),
});

export type AccommodationSectionSettings = z.infer<
  typeof AccommodationSectionSettingsSchema
>;
