import type { CustomThemeColors } from "@/types/theme";

// ============================================================================
// Color Conversion Utilities
// ============================================================================

/**
 * Parses a hex color (#RRGGBB) into HSL components.
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / delta + 2) / 6;
        break;
      case b:
        h = ((r - g) / delta + 4) / 6;
        break;
    }
  }

  return {
    h: +(h * 360).toFixed(2),
    s: +(s * 100).toFixed(2),
    l: +(l * 100).toFixed(2),
  };
}

/**
 * Converts hex to "H S% L%" format for HeroUI CSS variables.
 */
export function hexToHslComponents(hex: string): string {
  const { h, s, l } = hexToHsl(hex);
  return `${h} ${s}% ${l}%`;
}

/**
 * Returns "#000000" or "#ffffff" based on WCAG contrast.
 */
export function getContrastForeground(hex: string): "#000000" | "#ffffff" {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const lum =
    0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

  return lum > 0.179 ? "#000000" : "#ffffff";
}

/**
 * Returns true if background is dark (needs light text).
 */
export function isDarkBackground(hex: string): boolean {
  return getContrastForeground(hex) === "#ffffff";
}

// ============================================================================
// CSS Generation
// ============================================================================

/**
 * Builds CSS variables for custom theme.
 * Only overrides what the user controls - lets HeroUI base theme handle the rest.
 */
export function buildCustomThemeCss(colors: CustomThemeColors): string {
  const isDark = isDarkBackground(colors.background);
  const colorScheme = isDark ? "dark" : "light";

  const primaryFg = getContrastForeground(colors.primary);
  const secondaryFg = getContrastForeground(colors.secondary);

  const declarations = [
    `--heroui-background:${hexToHslComponents(colors.background)}`,
    `--heroui-foreground:${hexToHslComponents(colors.foreground)}`,
    `--heroui-primary:${hexToHslComponents(colors.primary)}`,
    `--heroui-primary-foreground:${hexToHslComponents(primaryFg)}`,
    `--heroui-secondary:${hexToHslComponents(colors.secondary)}`,
    `--heroui-secondary-foreground:${hexToHslComponents(secondaryFg)}`,
    `--heroui-focus:${hexToHslComponents(colors.primary)}`,
    `--color-background:${colors.background}`,
    `--color-secondary:${colors.secondary}`,
    `--color-accent:${colors.accent}`,
  ];

  return `.custom{color-scheme:${colorScheme};${declarations.join(";")}}`;
}

/**
 * Returns the class string for <html> based on theme.
 */
export function getThemeClass(
  themeId: string,
  customColors?: CustomThemeColors | null,
): string {
  if (themeId === "custom" && customColors) {
    const baseClass = isDarkBackground(customColors.background)
      ? "dark"
      : "light";
    return `${baseClass} custom`;
  }
  return themeId;
}
