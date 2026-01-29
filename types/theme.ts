// Theme IDs (siguiendo la regla: const object + type derivado)
export const THEME_IDS = {
  CLASSIC: "classic",
  WARM: "warm",
  PASTEL_GREEN: "pastel-green",
} as const;

export type ThemeId = (typeof THEME_IDS)[keyof typeof THEME_IDS];

// Colores básicos para preview UI
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  warm: string;
}

// Definición de un theme (metadata + colores para preview)
export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  colors: ThemeColors;
}

// Themes disponibles (metadata + colores para UI preview)
// Los colores completos están en tailwind.config.js
export const THEMES: Record<ThemeId, Theme> = {
  [THEME_IDS.CLASSIC]: {
    id: THEME_IDS.CLASSIC,
    name: "Clásico",
    description: "Blanco, negro y grises elegantes",
    colors: {
      primary: "#000000",
      secondary: "#2C2C2C",
      accent: "#4A4A4A",
      warm: "#6B6B6B",
    },
  },
  [THEME_IDS.WARM]: {
    id: THEME_IDS.WARM,
    name: "Cálido",
    description: "Marrón dorado elegante",
    colors: {
      primary: "#8B5A3C",
      secondary: "#B89A7A",
      accent: "#D4AF37",
      warm: "#E8B4A0",
    },
  },
  [THEME_IDS.PASTEL_GREEN]: {
    id: THEME_IDS.PASTEL_GREEN,
    name: "Verde Pastel",
    description: "Verde menta suave y elegante",
    colors: {
      primary: "#7FB069",
      secondary: "#A8DADC",
      accent: "#98C1A3",
      warm: "#C5E1A5",
    },
  },
} as const;

// Helper para obtener theme por ID
export function getThemeById(id: ThemeId): Theme {
  return THEMES[id];
}

// Array de themes para UI (RadioGroup)
export const THEME_LIST = Object.values(THEMES);
