import { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";

import ServiceWorkerRegistration from "./components/ServiceWorkerRegistration";
import { siteConfig } from "@/config/site";
import { auth } from "@/lib/auth";
import { getUserEventContext } from "@/lib/event-context-prisma";
import { getEventTheme } from "@/app/actions/theme";
import { THEME_IDS } from "@/types/theme";
import type { EventThemeData } from "@/app/actions/theme";
import { ThemeSync } from "@/components/providers/ThemeSync";
import ThemeStyleTag from "@/components/providers/ThemeStyleTag";

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
  let themeData: EventThemeData = {
    themeId: THEME_IDS.CLASSIC,
    customColors: null,
  };

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (session?.user?.id) {
      const eventContext = await getUserEventContext(session.user.id);
      if (eventContext?.eventId) {
        themeData = await getEventTheme(eventContext.eventId);
      }
    }
  } catch {
    // Theme fetch failed, using default
  }

  return (
    <>
      <ServiceWorkerRegistration />
      <ThemeStyleTag
        themeId={themeData.themeId}
        customColors={themeData.customColors}
      />
      <ThemeSync themeId={themeData.themeId} />
      {children}
    </>
  );
}
