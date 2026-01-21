import { z } from "zod";

export const PHOTO_UPLOAD_SECTION_KEY = "photo_upload" as const;

export const PhotoUploadSectionMetadata = {
  key: PHOTO_UPLOAD_SECTION_KEY,
  name: "Subir Fotos",
  description: "Botón para subir fotos y videos del evento",
  icon: "📷",
  defaultOrder: 9,
  defaultEnabled: true,
};

export const PhotoUploadSectionSettingsSchema = z.object({
  quoteText: z.string().default("Queremos ver como la pasaste!"),
  buttonText: z.string().default("SUBIR FOTOS Y VIDEOS"),
  description: z.string().default("Subi las fotos y videos desde tu mesa"),
  iconUrl: z.string().default("/icons/fotos.gif"),
  // URL donde los invitados suben fotos/videos
  uploadUrl: z.string().url().optional(),
  hasAlternateBg: z.boolean().default(false),
});

export type PhotoUploadSectionSettings = z.infer<
  typeof PhotoUploadSectionSettingsSchema
>;
