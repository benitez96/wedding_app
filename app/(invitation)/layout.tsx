import { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { siteConfig } from "@/config/site";
import { getCurrentUser } from "@/app/actions/invitations";
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
      {/* Inject custom theme CSS vars into <head> before first paint */}
      <ThemeStyleTag
        themeId={themeData.themeId}
        customColors={themeData.customColors}
      />
      {/* Sync class on <html> for HeroUI (predefined themes) and client-side navigation */}
      <ThemeSync themeId={themeData.themeId} />
      {/* Wrapper full-screen con mask del corazón — revela el contenido */}
      <div id="invitation-content-mask">
        <main className="container mx-auto max-w-screen-sm">{children}</main>
      </div>
    </>
  );
}
