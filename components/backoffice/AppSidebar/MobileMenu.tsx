"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  Layout as LayoutIcon,
  Settings,
  LogOut,
  Palette,
  UserPlus,
  Heart,
} from "lucide-react";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import clsx from "clsx";
import { useSidebar } from "./SidebarContext";
import type { MenuItem } from "./types";
import { authClient } from "@/lib/auth-client";
import TierBadge from "@/components/backoffice/TierBadge";
import EventAvatar from "./EventAvatar";
import { useDisclosure } from "@heroui/use-disclosure";
import CreateEventModal from "@/components/backoffice/CreateEventModal";
import { switchActiveEvent } from "@/app/actions/events";

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
    icon: <LayoutIcon className="w-5 h-5" />,
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

export default function MobileMenu() {
  const { events, activeEventId, tier } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [switchingEventId, setSwitchingEventId] = useState<string | null>(null);
  const createEventModal = useDisclosure();

  const visibleItems = MENU_ITEMS.filter((item) => {
    if (!item.tierRequired) return true;
    if (item.tierRequired === "COMPANY") return tier === "COMPANY";
    return true;
  });

  const isCompany = tier === "COMPANY";
  const activeEvent = events.find((e) => e.id === activeEventId);

  const handleEventClick = async (eventId: string) => {
    if (eventId === activeEventId || switchingEventId) return;

    setSwitchingEventId(eventId);
    try {
      const result = await switchActiveEvent(eventId);
      if (result.success) {
        setIsOpen(false);
        router.refresh();
      } else {
        console.error("Error switching event:", result.error);
      }
    } catch (error) {
      console.error("Error switching event:", error);
    } finally {
      setSwitchingEventId(null);
    }
  };

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
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-content1 border-b border-divider flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <Heart className="text-red-500 w-6 h-6" />
          <span className="font-bold text-foreground text-lg">Wedding App</span>
        </div>

        <Button
          isIconOnly
          variant="light"
          onPress={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="lg:hidden fixed inset-0 z-40">
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />

            {/* Drawer Content */}
            <motion.div
              className="absolute top-16 left-0 bottom-0 w-80 max-w-[85vw] bg-content1 overflow-y-auto"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
            >
              <div className="flex flex-col h-full">
                {/* Event Info & Tier */}
                <div className="p-4">
                  {activeEvent ? (
                    <div className="flex flex-col gap-2">
                      <h2 className="text-sm font-semibold text-foreground">
                        {activeEvent.name}
                      </h2>
                      <TierBadge tier={tier} />
                    </div>
                  ) : (
                    <p className="text-sm text-default-500">
                      Sin evento seleccionado
                    </p>
                  )}
                </div>

                <Divider className="bg-slate-700" />

                {/* Events List */}
                {isCompany && events.length > 0 && (
                  <>
                    <div className="p-4">
                      <h3 className="text-xs font-semibold text-default-500 uppercase mb-3">
                        Eventos
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {events.map((event) => (
                          <EventAvatar
                            key={event.id}
                            eventId={event.id}
                            eventName={event.name}
                            isActive={event.id === activeEventId}
                            onClick={() => handleEventClick(event.id)}
                          />
                        ))}
                        <Button
                          isIconOnly
                          variant="flat"
                          color="primary"
                          className="rounded-full w-10 h-10"
                          onPress={() => {
                            setIsOpen(false);
                            createEventModal.onOpen();
                          }}
                          aria-label="Crear nuevo evento"
                        >
                          <UserPlus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <Divider />
                  </>
                )}

                {/* Navigation Menu */}
                <nav className="flex-1 p-4" aria-label="Menú principal">
                  <div className="flex flex-col gap-1">
                    {visibleItems.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={clsx(
                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm",
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
                <div className="p-4">
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
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={createEventModal.isOpen}
        onClose={createEventModal.onClose}
      />
    </>
  );
}
