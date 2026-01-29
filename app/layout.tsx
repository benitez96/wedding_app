import "@/styles/globals.css";
import type { ReactNode } from "react";
import { Metadata, Viewport } from "next";
import clsx from "clsx";
import { headers } from "next/headers";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontSans, fontDecorative } from "@/config/fonts";
import { ARGENTINA_TIMEZONE } from "@/config/timezone";
import { THEME_IDS } from "@/types/theme";
import { auth } from "@/lib/auth";
import { getUserEventContext } from "@/lib/event-context";
import { getCurrentUser } from "@/app/actions/invitations";
import { getEventTheme } from "@/app/actions/theme";

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
  // Obtener el theme dinámicamente según el contexto (backoffice o invitación)
  let activeThemeId = THEME_IDS.CLASSIC;

  try {
    // Intentar primero con sesión de backoffice (Better Auth)
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (session?.user?.id) {
      // Usuario logueado en backoffice
      const eventContext = await getUserEventContext(session.user.id);
      if (eventContext?.eventId) {
        activeThemeId = await getEventTheme(eventContext.eventId);
        console.log("[RootLayout - Backoffice] EventId:", eventContext.eventId, "Theme:", activeThemeId);
      }
    } else {
      // Usuario de invitación (JWT)
      const userResult = await getCurrentUser();
      if (userResult.success && userResult.user?.eventId) {
        activeThemeId = await getEventTheme(userResult.user.eventId);
        console.log("[RootLayout - Invitation] EventId:", userResult.user.eventId, "Theme:", activeThemeId);
      }
    }
  } catch (error) {
    console.log("[RootLayout] Error getting theme:", error);
  }

  return (
    <html
      suppressHydrationWarning
      lang="es"
      data-timezone={ARGENTINA_TIMEZONE}
      className={clsx("light", activeThemeId)}
    >
      <head />
      <body
        className={clsx(
          "min-h-[100dvh] text-foreground bg-background font-sans antialiased",
          fontSans.variable,
          fontDecorative.variable,
        )}
        data-timezone={ARGENTINA_TIMEZONE}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "light" }}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
