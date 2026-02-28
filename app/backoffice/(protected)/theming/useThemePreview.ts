"use client";

import { useEffect } from "react";
import { buildCustomThemeCss, getThemeClass } from "@/lib/theme-utils";
import { THEME_IDS, type ThemeId, type CustomThemeColors } from "@/types/theme";

const PREVIEW_STYLE_ID = "theme-preview-style";

/**
 * Hook for live preview when editing custom theme colors.
 * Updates <html> class and injects CSS in real-time as user edits.
 */
export function useThemePreview(
  selectedTheme: ThemeId,
  customColors: CustomThemeColors,
) {
  useEffect(() => {
    // Only inject preview when custom theme is selected
    if (selectedTheme !== THEME_IDS.CUSTOM) {
      document.getElementById(PREVIEW_STYLE_ID)?.remove();
      return;
    }

    // Set class on <html>
    document.documentElement.className = getThemeClass(
      selectedTheme,
      customColors,
    );

    // Inject/update CSS
    let styleTag = document.getElementById(
      PREVIEW_STYLE_ID,
    ) as HTMLStyleElement | null;

    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = PREVIEW_STYLE_ID;
      document.head.appendChild(styleTag);
    }

    styleTag.textContent = buildCustomThemeCss(customColors);

    return () => {
      document.getElementById(PREVIEW_STYLE_ID)?.remove();
    };
  }, [selectedTheme, customColors]);
}
