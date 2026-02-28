// Theme IDs
export const THEME_IDS = {
  // Light themes
  CLASSIC: "classic",
  WARM: "warm",
  ROSE_PINE_DAWN: "rose-pine-dawn",
  SAGE: "sage",
  // Dark themes
  MOCHA: "mocha",
  MIDNIGHT_GOLD: "midnight-gold",
  // Custom
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
  // ═══════════════════════════════════════════════════════════════════════════
  // LIGHT THEMES
  // ═══════════════════════════════════════════════════════════════════════════

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

  [THEME_IDS.ROSE_PINE_DAWN]: {
    id: THEME_IDS.ROSE_PINE_DAWN,
    name: "Rosé",
    description: "Rosados suaves y románticos",
    colors: {
      background: "#faf4ed", // Dawn Base
      foreground: "#575279", // Dawn Text
      primary: "#d7827e", // Dawn Rose
      secondary: "#f2e9e1", // Dawn Surface
      accent: "#b4637a", // Dawn Love
    },
  },

  [THEME_IDS.SAGE]: {
    id: THEME_IDS.SAGE,
    name: "Sage",
    description: "Verde salvia sofisticado",
    colors: {
      background: "#f8faf8",
      foreground: "#2d3a2d",
      primary: "#6b8e6b",
      secondary: "#e8f0e8",
      accent: "#8fab8f",
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DARK THEMES
  // ═══════════════════════════════════════════════════════════════════════════

  [THEME_IDS.MOCHA]: {
    id: THEME_IDS.MOCHA,
    name: "Mocha",
    description: "Oscuro y acogedor",
    colors: {
      background: "#1e1e2e", // Mocha Base
      foreground: "#cdd6f4", // Mocha Text
      primary: "#cba6f7", // Mocha Mauve
      secondary: "#313244", // Mocha Surface0
      accent: "#f38ba8", // Mocha Pink
    },
  },

  [THEME_IDS.MIDNIGHT_GOLD]: {
    id: THEME_IDS.MIDNIGHT_GOLD,
    name: "Midnight Gold",
    description: "Elegancia nocturna con dorados",
    colors: {
      background: "#0a0a0f",
      foreground: "#e8e6e3",
      primary: "#d4af37", // Gold
      secondary: "#1a1a24",
      accent: "#c9a227",
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

/**
 * Validates a theme ID and returns CLASSIC if invalid.
 * Use this when reading from DB where old/deleted theme IDs may exist.
 */
export function getValidThemeId(id: string | null | undefined): ThemeId {
  if (!id) return THEME_IDS.CLASSIC;
  if (id === THEME_IDS.CUSTOM) return THEME_IDS.CUSTOM;
  if (isPredefinedTheme(id)) return id;
  return THEME_IDS.CLASSIC;
}
