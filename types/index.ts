import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

// Re-exportar tipos de íconos de sección
export type {
  SectionIcon,
  SectionIconType,
  SectionIconConfig,
} from "./section-icon";
export {
  SectionIcons,
  SectionIconTypes,
  SECTION_ICON_CATALOG,
  getSectionIconConfig,
  getSectionIconPath,
} from "./section-icon";
