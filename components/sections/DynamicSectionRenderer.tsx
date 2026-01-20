import { SectionConfiguration, SectionUser } from "@/types/sections";
import { SECTION_COMPONENTS, SectionKey } from "./index";
import AnimatedDividerCSS from "@/components/AnimatedDividerCSS";
import { ComponentType } from "react";

interface DynamicSectionRendererProps {
  sections: SectionConfiguration[];
  user?: SectionUser | null;
}

// Configuración de dividers entre secciones
const DIVIDER_CONFIG: Record<
  string,
  { variant: "heart" | "elegant" | "simple"; delay: number } | null
> = {
  date: { variant: "heart", delay: 0.2 },
  ceremony: null, // No divider después de ceremony
  celebration: { variant: "elegant", delay: 0.1 },
  dress_code: { variant: "simple", delay: 0.3 },
  gift: { variant: "heart", delay: 0.4 },
  instagram: { variant: "simple", delay: 0.1 },
  rsvp: { variant: "elegant", delay: 0.5 },
  photo_upload: { variant: "simple", delay: 0.5 },
  accommodation: { variant: "simple", delay: 0.2 },
};

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
      {enabledSections.map((section, index) => {
        const isLastSection = index === enabledSections.length - 1;
        const dividerConfig = DIVIDER_CONFIG[section.key];

        // Obtener el componente del registry
        const Component = SECTION_COMPONENTS[section.key as SectionKey] as
          | ComponentType<GenericSectionProps>
          | undefined;

        if (!Component) {
          console.warn(`Section component not found for key: ${section.key}`);
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

            {/* Renderizar divider si corresponde */}
            {!isLastSection && dividerConfig && (
              <AnimatedDividerCSS
                variant={dividerConfig.variant}
                delay={dividerConfig.delay}
              />
            )}
          </div>
        );
      })}
    </>
  );
}
