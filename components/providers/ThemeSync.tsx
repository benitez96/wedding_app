"use client";

import { useEffect } from "react";

interface ThemeSyncProps {
  themeId: string;
}

/**
 * Synchronizes the active theme ID with the HTML element className.
 * This ensures theme updates when switching events in the backoffice.
 */
export function ThemeSync({ themeId }: ThemeSyncProps) {
  useEffect(() => {
    const html = document.documentElement;

    // Remove all existing theme classes
    const currentClasses = Array.from(html.classList);
    const themeClasses = currentClasses.filter((cls) =>
      cls !== "light" && cls !== "dark"
    );

    themeClasses.forEach((cls) => html.classList.remove(cls));

    // Add the new theme class
    if (themeId) {
      html.classList.add(themeId);
    }
  }, [themeId]);

  return null;
}
