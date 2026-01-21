import "@/styles/globals.css";
import type { ReactNode } from "react";
import { Metadata, Viewport } from "next";
import clsx from "clsx";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontSans, fontDecorative } from "@/config/fonts";
import { ARGENTINA_TIMEZONE } from "@/config/timezone";
import { getActiveTheme } from "@/app/actions/theme";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "white" }],
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Cargar theme activo desde la base de datos
  const themeResult = await getActiveTheme();
  const activeThemeId = themeResult.data || "classic";

  return (
    <html suppressHydrationWarning lang="es" data-timezone={ARGENTINA_TIMEZONE}>
      <head />
      <body
        className={clsx(
          "min-h-[100dvh] text-foreground bg-background font-sans antialiased light",
          fontSans.variable,
          fontDecorative.variable,
        )}
        data-timezone={ARGENTINA_TIMEZONE}
      >
        <Providers
          themeProps={{ attribute: "class", defaultTheme: "dark" }}
          activeThemeId={activeThemeId}
        >
          {children}
        </Providers>
      </body>
    </html>
  );
}
