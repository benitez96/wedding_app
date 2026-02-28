import { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { siteConfig } from "@/config/site";
import { getCurrentUser } from "@/app/actions/invitations/";
import { getEventTheme } from "@/app/actions/theme";
import { THEME_IDS } from "@/types/theme";
import type { EventThemeData } from "@/app/actions/theme";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "white" }],
};

export const dynamic = "force-dynamic";

export default async function InvitationLayout({
  children,
}: {
  children: ReactNode;
}) {
  let themeData: EventThemeData = {
    themeId: THEME_IDS.CLASSIC,
    customColors: null,
  };

  try {
    const userResult = await getCurrentUser();
    if (userResult.success && userResult.user?.eventId) {
      themeData = await getEventTheme(userResult.user.eventId);
    }
  } catch {
    // Theme fetch failed, using default
  }

  return (
    <>
      <ThemeProvider
        themeId={themeData.themeId}
        customColors={themeData.customColors}
      />
      <div id="invitation-content-mask">
        <main className="container mx-auto max-w-screen-sm">{children}</main>
      </div>
    </>
  );
}
