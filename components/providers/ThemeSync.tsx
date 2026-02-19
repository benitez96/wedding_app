"use client";

import { useEffect } from "react";

interface ThemeSyncProps {
  themeId: string;
}

/**
 * Client Component — keeps the theme class on <html> in sync.
 *
 * Single responsibility: add/remove the active theme class (classic/warm/etc.)
 * on document.documentElement so HeroUI resolves the correct CSS variable set.
 *
 * CSS variable values for the custom theme are injected by ThemeStyleTag
 * (a Server Component) directly into <head> before the first paint — no flash.
 *
 * ThemeSync is only needed to handle client-side theme switches (e.g. when
 * the user changes the theme in the backoffice and router.refresh() fires).
 */
export function ThemeSync({ themeId }: ThemeSyncProps) {
  useEffect(() => {
    const html = document.documentElement;

    // Replace ALL classes on <html> with just the active theme class.
    // We remove "light" intentionally — HeroUI emits `.light { --heroui-background: ... }`
    // which would override our custom theme variables if both classes coexist.
    // Our predefined themes (classic, warm, pastel-green) and the custom theme
    // each define their own complete variable set, so "light" is not needed.
    html.className = themeId ?? "";
  }, [themeId]);

  return null;
}
