"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { getThemeById, type ThemeId } from "@/types/theme";

interface ThemeProviderProps {
  children: ReactNode;
  themeId: ThemeId;
}

/**
 * Provider que aplica CSS variables dinámicamente basado en el theme seleccionado
 *
 * IMPORTANTE: Este provider aplica las variables CSS en el :root
 * No usar useMemo/useCallback - React Compiler optimiza automáticamente
 */
export function ThemeProvider({ children, themeId }: ThemeProviderProps) {
  useEffect(() => {
    // Obtener el theme y aplicar CSS variables
    const theme = getThemeById(themeId);
    const root = document.documentElement;

    // Aplicar colores como CSS variables
    root.style.setProperty("--color-primary", theme.colors.primary);
    root.style.setProperty(
      "--color-primary-foreground",
      theme.colors.primaryForeground,
    );
    root.style.setProperty("--color-secondary", theme.colors.secondary);
    root.style.setProperty(
      "--color-secondary-foreground",
      theme.colors.secondaryForeground,
    );
    root.style.setProperty("--color-accent", theme.colors.accent);
    root.style.setProperty(
      "--color-accent-foreground",
      theme.colors.accentForeground,
    );
    root.style.setProperty("--color-warm", theme.colors.warm);
    root.style.setProperty(
      "--color-warm-foreground",
      theme.colors.warmForeground,
    );
    root.style.setProperty("--color-background", theme.colors.background);
    root.style.setProperty("--color-foreground", theme.colors.foreground);

    // Actualizar también el data-theme attribute para HeroUI
    root.setAttribute("data-theme", themeId);
  }, [themeId]);

  return <>{children}</>;
}
