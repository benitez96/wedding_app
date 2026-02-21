import { z } from "zod";
import { CommonSectionFieldsSchema } from "@/types/section-settings-schemas";

export const DRESS_CODE_SECTION_KEY = "dress_code" as const;

export const DressCodeSectionMetadata = {
  key: DRESS_CODE_SECTION_KEY,
  name: "Dress Code",
  description: "Código de vestimenta y sugerencias de colores",
  icon: "👔",
  defaultOrder: 5,
  defaultEnabled: true,
};

export const DressCodeSectionSettingsSchema = z
  .object({
    dressCode: z.string().default("Formal"),
    subtitle: z.string().default("(No blanco)"),
    showColorSuggestions: z.boolean().default(true),
  })
  .merge(CommonSectionFieldsSchema)
  .merge(
    z.object({
      icon: CommonSectionFieldsSchema.shape.icon.default("dress-code"),
    }),
  );

export type DressCodeSectionSettings = z.infer<
  typeof DressCodeSectionSettingsSchema
>;
