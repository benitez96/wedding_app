import RSVPSectionClient from "@/components/sections/RSVPSectionClient";
import { RSVPSectionSettings } from "./RSVPSection.metadata";
import { Section } from "@/components/section";
import { SectionUser } from "@/types/sections";

interface RSVPSectionProps {
  settings?: RSVPSectionSettings;
  user?: SectionUser | null;
}

export default function RSVPSection({ settings, user }: RSVPSectionProps) {
  const showForm = settings?.showForm ?? true;

  if (!showForm) {
    return null;
  }

  // En preview mode (sin user), mostrar un placeholder
  if (!user) {
    return (
      <Section.Container>
        <Section.Title>CONFIRMÁ TU ASISTENCIA</Section.Title>
        <Section.Description>
          El formulario de confirmación aparecerá aquí para los invitados
        </Section.Description>
      </Section.Container>
    );
  }

  return <RSVPSectionClient user={user} />;
}
