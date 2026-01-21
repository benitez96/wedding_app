// Theme IDs (siguiendo la regla: const object + type derivado)
export const THEME_IDS = {
  CLASSIC: "classic",
  WARM: "warm",
  PASTEL_GREEN: "pastel-green",
} as const;

export type ThemeId = (typeof THEME_IDS)[keyof typeof THEME_IDS];

// Definición de colores de un theme
export interface ThemeColors {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  warm: string;
  warmForeground: string;
  background: string;
  foreground: string;
}

// Definición completa de un theme
export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  colors: ThemeColors;
}

// Themes disponibles
export const THEMES: Record<ThemeId, Theme> = {
  [THEME_IDS.CLASSIC]: {
    id: THEME_IDS.CLASSIC,
    name: "Clásico",
    description: "Blanco, negro y grises elegantes",
    colors: {
      primary: "#000000", // Negro
      primaryForeground: "#FFFFFF", // Blanco
      secondary: "#2C2C2C", // Gris oscuro
      secondaryForeground: "#FFFFFF", // Blanco
      accent: "#4A4A4A", // Gris medio
      accentForeground: "#FFFFFF", // Blanco
      warm: "#6B6B6B", // Gris claro
      warmForeground: "#FFFFFF", // Blanco
      background: "#FFFFFF", // Blanco
      foreground: "#000000", // Negro
    },
  },
  [THEME_IDS.WARM]: {
    id: THEME_IDS.WARM,
    name: "Cálido",
    description: "Marrón dorado elegante",
    colors: {
      primary: "#8B5A3C",
      primaryForeground: "#FFFFFF",
      secondary: "#B89A7A",
      secondaryForeground: "#FFFFFF",
      accent: "#D4AF37",
      accentForeground: "#000000",
      warm: "#E8B4A0",
      warmForeground: "#000000",
      background: "#FFFFFF",
      foreground: "#1A1A1A",
    },
  },
  [THEME_IDS.PASTEL_GREEN]: {
    id: THEME_IDS.PASTEL_GREEN,
    name: "Verde Pastel",
    description: "Verde menta suave y elegante",
    colors: {
      primary: "#7FB069",
      primaryForeground: "#FFFFFF",
      secondary: "#A8DADC",
      secondaryForeground: "#1D3557",
      accent: "#98C1A3",
      accentForeground: "#1D3557",
      warm: "#C5E1A5",
      warmForeground: "#2E7D32",
      background: "#F1FAEE",
      foreground: "#1D3557",
    },
  },
} as const;

// Helper para obtener theme por ID
export function getThemeById(id: ThemeId): Theme {
  return THEMES[id];
}

// Array de themes para UI (RadioGroup)
export const THEME_LIST = Object.values(THEMES);
