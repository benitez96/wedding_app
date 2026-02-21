import { z } from "zod";
import { CommonSectionFieldsSchema } from "@/types/section-settings-schemas";

export const QUOTE_SECTION_KEY = "quote" as const;

export const QuoteSectionMetadata = {
  key: QUOTE_SECTION_KEY,
  name: "Frase",
  description: "Frase o cita especial",
  icon: "💬",
  defaultOrder: 1,
  defaultEnabled: true,
};

export const QuoteSectionSettingsSchema = z
  .object({
    quoteText: z
      .string()
      .default(
        "El amor nos unió, y queremos compartir nuestra felicidad con vos.",
      ),
    showQuote: z.boolean().default(true),
  })
  .merge(CommonSectionFieldsSchema)
  .merge(
    z.object({
      hasAlternateBg: z.boolean().default(true), // QuoteSection tiene bg por defecto
    }),
  );

export type QuoteSectionSettings = z.infer<typeof QuoteSectionSettingsSchema>;
