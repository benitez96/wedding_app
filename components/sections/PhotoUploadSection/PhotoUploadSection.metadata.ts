import { z } from "zod";
import { CommonSectionFieldsSchema } from "@/types/section-settings-schemas";

export const PHOTO_UPLOAD_SECTION_KEY = "photo_upload" as const;

export const PhotoUploadSectionMetadata = {
  key: PHOTO_UPLOAD_SECTION_KEY,
  name: "Subir Fotos",
  description: "Botón para subir fotos y videos del evento",
  icon: "📷",
  defaultOrder: 9,
  defaultEnabled: true,
};

export const PhotoUploadSectionSettingsSchema = z
  .object({
    quoteText: z.string().default("Queremos ver como la pasaste!"),
    buttonText: z.string().default("SUBIR FOTOS Y VIDEOS"),
    description: z.string().default("Subi las fotos y videos desde tu mesa"),
    uploadUrl: z.string().url().optional(),
  })
  .merge(CommonSectionFieldsSchema)
  .merge(
    z.object({
      icon: CommonSectionFieldsSchema.shape.icon.default("photos-1"),
    }),
  );

export type PhotoUploadSectionSettings = z.infer<
  typeof PhotoUploadSectionSettingsSchema
>;
