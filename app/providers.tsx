"use client";

import type { ThemeProviderProps } from "next-themes";

import type { ReactNode } from "react";
import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import type { ThemeId } from "@/types/theme";

export interface ProvidersProps {
  children: ReactNode;
  themeProps?: ThemeProviderProps;
  activeThemeId?: ThemeId;
}

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

export function Providers({
  children,
  themeProps,
  activeThemeId = "classic",
}: ProvidersProps) {
  const router = useRouter();

  return (
    <HeroUIProvider navigate={router.push}>
      <NextThemesProvider {...themeProps}>
        <ThemeProvider themeId={activeThemeId}>{children}</ThemeProvider>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}
