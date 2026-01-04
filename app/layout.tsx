import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontSans, fontDecorative } from "@/config/fonts";
import { ARGENTINA_TIMEZONE } from "@/config/timezone";

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
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
            {children}
        </Providers>
      </body>
    </html>
  );
}
