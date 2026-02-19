import RSVPSectionClient from "@/components/sections/RSVPSectionClient";
import { RSVPSectionSettings } from "./RSVPSection.metadata";
import { Section } from "@/components/section";
import { SectionUser } from "@/types/sections";
import { DecorationSvg, DecorationPattern } from "@/types/decoration";
import { DecorationLayer } from "@/components/ui/DecorationLayer";

interface RSVPSectionProps {
  settings?: RSVPSectionSettings;
  user?: SectionUser | null;
}

// Default step config — mirrors schema defaults, used in preview mode and as fallback
export const DEFAULT_STEP_CONFIG = {
  attendanceStep: {
    question: "¿Vas a asistir a nuestra boda?", // TODO: i18n
    acceptLabel: "¡Sí, acepto!", // TODO: i18n
    acceptSubtitle: "Voy a estar ahí", // TODO: i18n
    declineLabel: "No puedo ir :(", // TODO: i18n
    declineSubtitle: "Lo siento mucho", // TODO: i18n
  },
  pendingContent: {
    icon: "rsvp" as const,
    decorativeText: 'Decile "Si acepto" a nuestra invitacion', // TODO: i18n
    ctaLabel: "CONFIRMAR ASISTENCIA", // TODO: i18n
    footerText: "Tenes tiempo hasta el 10 de Enero!", // TODO: i18n
  },
  confirmedContent: {
    icon: "disco-ball" as const,
    decorativeText: "¡Gracias por confirmar tu asistencia!", // TODO: i18n
    description:
      "¡Anda recargando baterías que vamos a bailar toda la noche! 🕺💃", // TODO: i18n
    footerText: "¡Prepárate para una noche inolvidable!", // TODO: i18n
    changeLabel: "Cambié de opinión", // TODO: i18n
  },
  declinedContent: {
    icon: "rsvp" as const,
    decorativeText: "Entendemos que no puedas asistir", // TODO: i18n
    description:
      "¡Uff que triste! 😢 Nos hubiera encantado compartir este momento especial con vos.", // TODO: i18n
    footerText: "¡Te vamos a extrañar mucho!", // TODO: i18n
    changeLabel: "Cambié de opinión", // TODO: i18n
  },
  menuStep: {
    enabled: false,
    question: "¿Cuál es tu preferencia de menú?", // TODO: i18n
    options: ["Carne", "Vegetariano", "Vegano"] as string[], // TODO: i18n
  },
  dietaryStep: {
    enabled: false,
    question: "¿Tenés alguna alergia o restricción alimentaria?", // TODO: i18n
  },
  messageStep: {
    enabled: false,
    question: "¿Querés dejarnos un mensaje?", // TODO: i18n
  },
};

export default function RSVPSection({ settings, user }: RSVPSectionProps) {
  const hasAlternateBg = settings?.hasAlternateBg ?? false;

  const decorationSvg = (settings?.decorationSvg ?? "none") as DecorationSvg;
  const decorationPattern = (settings?.decorationPattern ??
    "none") as DecorationPattern;
  const decorationOpacity = settings?.decorationOpacity ?? 10;
  const decorationSize = settings?.decorationSize ?? 60;

  const stepConfig = {
    attendanceStep:
      settings?.attendanceStep ?? DEFAULT_STEP_CONFIG.attendanceStep,
    pendingContent:
      settings?.pendingContent ?? DEFAULT_STEP_CONFIG.pendingContent,
    confirmedContent:
      settings?.confirmedContent ?? DEFAULT_STEP_CONFIG.confirmedContent,
    declinedContent:
      settings?.declinedContent ?? DEFAULT_STEP_CONFIG.declinedContent,
    menuStep: settings?.menuStep ?? DEFAULT_STEP_CONFIG.menuStep,
    dietaryStep: settings?.dietaryStep ?? DEFAULT_STEP_CONFIG.dietaryStep,
    messageStep: settings?.messageStep ?? DEFAULT_STEP_CONFIG.messageStep,
  };

  // Preview mode (no user) — show placeholder
  if (!user) {
    return (
      <DecorationLayer
        key={`rsvp-decoration-${hasAlternateBg}`}
        svg={decorationSvg}
        pattern={decorationPattern}
        opacity={decorationOpacity}
        size={decorationSize}
        hasAlternateBg={hasAlternateBg}
      >
        <Section.Container hasAlternateBg={hasAlternateBg}>
          {/* TODO: i18n */}
          <Section.Title>CONFIRMÁ TU ASISTENCIA</Section.Title>
          <Section.Description>
            El formulario de confirmación aparecerá aquí para los invitados
          </Section.Description>
        </Section.Container>
      </DecorationLayer>
    );
  }

  return (
    <RSVPSectionClient
      user={user}
      stepConfig={stepConfig}
      hasAlternateBg={hasAlternateBg}
      decorationSvg={decorationSvg}
      decorationPattern={decorationPattern}
      decorationOpacity={decorationOpacity}
      decorationSize={decorationSize}
    />
  );
}
