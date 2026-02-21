import { z } from "zod";
import { CommonSectionFieldsSchema } from "@/types/section-settings-schemas";

export const CEREMONY_SECTION_KEY = "ceremony" as const;

export const CeremonySectionMetadata = {
  key: CEREMONY_SECTION_KEY,
  name: "Ceremonia",
  description: "Información sobre la ceremonia",
  icon: "💒",
  defaultOrder: 3,
  defaultEnabled: true,
};

export const CeremonySectionSettingsSchema = z
  .object({
    time: z.string().default("19:30hs"),
    venueName: z.string().default("Iglesia Nuestra Señora del Carmen"),
    mapsUrl: z
      .string()
      .url()
      .default("https://maps.app.goo.gl/pwTwQ4vJzbBt1h1C9"),
    showDirectionsButton: z.boolean().default(true),
  })
  .merge(CommonSectionFieldsSchema)
  .merge(
    z.object({
      icon: CommonSectionFieldsSchema.shape.icon.default("rings-1"),
    }),
  );

export type CeremonySectionSettings = z.infer<
  typeof CeremonySectionSettingsSchema
>;
