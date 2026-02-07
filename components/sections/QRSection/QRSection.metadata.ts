import { z } from "zod";

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

  // Ícono de sección
  icon: z.string().default("qrcode"),

  // Sistema de decoraciones
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

export type QRSectionSettings = z.infer<typeof QRSectionSettingsSchema>;
