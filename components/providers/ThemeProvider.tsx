"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import type { ThemeId } from "@/types/theme";

interface ThemeProviderProps {
  children: ReactNode;
  themeId: ThemeId;
}

/**
 * Provider that applies the selected theme via the class attribute on <html>.
 *
 * NOTE: This provider is superseded by ThemeSync + ThemeStyleTag.
 * It is kept for backward compatibility with existing tests.
 * Colors are defined in tailwind.config.js.
 * No useMemo/useCallback — React Compiler handles optimization.
 */
export function ThemeProvider({ children, themeId }: ThemeProviderProps) {
  useEffect(() => {
    // Apply theme by setting the class on <html>
    document.documentElement.setAttribute("class", themeId);
  }, [themeId]);

  return <>{children}</>;
}
