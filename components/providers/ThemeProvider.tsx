"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import type { ThemeId } from "@/types/theme";

interface ThemeProviderProps {
  children: ReactNode;
  themeId: ThemeId;
}

/**
 * Provider que aplica el theme seleccionado mediante data-theme attribute
 *
 * IMPORTANTE: Este provider simplemente cambia el atributo data-theme
 * Los colores están definidos en tailwind.config.js
 * No usar useMemo/useCallback - React Compiler optimiza automáticamente
 */
export function ThemeProvider({ children, themeId }: ThemeProviderProps) {
  useEffect(() => {
    // Aplicar el theme mediante el data-theme attribute
    document.documentElement.setAttribute("class", themeId);
  }, [themeId]);

  return <>{children}</>;
}
