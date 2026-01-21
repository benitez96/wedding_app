import { z } from "zod";

export const DRESS_CODE_SECTION_KEY = "dress_code" as const;

export const DressCodeSectionMetadata = {
  key: DRESS_CODE_SECTION_KEY,
  name: "Dress Code",
  description: "Código de vestimenta y sugerencias de colores",
  icon: "👔",
  defaultOrder: 5,
  defaultEnabled: true,
};

export const DressCodeSectionSettingsSchema = z.object({
  dressCode: z.string().default("Formal"),
  subtitle: z.string().default("(No blanco)"),
  showColorSuggestions: z.boolean().default(true),
  iconUrl: z.string().default("/icons/dress-code.gif"),
  hasAlternateBg: z.boolean().default(false),
});

export type DressCodeSectionSettings = z.infer<
  typeof DressCodeSectionSettingsSchema
>;
