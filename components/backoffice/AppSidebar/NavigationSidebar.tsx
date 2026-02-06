"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Users,
  Layout,
  Settings,
  LogOut,
  Palette,
  UserPlus,
} from "lucide-react";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import clsx from "clsx";
import { useSidebar } from "./SidebarContext";
import type { MenuItem } from "./types";
import { authClient } from "@/lib/auth-client";
import TierBadge from "@/components/backoffice/TierBadge";

const MENU_ITEMS: MenuItem[] = [
  {
    label: "Dashboard",
    href: "/backoffice/dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: "Invitaciones",
    href: "/backoffice/invitations",
    icon: <Users className="w-5 h-5" />,
  },
  {
    label: "Estructura",
    href: "/backoffice/estructura",
    icon: <Layout className="w-5 h-5" />,
  },
  {
    label: "Theming",
    href: "/backoffice/theming",
    icon: <Palette className="w-5 h-5" />,
  },
  {
    label: "Configuraciones",
    href: "/backoffice/settings",
    icon: <Settings className="w-5 h-5" />,
  },
  {
    label: "Miembros",
    href: "/backoffice/collaborators",
    icon: <UserPlus className="w-5 h-5" />,
    tierRequired: "COMPANY",
  },
];

export default function NavigationSidebar() {
  const { isExpanded, toggleSidebar, events, activeEventId, tier } =
    useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const visibleItems = MENU_ITEMS.filter((item) => {
    if (!item.tierRequired) return true;
    // COMPANY items only for COMPANY tier
    if (item.tierRequired === "COMPANY") return tier === "COMPANY";
    return true;
  });

  const activeEvent = events.find((e) => e.id === activeEventId);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await authClient.signOut();
      router.replace("/backoffice/login");
      router.refresh();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      router.replace("/backoffice/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <motion.aside
      className={clsx(
        "fixed left-[72px] top-0 h-screen bg-content2 border-r border-divider z-30 flex flex-col overflow-hidden",
      )}
      initial={false}
      animate={{
        width: isExpanded ? 256 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
    >
      {/* Header con nombre del evento y botón contraer */}
      <div className="flex items-center justify-between p-4 min-h-[64px]">
        <div className="flex-1 min-w-0">
          {activeEvent ? (
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-semibold text-foreground truncate">
                {activeEvent.name}
              </h2>
              <TierBadge tier={tier} />
            </div>
          ) : (
            <p className="text-sm text-default-500">Sin evento seleccionado</p>
          )}
        </div>
        <Button
          isIconOnly
          variant="light"
          size="sm"
          onPress={toggleSidebar}
          className="shrink-0 ml-2"
          aria-label="Contraer menú"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>

      <Divider />

      {/* Navigation Menu */}
      <nav
        className="flex-1 overflow-y-auto py-4 px-3"
        aria-label="Menú principal"
      >
        <div className="flex flex-col gap-1">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-primary",
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-default-600 hover:bg-default-100",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <Divider />

      {/* Logout Button */}
      <div className="p-3">
        <Button
          color="danger"
          variant="flat"
          fullWidth
          startContent={<LogOut className="w-4 h-4" />}
          onClick={handleLogout}
          isLoading={isLoggingOut}
          isDisabled={isLoggingOut}
          className="justify-start"
        >
          Cerrar Sesión
        </Button>
      </div>

      {/* Expand button cuando está contraído */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.button
            onClick={toggleSidebar}
            className="fixed left-[72px] top-4 w-6 h-10 bg-content2 border border-divider rounded-r-lg flex items-center justify-center hover:bg-content3 transition-colors z-40"
            aria-label="Expandir menú"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ delay: 0.2 }}
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
