import "@/styles/globals.css";
import { Metadata, Viewport } from "next";

import { siteConfig } from "@/config/site";
import { Navbar, NavbarBrand, NavbarContent, Button, User } from '@heroui/react'
import { Heart, LogOut } from 'lucide-react'
import AdminAuthGuard from '@/components/AdminAuthGuard'
import LogoutButton from './LogoutButton'

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
            <span className="text-sm text-gray-500">Panel de Administración</span>
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