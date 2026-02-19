import type { CustomThemeColors, ThemeId } from "@/types/theme";
import { THEME_IDS } from "@/types/theme";

/**
 * Converts a hex color (#RRGGBB) to "H S% L%" — the bare HSL components
 * format HeroUI expects in its CSS variables (no hsl() wrapper).
 * This enables Tailwind's opacity modifier syntax: bg-primary/50
 *
 * Pure function — no side effects, easy to unit test.
 */
export function hexToHslComponents(hex: string): string {
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

  return `${+(h * 360).toFixed(2)} ${+(s * 100).toFixed(2)}% ${+(l * 100).toFixed(2)}%`;
}

/**
 * Returns "#000000" or "#ffffff" — whichever has higher WCAG contrast
 * against the given hex background color.
 *
 * Pure function — no side effects, easy to unit test.
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
 * Derives content surface colors from the background.
 * HeroUI uses --heroui-content1..4 for card/sidebar backgrounds.
 * For dark themes: each step is slightly lighter (adds lightness).
 * For light themes: each step is slightly darker (subtracts lightness).
 *
 * Returns bare "H S% L%" components — same format as hexToHslComponents.
 * Pure function — no side effects, easy to unit test.
 */
export function deriveContentLayers(
  bgHsl: string,
  isDark: boolean,
): { content1: string; content2: string; content3: string; content4: string } {
  const parts = bgHsl.split(" ");
  const h = parts[0];
  const s = parts[1];
  const l = parseFloat(parts[2]); // e.g. 97 from "97%"

  // Dark themes: surfaces get progressively lighter (+4% per step)
  // Light themes: surfaces get progressively darker (-3% per step)
  const step = isDark ? 4 : -3;
  const clamp = (v: number) => Math.min(100, Math.max(0, v));

  return {
    content1: `${h} ${s} ${clamp(l + step * 1).toFixed(2)}%`,
    content2: `${h} ${s} ${clamp(l + step * 2).toFixed(2)}%`,
    content3: `${h} ${s} ${clamp(l + step * 3).toFixed(2)}%`,
    content4: `${h} ${s} ${clamp(l + step * 4).toFixed(2)}%`,
  };
}

/**
 * Builds the CSS block that overrides --heroui-* variables for the custom theme.
 *
 * The user controls background, foreground, primary, secondary, and accent.
 * primary-foreground and secondary-foreground are auto-calculated via WCAG contrast
 * so buttons and alternate sections remain readable regardless of the user's choices.
 *
 * Security: all color values are pre-validated by customThemeColorsSchema (Zod)
 * which enforces /^#[0-9A-Fa-f]{6}$/ before they ever reach this function.
 * The output is deterministic hex-derived math — no raw user strings are
 * interpolated into CSS property names or selectors.
 *
 * Pure function — no side effects, easy to unit test.
 */
export function buildCustomThemeCss(colors: CustomThemeColors): string {
  // Auto-calculate foregrounds for primary and secondary to preserve readability
  const primaryFg = getContrastForeground(colors.primary);
  const secondaryFg = getContrastForeground(colors.secondary);

  // Detect whether the background is dark to set color-scheme accordingly.
  // This affects browser-native UI: scrollbars, input backgrounds, autofill, etc.
  const isDarkBg = getContrastForeground(colors.background) === "#ffffff";
  const colorScheme = isDarkBg ? "dark" : "light";

  const bgHsl = hexToHslComponents(colors.background);
  const fgHsl = hexToHslComponents(colors.foreground);

  // Derive content surface layers used by HeroUI components (cards, sidebar, modals)
  const content = deriveContentLayers(bgHsl, isDarkBg);

  // Divider color: white/black at low opacity so it works on any background.
  // Dark themes: white at 15% opacity (same ratio HeroUI uses for its dark theme).
  // Light themes: black at 15% opacity (same ratio HeroUI uses for its light theme).
  const dividerColor = isDarkBg
    ? "rgba(255,255,255,0.15)"
    : "rgba(17,17,17,0.15)";

  const declarations = [
    `--heroui-background:${bgHsl}`,
    `--heroui-foreground:${fgHsl}`,
    `--heroui-primary:${hexToHslComponents(colors.primary)}`,
    `--heroui-primary-foreground:${hexToHslComponents(primaryFg)}`,
    `--heroui-secondary:${hexToHslComponents(colors.secondary)}`,
    `--heroui-secondary-foreground:${hexToHslComponents(secondaryFg)}`,
    // content1..4: card/sidebar/modal surface colors derived from background
    `--heroui-content1:${content.content1}`,
    `--heroui-content2:${content.content2}`,
    `--heroui-content3:${content.content3}`,
    `--heroui-content4:${content.content4}`,
    // content foregrounds — same as main foreground (surfaces use same text color)
    `--heroui-content1-foreground:${fgHsl}`,
    `--heroui-content2-foreground:${fgHsl}`,
    `--heroui-content3-foreground:${fgHsl}`,
    `--heroui-content4-foreground:${fgHsl}`,
    // divider: derived from background luminosity so borders are never black on dark themes
    `--heroui-divider:${dividerColor}`,
    // --color-background: raw CSS color for DecorationLayer SVG pattern fills
    `--color-background:${colors.background}`,
    // --color-secondary: raw CSS color for DecorationLayer secondary fills
    `--color-secondary:${colors.secondary}`,
    // accent is consumed via var(--color-accent) in tailwind.config.js
    `--color-accent:${colors.accent}`,
  ].join(";");

  // :root covers SSR first paint (before ThemeSync runs and sets class="custom").
  // .custom and html.custom cover client-side navigation when the class is present.
  return `:root,.custom,html.custom{color-scheme:${colorScheme};${declarations}}`;
}

interface ThemeStyleTagProps {
  themeId: ThemeId;
  customColors: CustomThemeColors | null;
}

/**
 * Server Component — emits an inline <style> tag in the document <head>
 * with the custom theme CSS variables, computed server-side.
 *
 * This ensures the browser has the correct colors on the VERY FIRST PAINT,
 * before any JavaScript runs. It eliminates the white→custom-color flash
 * that would occur if we relied solely on ThemeSync (useEffect).
 *
 * For predefined themes (classic, warm, pastel-green): renders nothing,
 * because their variables are already in the CSS bundle generated by HeroUI
 * at build time.
 *
 * Security: dangerouslySetInnerHTML is safe here because buildCustomThemeCss
 * only interpolates values that have already passed Zod hex validation
 * (/^#[0-9A-Fa-f]{6}$/). No raw user input is ever embedded in the CSS string.
 */
export default function ThemeStyleTag({
  themeId,
  customColors,
}: ThemeStyleTagProps) {
  if (themeId !== THEME_IDS.CUSTOM || !customColors) {
    return null;
  }

  const css = buildCustomThemeCss(customColors);

  return (
    <style dangerouslySetInnerHTML={{ __html: css }} data-theme="custom" />
  );
}
