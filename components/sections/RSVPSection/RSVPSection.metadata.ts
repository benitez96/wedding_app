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
});

export type RSVPSectionSettings = z.infer<typeof RSVPSectionSettingsSchema>;
