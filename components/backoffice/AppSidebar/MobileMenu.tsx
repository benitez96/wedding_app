"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, Plus } from "lucide-react";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import clsx from "clsx";
import { useDisclosure } from "@heroui/use-disclosure";
import { useSidebar } from "./SidebarContext";
import EventAvatar from "./EventAvatar";
import { authClient } from "@/lib/auth-client";
import TierBadge from "@/components/backoffice/TierBadge";
import CreateEventModal from "@/components/backoffice/CreateEventModal";
import { switchActiveEvent } from "@/app/actions/events";
import { Logo } from "@/components/Logo";
import { BACKOFFICE_MENU_ITEMS } from "@/config/backoffice-menu";
import { logError } from "@/lib/logger";

export default function MobileMenu() {
  const { events, activeEventId, tier } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [switchingEventId, setSwitchingEventId] = useState<string | null>(null);
  const createEventModal = useDisclosure();

  const visibleItems = BACKOFFICE_MENU_ITEMS.filter((item) => {
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
        logError(
          "Error switching event",
          new Error(result.error || "Unknown error"),
        );
      }
    } catch (error) {
      logError("Error switching event", error);
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
      logError("Error al cerrar sesión", error);
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
        <div className="flex items-center gap-2 bg-black rounded-lg px-2.5 py-1">
          <Logo className="size-5 text-white" />
          {/* TODO i18n: app name */}
          <span className="font-bold text-white text-lg">Invify</span>
        </div>

        <Button
          isIconOnly
          variant="light"
          onPress={() => setIsOpen(!isOpen)}
          // TODO i18n: aria-label
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
                    // TODO i18n: "Sin evento seleccionado"
                    <p className="text-sm text-default-500">
                      Sin evento seleccionado
                    </p>
                  )}
                </div>

                <Divider />

                {/* Events List */}
                {isCompany && events.length > 0 && (
                  <>
                    <div className="p-4">
                      <h3 className="text-xs font-semibold text-default-500 uppercase mb-3">
                        {/* TODO i18n: "Eventos" */}
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
                          // TODO i18n: aria-label
                          aria-label="Crear nuevo evento"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <Divider />
                  </>
                )}

                {/* Navigation Menu */}
                <nav
                  className="flex-1 p-4"
                  // TODO i18n: aria-label
                  aria-label="Menú principal"
                >
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
                    {/* TODO i18n: "Cerrar Sesión" */}
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
