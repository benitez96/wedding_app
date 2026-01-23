import { z } from "zod";
import { SectionIcons } from "@/types/section-icon";

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

  // Sistema nuevo de íconos
  icon: z
    .enum([
      "none",
      "rings-1",
      "rings-2",
      "celebration-1",
      "celebration-2",
      "gift-1",
      "gift-2",
      "photos-1",
      "photos-2",
      "instagram",
      "dress-code",
      "accommodation",
      "church",
      "disco-ball",
      "rsvp",
      "calendar",
      "music",
    ])
    .default("accommodation"),

  // Deprecated: mantener por compatibilidad hacia atrás
  iconUrl: z.string().optional(),

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
