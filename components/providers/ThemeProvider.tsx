"use client";

import { useEffect } from "react";
import { buildCustomThemeCss, getThemeClass } from "@/lib/theme-utils";
import { THEME_IDS, type ThemeId, type CustomThemeColors } from "@/types/theme";

interface ThemeProviderProps {
  themeId: ThemeId;
  customColors?: CustomThemeColors | null;
  children?: React.ReactNode;
}

/**
 * Single component that handles all theme setup:
 * 1. Injects CSS variables for custom themes (via <style> tag)
 * 2. Sets the correct class on <html> (theme class + dark/light for custom)
 *
 * For predefined themes: just sets the class (CSS comes from HeroUI build).
 * For custom themes: injects CSS + sets "dark custom" or "light custom" class.
 */
export function ThemeProvider({
  themeId,
  customColors = null,
  children,
}: ThemeProviderProps) {
  const isCustom = themeId === THEME_IDS.CUSTOM && customColors !== null;
  const css = isCustom ? buildCustomThemeCss(customColors) : null;
  const themeClass = getThemeClass(themeId, customColors);

  // Sync class on <html>
  useEffect(() => {
    document.documentElement.className = themeClass;
  }, [themeClass]);

  return (
    <>
      {css && (
        <style dangerouslySetInnerHTML={{ __html: css }} data-theme="custom" />
      )}
      {children}
    </>
  );
}
