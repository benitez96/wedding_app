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

export type PhotoUploadSectionSettings = z.infer<
  typeof PhotoUploadSectionSettingsSchema
>;
