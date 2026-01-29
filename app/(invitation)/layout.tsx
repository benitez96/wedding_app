import { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { siteConfig } from "@/config/site";

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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
  ],
};

export default function InvitationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="container mx-auto max-w-screen-sm">
      {children}
    </main>
  );
}
