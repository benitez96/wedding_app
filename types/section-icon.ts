/**
 * Sistema de íconos para secciones
 * Soporta GIFs, SVGs estáticos y SVGs animados
 */

export const SectionIconTypes = {
  GIF: "gif",
  SVG: "svg",
  SVG_ANIMATED: "svg-animated",
} as const;

export type SectionIconType =
  (typeof SectionIconTypes)[keyof typeof SectionIconTypes];

// Íconos disponibles (agregar más acá)
export const SectionIcons = {
  // Predeterminado
  NONE: "none",

  // GIFs
  RINGS_1: "rings-1",
  RINGS_2: "rings-2",
  CELEBRATION_1: "celebration-1",
  CELEBRATION_2: "celebration-2",
  GIFT_1: "gift-1",
  GIFT_2: "gift-2",
  PHOTOS_1: "photos-1",
  PHOTOS_2: "photos-2",
  INSTAGRAM: "instagram",
  DRESS_CODE: "dress-code",
  ACCOMMODATION: "accommodation",
  CHURCH: "church",
  DISCO_BALL: "disco-ball",
  RSVP: "rsvp",
  CALENDAR: "calendar",
  MUSIC: "music",
} as const;

export type SectionIcon = (typeof SectionIcons)[keyof typeof SectionIcons];

// Configuración de cada ícono
export interface SectionIconConfig {
  value: SectionIcon;
  label: string;
  type: SectionIconType;
  path: string; // Ruta al archivo (puede ser .gif, .svg, etc)
  animationClass?: string; // Clase CSS opcional para animaciones adicionales
}

// Catálogo completo de íconos
export const SECTION_ICON_CATALOG: SectionIconConfig[] = [
  {
    value: "none",
    label: "Sin ícono",
    type: "svg",
    path: "",
  },

  // === GIFs ===
  {
    value: "rings-1",
    label: "Anillos 1",
    type: "gif",
    path: "/icons/anillos-boda-1.gif",
  },
  {
    value: "rings-2",
    label: "Anillos 2",
    type: "gif",
    path: "/icons/anillos-boda.gif",
  },
  {
    value: "celebration-1",
    label: "Copas 1",
    type: "gif",
    path: "/icons/copas-fiesta-1.gif",
  },
  {
    value: "celebration-2",
    label: "Copas 2",
    type: "gif",
    path: "/icons/copas-fiesta.gif",
  },
  {
    value: "gift-1",
    label: "Regalo 1",
    type: "gif",
    path: "/icons/regalo-1.gif",
  },
  {
    value: "gift-2",
    label: "Regalo 2",
    type: "gif",
    path: "/icons/regalo-2.gif",
  },
  {
    value: "photos-1",
    label: "Fotos 1",
    type: "gif",
    path: "/icons/fotos.gif",
  },
  {
    value: "photos-2",
    label: "Fotos 2",
    type: "gif",
    path: "/icons/fotos-2.gif",
  },
  {
    value: "instagram",
    label: "Instagram",
    type: "gif",
    path: "/icons/instagram.gif",
  },
  {
    value: "dress-code",
    label: "Dress Code",
    type: "gif",
    path: "/icons/dress-code.gif",
  },
  {
    value: "accommodation",
    label: "Alojamiento",
    type: "gif",
    path: "/icons/accommodation.gif",
  },
  {
    value: "church",
    label: "Iglesia",
    type: "gif",
    path: "/icons/iglesia.gif",
  },
  {
    value: "disco-ball",
    label: "Disco Ball",
    type: "gif",
    path: "/icons/disco-ball.gif",
  },
  {
    value: "rsvp",
    label: "RSVP",
    type: "gif",
    path: "/icons/RSVP.gif",
  },
  {
    value: "calendar",
    label: "Calendario",
    type: "gif",
    path: "/icons/calendar-1.gif",
  },
  {
    value: "music",
    label: "Música",
    type: "gif",
    path: "/icons/cancion.gif",
  },

  // === SVGs estáticos ===
  // Agregar acá cuando tengas SVGs estáticos
  // {
  //   value: "heart-static",
  //   label: "Corazón",
  //   type: "svg",
  //   path: "/icons/heart.svg",
  // },

  // === SVGs animados ===
  // Agregar acá cuando tengas SVGs con animación CSS
  // {
  //   value: "heart-animated",
  //   label: "Corazón animado",
  //   type: "svg-animated",
  //   path: "/icons/heart-animated.svg",
  //   animationClass: "animate-pulse",
  // },
];

/**
 * Helper para obtener la configuración de un ícono
 */
export function getSectionIconConfig(
  icon: SectionIcon,
): SectionIconConfig | undefined {
  return SECTION_ICON_CATALOG.find((config) => config.value === icon);
}

/**
 * Helper para obtener la ruta de un ícono
 */
export function getSectionIconPath(icon: SectionIcon): string {
  const config = getSectionIconConfig(icon);
  return config?.path || "";
}
