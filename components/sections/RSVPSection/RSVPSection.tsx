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

export default function RSVPSection({ settings, user }: RSVPSectionProps) {
  const showForm = settings?.showForm ?? true;
  const hasAlternateBg = settings?.hasAlternateBg ?? false;

  // Decoraciones
  const decorationSvg = (settings?.decorationSvg || "none") as DecorationSvg;
  const decorationPattern = (settings?.decorationPattern ||
    "none") as DecorationPattern;
  const decorationOpacity = settings?.decorationOpacity ?? 10;
  const decorationSize = settings?.decorationSize ?? 60;

  if (!showForm) {
    return null;
  }

  // En preview mode (sin user), mostrar un placeholder
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
      hasAlternateBg={hasAlternateBg}
      decorationSvg={decorationSvg}
      decorationPattern={decorationPattern}
      decorationOpacity={decorationOpacity}
      decorationSize={decorationSize}
    />
  );
}
