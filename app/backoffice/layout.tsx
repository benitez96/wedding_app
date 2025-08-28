import "@/styles/globals.css";
import { Metadata, Viewport } from "next";

import { siteConfig } from "@/config/site";
import { Navbar, NavbarBrand, NavbarContent } from '@heroui/react'
import { Heart } from 'lucide-react'
import LogoutButton from './LogoutButton'
import Link from "next/link";

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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
  ],
};

export default function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar className="bg-white shadow-sm border-b">
        <NavbarBrand>
          <div className="flex items-center gap-2">
            <Heart className="text-red-500" size={24} />
            <span className="font-bold text-xl">Wedding App</span>
          </div>
        </NavbarBrand>
        <NavbarContent justify="end">
          <div className="flex items-center gap-4">
            <Link href="/backoffice/dashboard" className="text-sm text-gray-500">Panel de Administración</Link>
            <LogoutButton />
          </div>
        </NavbarContent>
      </Navbar>

      {/* Main Content */}
      <main className="container mx-auto max-w-screen-xl px-4 py-6">
        {children}
      </main>
    </div>
  );
}