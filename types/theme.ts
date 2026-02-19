// Theme IDs
export const THEME_IDS = {
  CLASSIC: "classic",
  WARM: "warm",
  PASTEL_GREEN: "pastel-green",
  MOCHA: "mocha",
  CUSTOM: "custom",
} as const;

export type ThemeId = (typeof THEME_IDS)[keyof typeof THEME_IDS];

/**
 * The 5 colors the user configures for a fully custom theme.
 *
 * background → page background (e.g. near-white or deep dark)
 * foreground → main text color on top of background
 * primary    → CTA buttons, links, active icons (bg-primary, color="primary")
 * secondary  → alternate section backgrounds (bg-secondary, hasAlternateBg)
 * accent     → decorative dividers, music button gradient (text-accent, to-accent)
 *
 * primary-foreground and secondary-foreground are auto-calculated via WCAG contrast
 * so buttons/sections never become unreadable regardless of the user's color choice.
 */
export interface CustomThemeColors {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  accent: string;
}

// Used for predefined theme color previews in the theme selector
export interface ThemeColors extends CustomThemeColors {}

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  colors: ThemeColors;
}

export const THEMES: Record<Exclude<ThemeId, "custom">, Theme> = {
  [THEME_IDS.CLASSIC]: {
    id: THEME_IDS.CLASSIC,
    name: "Clásico",
    description: "Blanco, negro y grises elegantes",
    colors: {
      background: "#ffffff",
      foreground: "#111111",
      primary: "#000000",
      secondary: "#2C2C2C",
      accent: "#4A4A4A",
    },
  },
  [THEME_IDS.WARM]: {
    id: THEME_IDS.WARM,
    name: "Cálido",
    description: "Marrón dorado elegante",
    colors: {
      background: "#fffff0",
      foreground: "#2C1A0E",
      primary: "#8B5A3C",
      secondary: "#B89A7A",
      accent: "#D4AF37",
    },
  },
  [THEME_IDS.PASTEL_GREEN]: {
    id: THEME_IDS.PASTEL_GREEN,
    name: "Verde Pastel",
    description: "Verde menta suave y elegante",
    colors: {
      background: "#f1faee",
      foreground: "#1A2E1A",
      primary: "#7FB069",
      secondary: "#A8DADC",
      accent: "#98C1A3",
    },
  },
  // Catppuccin Mocha — dark, cozy, purple-tinted
  [THEME_IDS.MOCHA]: {
    id: THEME_IDS.MOCHA,
    name: "Mocha",
    description: "Oscuro y acogedor, inspirado en Catppuccin",
    colors: {
      background: "#1e1e2e", // Mocha Base
      foreground: "#cdd6f4", // Mocha Text
      primary: "#cba6f7", // Mocha Mauve
      secondary: "#313244", // Mocha Surface0
      accent: "#f38ba8", // Mocha Pink
    },
  },
} as const;

export const DEFAULT_CUSTOM_THEME_COLORS: CustomThemeColors = {
  background: "#ffffff",
  foreground: "#111111",
  primary: "#6366f1",
  secondary: "#a5b4fc",
  accent: "#818cf8",
};

export const THEME_LIST = Object.values(THEMES);

export function getThemeById(id: Exclude<ThemeId, "custom">): Theme {
  return THEMES[id];
}

export function isCustomTheme(id: string): id is "custom" {
  return id === THEME_IDS.CUSTOM;
}

export function isPredefinedTheme(
  id: string,
): id is Exclude<ThemeId, "custom"> {
  return id in THEMES;
}
