import { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";

import { siteConfig } from "@/config/site";
import { auth } from "@/lib/auth";
import { getUserEventContext } from "@/lib/event-context";
import { getEventTheme } from "@/app/actions/theme";
import { THEME_IDS, type ThemeId } from "@/types/theme";
import { ThemeSync } from "@/components/providers/ThemeSync";
import ServiceWorkerRegistration from "./components/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "white" }],
};

// Force dynamic rendering to read session and cookies
export const dynamic = "force-dynamic";

export default async function BackofficeLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Obtener theme del evento activo del usuario (Better Auth)
  let themeId: ThemeId = THEME_IDS.CLASSIC;

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (session?.user?.id) {
      const eventContext = await getUserEventContext(session.user.id);
      if (eventContext?.eventId) {
        themeId = await getEventTheme(eventContext.eventId);
      }
    }
  } catch {
    // Theme fetch failed, using default
  }

  return (
    <>
      <ServiceWorkerRegistration />
      <ThemeSync themeId={themeId} />
      {children}
    </>
  );
}
