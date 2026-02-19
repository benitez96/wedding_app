/**
 * Section icon system
 * Supports GIFs, static SVGs, and animated SVGs
 */
import { z } from "zod";

export const SectionIconTypes = {
  GIF: "gif",
  SVG: "svg",
  SVG_ANIMATED: "svg-animated",
} as const;

export type SectionIconType =
  (typeof SectionIconTypes)[keyof typeof SectionIconTypes];

// Available icons (add more here)
export const SectionIcons = {
  // Default
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

// Derived tuple for Zod — single source of truth, add icons in SectionIcons above
export const SECTION_ICON_VALUES = Object.values(SectionIcons) as [
  SectionIcon,
  ...SectionIcon[],
];

// Reusable Zod schema for any section that has an icon field
export const SectionIconSchema = z.enum(SECTION_ICON_VALUES);

// Configuration for each icon
export interface SectionIconConfig {
  value: SectionIcon;
  label: string;
  type: SectionIconType;
  path: string; // Path to file (can be .gif, .svg, etc)
  animationClass?: string; // Optional CSS class for additional animations
}

// Complete icon catalog
// TODO i18n: Labels need translation support
export const SECTION_ICON_CATALOG: SectionIconConfig[] = [
  {
    value: "none",
    label: "No icon",
    type: "svg",
    path: "",
  },

  // === GIFs ===
  {
    value: "rings-1",
    label: "Rings 1",
    type: "gif",
    path: "/icons/anillos-boda-1.gif",
  },
  {
    value: "rings-2",
    label: "Rings 2",
    type: "gif",
    path: "/icons/anillos-boda.gif",
  },
  {
    value: "celebration-1",
    label: "Glasses 1",
    type: "gif",
    path: "/icons/copas-fiesta-1.gif",
  },
  {
    value: "celebration-2",
    label: "Glasses 2",
    type: "gif",
    path: "/icons/copas-fiesta.gif",
  },
  {
    value: "gift-1",
    label: "Gift 1",
    type: "gif",
    path: "/icons/regalo-1.gif",
  },
  {
    value: "gift-2",
    label: "Gift 2",
    type: "gif",
    path: "/icons/regalo-2.gif",
  },
  {
    value: "photos-1",
    label: "Photos 1",
    type: "gif",
    path: "/icons/fotos.gif",
  },
  {
    value: "photos-2",
    label: "Photos 2",
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
    label: "Accommodation",
    type: "gif",
    path: "/icons/accommodation.gif",
  },
  {
    value: "church",
    label: "Church",
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
    label: "Calendar",
    type: "gif",
    path: "/icons/calendar-1.gif",
  },
  {
    value: "music",
    label: "Music",
    type: "gif",
    path: "/icons/cancion.gif",
  },

  // === Static SVGs ===
  // Add here when you have static SVGs
  // {
  //   value: "heart-static",
  //   label: "Heart",
  //   type: "svg",
  //   path: "/icons/heart.svg",
  // },

  // === Animated SVGs ===
  // Add here when you have SVGs with CSS animations
  // {
  //   value: "heart-animated",
  //   label: "Animated Heart",
  //   type: "svg-animated",
  //   path: "/icons/heart-animated.svg",
  //   animationClass: "animate-pulse",
  // },
];

/**
 * Helper to get icon configuration
 */
export function getSectionIconConfig(
  icon: SectionIcon,
): SectionIconConfig | undefined {
  return SECTION_ICON_CATALOG.find((config) => config.value === icon);
}

/**
 * Helper to get icon path
 */
export function getSectionIconPath(icon: SectionIcon): string {
  const config = getSectionIconConfig(icon);
  return config?.path || "";
}
