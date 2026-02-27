import { z } from "zod";
import {
  DecorationSvgSchema,
  DecorationPatternSchema,
} from "@/types/section-settings-schemas";

export const QR_SECTION_KEY = "qr" as const;

export const QRSectionMetadata = {
  key: QR_SECTION_KEY,
  name: "Código QR",
  description: "Código QR para check-in en el evento",
  icon: "🔲",
  defaultOrder: 9,
  defaultEnabled: false,
};

export const QRSectionSettingsSchema = z.object({
  title: z.string().default("Código de Acceso"),
  subtitle: z.string().default("Presenta este código QR al ingresar al evento"),
  hasAlternateBg: z.boolean().default(false),

  // Icon (QRSection doesn't use standard icon system, uses emoji)
  icon: z.string().default("qrcode"),

  // Decorations
  decorationSvg: DecorationSvgSchema.default("none"),
  decorationPattern: DecorationPatternSchema.default("corners"),
  decorationOpacity: z.number().min(0).max(100).default(10),
  decorationSize: z.number().min(20).max(200).default(60),
});

export type QRSectionSettings = z.infer<typeof QRSectionSettingsSchema>;
