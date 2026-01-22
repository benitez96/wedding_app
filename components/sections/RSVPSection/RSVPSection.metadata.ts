import { z } from "zod";

export const RSVP_SECTION_KEY = "rsvp" as const;

export const RSVPSectionMetadata = {
  key: RSVP_SECTION_KEY,
  name: "Confirmación RSVP",
  description: "Formulario de confirmación de asistencia",
  icon: "✅",
  defaultOrder: 8,
  defaultEnabled: true,
};

export const RSVPSectionSettingsSchema = z.object({
  showForm: z.boolean().default(true),
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

export type RSVPSectionSettings = z.infer<typeof RSVPSectionSettingsSchema>;
