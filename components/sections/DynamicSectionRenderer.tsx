import { ComponentType } from "react";
import { SECTION_COMPONENTS, SectionKey } from "./index";
import { SectionConfiguration, SectionUser } from "@/types/sections";

interface DynamicSectionRendererProps {
  sections: SectionConfiguration[];
  user?: SectionUser | null;
}

// Secciones que necesitan user prop
const SECTIONS_WITH_USER = new Set<string>(["rsvp"]);

// Tipo genérico para props de sección (cada sección parsea sus propios settings)
interface GenericSectionProps {
  settings?: Record<string, unknown>;
  user?: SectionUser | null;
}

export default function DynamicSectionRenderer({
  sections,
  user,
}: DynamicSectionRendererProps) {
  // Filtrar solo secciones habilitadas y ordenarlas
  const enabledSections = sections
    .filter((section) => section.isEnabled)
    .sort((a, b) => a.order - b.order);

  return (
    <>
      {enabledSections.map((section) => {
        // Obtener el componente del registry
        const Component = SECTION_COMPONENTS[section.key as SectionKey] as
          | ComponentType<GenericSectionProps>
          | undefined;

        if (!Component) {
          return null;
        }

        // Props base para todas las secciones
        const props: GenericSectionProps = { settings: section.settings };

        // Props adicionales para secciones que necesitan user
        if (SECTIONS_WITH_USER.has(section.key)) {
          props.user = user;
        }

        return (
          <div key={section.id}>
            <Component {...props} />
          </div>
        );
      })}
    </>
  );
}
