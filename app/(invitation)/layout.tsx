import { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { siteConfig } from "@/config/site";
import { getCurrentUser } from "@/app/actions/invitations";
import { getEventTheme } from "@/app/actions/theme";
import { THEME_IDS, type ThemeId } from "@/types/theme";
import { ThemeSync } from "@/components/providers/ThemeSync";

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

// Force dynamic rendering to read JWT from cookies
export const dynamic = "force-dynamic";

export default async function InvitationLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Obtener theme del evento de la invitación (JWT)
  let themeId: ThemeId = THEME_IDS.CLASSIC;

  try {
    const userResult = await getCurrentUser();
    if (userResult.success && userResult.user?.eventId) {
      themeId = await getEventTheme(userResult.user.eventId);
    }
  } catch {
    // Theme fetch failed, using default
  }

  return (
    <>
      <ThemeSync themeId={themeId} />
      <main className="container mx-auto max-w-screen-sm">{children}</main>
    </>
  );
}
