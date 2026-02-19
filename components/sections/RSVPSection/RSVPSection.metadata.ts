import { z } from "zod";
import { SectionIconSchema } from "@/types/section-icon";

export const RSVP_SECTION_KEY = "rsvp" as const;

export const RSVPSectionMetadata = {
  key: RSVP_SECTION_KEY,
  name: "Confirmación RSVP",
  description: "Formulario de confirmación de asistencia",
  icon: "✅",
  defaultOrder: 8,
  defaultEnabled: true,
};

// Reusable base for configurable RSVP steps
const RSVPBaseStepSchema = z.object({
  enabled: z.boolean(),
  // TODO: i18n
  question: z.string(),
});

export const RSVPSectionSettingsSchema = z.object({
  showFloatingButton: z.boolean().default(true),
  hasAlternateBg: z.boolean().default(false),

  // --- Step 1: attendance question — always shown, fully configurable ---
  attendanceStep: z
    .object({
      // TODO: i18n
      question: z.string().default("¿Vas a asistir a nuestra boda?"),
      acceptLabel: z.string().default("¡Sí, acepto!"),
      acceptSubtitle: z.string().default("Voy a estar ahí"),
      declineLabel: z.string().default("No puedo ir :("),
      declineSubtitle: z.string().default("Lo siento mucho"),
    })
    .default({
      question: "¿Vas a asistir a nuestra boda?", // TODO: i18n
      acceptLabel: "¡Sí, acepto!", // TODO: i18n
      acceptSubtitle: "Voy a estar ahí", // TODO: i18n
      declineLabel: "No puedo ir :(", // TODO: i18n
      declineSubtitle: "Lo siento mucho", // TODO: i18n
    }),

  // --- Section display content ---

  // Content shown when guest has not yet responded
  pendingContent: z
    .object({
      icon: SectionIconSchema.default("rsvp"),
      // TODO: i18n
      decorativeText: z
        .string()
        .default('Decile "Si acepto" a nuestra invitacion'),
      ctaLabel: z.string().default("CONFIRMAR ASISTENCIA"),
      footerText: z.string().default("Tenes tiempo hasta el 10 de Enero!"),
    })
    .default({
      icon: "rsvp",
      decorativeText: 'Decile "Si acepto" a nuestra invitacion', // TODO: i18n
      ctaLabel: "CONFIRMAR ASISTENCIA", // TODO: i18n
      footerText: "Tenes tiempo hasta el 10 de Enero!", // TODO: i18n
    }),

  // Content shown after guest confirms attendance
  confirmedContent: z
    .object({
      icon: SectionIconSchema.default("disco-ball"),
      // TODO: i18n
      decorativeText: z
        .string()
        .default("¡Gracias por confirmar tu asistencia!"),
      description: z
        .string()
        .default(
          "¡Anda recargando baterías que vamos a bailar toda la noche! 🕺💃",
        ),
      footerText: z.string().default("¡Prepárate para una noche inolvidable!"),
      changeLabel: z.string().default("Cambié de opinión"),
    })
    .default({
      icon: "disco-ball",
      decorativeText: "¡Gracias por confirmar tu asistencia!", // TODO: i18n
      description:
        "¡Anda recargando baterías que vamos a bailar toda la noche! 🕺💃", // TODO: i18n
      footerText: "¡Prepárate para una noche inolvidable!", // TODO: i18n
      changeLabel: "Cambié de opinión", // TODO: i18n
    }),

  // Content shown after guest declines
  declinedContent: z
    .object({
      icon: SectionIconSchema.default("rsvp"),
      // TODO: i18n
      decorativeText: z.string().default("Entendemos que no puedas asistir"),
      description: z
        .string()
        .default(
          "¡Uff que triste! 😢 Nos hubiera encantado compartir este momento especial con vos.",
        ),
      footerText: z.string().default("¡Te vamos a extrañar mucho!"),
      changeLabel: z.string().default("Cambié de opinión"),
    })
    .default({
      icon: "rsvp",
      decorativeText: "Entendemos que no puedas asistir", // TODO: i18n
      description:
        "¡Uff que triste! 😢 Nos hubiera encantado compartir este momento especial con vos.", // TODO: i18n
      footerText: "¡Te vamos a extrañar mucho!", // TODO: i18n
      changeLabel: "Cambié de opinión", // TODO: i18n
    }),

  // --- Optional RSVP steps (only shown when attending) ---

  // Step: menu preference — radio with configurable options
  menuStep: RSVPBaseStepSchema.extend({
    // TODO: i18n
    options: z.array(z.string()).min(1).max(10),
  }).default({
    enabled: false,
    // TODO: i18n
    question: "¿Cuál es tu preferencia de menú?",
    options: ["Carne", "Vegetariano", "Vegano"],
  }),

  // Step: dietary restrictions — radio yes/no, yes reveals free text input
  dietaryStep: RSVPBaseStepSchema.default({
    enabled: false,
    // TODO: i18n
    question: "¿Tenés alguna alergia o restricción alimentaria?",
  }),

  // Step: message for the couple — free text textarea (always if attending)
  messageStep: RSVPBaseStepSchema.default({
    enabled: false,
    // TODO: i18n
    question: "¿Querés dejarnos un mensaje?",
  }),

  // Decoration system
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

export type RSVPSectionSettings = z.infer<typeof RSVPSectionSettingsSchema>;

// Exported step/content types for use in modal, status components and settings form
export type RSVPAttendanceStep = RSVPSectionSettings["attendanceStep"];
export type RSVPPendingContent = RSVPSectionSettings["pendingContent"];
export type RSVPConfirmedContent = RSVPSectionSettings["confirmedContent"];
export type RSVPDeclinedContent = RSVPSectionSettings["declinedContent"];
export type RSVPMenuStep = RSVPSectionSettings["menuStep"];
export type RSVPDietaryStep = RSVPSectionSettings["dietaryStep"];
export type RSVPMessageStep = RSVPSectionSettings["messageStep"];
