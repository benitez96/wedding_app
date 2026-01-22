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

export type AccommodationSectionSettings = z.infer<
  typeof AccommodationSectionSettingsSchema
>;
