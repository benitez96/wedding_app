"use client";

import type { ReactNode, KeyboardEvent } from "react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
} from "@heroui/drawer";
import { Button } from "@heroui/button";
import { useDisclosure } from "@heroui/use-disclosure";
import { Divider } from "@heroui/divider";
import {
  Menu,
  LayoutDashboard,
  Users,
  Layout,
  Settings,
  LogOut,
  Palette,
  UserPlus,
  CalendarDays,
} from "lucide-react";
import clsx from "clsx";
import { authClient } from "@/lib/auth-client";
import type { SubscriptionTier } from "@/types/subscription";
import TierBadge from "@/components/backoffice/TierBadge";
import EventListSelector from "@/components/backoffice/EventListSelector";
import CreateEventModal from "@/components/backoffice/CreateEventModal";

interface MenuItem {
  label: string;
  href: string;
  icon: ReactNode;
  tierRequired?: SubscriptionTier;
}

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

interface EventOption {
  id: string;
  name: string;
  isOwner: boolean;
}

interface BackofficeMenuProps {
  tier?: SubscriptionTier;
  events?: EventOption[];
  activeEventId?: string;
}

export default function BackofficeMenu({
  tier = "FREE",
  events = [],
  activeEventId = "",
}: BackofficeMenuProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const createEventModal = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const menuItemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

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

  const visibleItems = MENU_ITEMS.filter((item) => {
    if (!item.tierRequired) return true;
    // COMPANY items only for COMPANY tier
    if (item.tierRequired === "COMPANY") return tier === "COMPANY";
    return true;
  });

  const isCompany = tier === "COMPANY";

  // Keyboard navigation handler
  const handleKeyDown = (event: KeyboardEvent) => {
    const itemCount = visibleItems.length;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((prev) => {
          const next = prev < itemCount - 1 ? prev + 1 : 0;
          menuItemRefs.current[next]?.focus();
          return next;
        });
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((prev) => {
          const next = prev > 0 ? prev - 1 : itemCount - 1;
          menuItemRefs.current[next]?.focus();
          return next;
        });
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        menuItemRefs.current[0]?.focus();
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(itemCount - 1);
        menuItemRefs.current[itemCount - 1]?.focus();
        break;
      case "Escape":
        event.preventDefault();
        onClose();
        break;
    }
  };

  // Focus first item when drawer opens
  useEffect(() => {
    if (isOpen && visibleItems.length > 0) {
      // Small delay to ensure drawer is fully rendered
      const timer = setTimeout(() => {
        setActiveIndex(0);
        menuItemRefs.current[0]?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, visibleItems.length]);

  return (
    <>
      {/* Botón del menú */}
      <Button
        isIconOnly
        variant="light"
        onPress={onOpen}
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Drawer */}
      <Drawer isOpen={isOpen} onClose={onClose} placement="left">
        <DrawerContent>
          <DrawerHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Menú</h2>
              <TierBadge tier={tier} />
            </div>
          </DrawerHeader>
          <DrawerBody>
            <div className="flex flex-col gap-4">
              {/* Event List Selector for COMPANY tier */}
              {isCompany && (
                <>
                  <EventListSelector
                    events={events}
                    activeEventId={activeEventId || null}
                    onCreateEvent={createEventModal.onOpen}
                  />
                  <Divider />
                </>
              )}

              {/* Event name for non-COMPANY tiers */}
              {!isCompany && events.length > 0 && (
                <>
                  <div className="px-4 py-1 text-sm text-default-500">
                    {events[0]?.name}
                  </div>
                  <Divider />
                </>
              )}

              <div
                className="flex flex-col gap-2"
                role="menu"
                aria-label="Menú de navegación"
                onKeyDown={handleKeyDown}
              >
                {visibleItems.map((item, index) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      ref={(el) => {
                        menuItemRefs.current[index] = el;
                      }}
                      role="menuitem"
                      tabIndex={index === activeIndex ? 0 : -1}
                      aria-current={isActive ? "page" : undefined}
                      className={clsx(
                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary",
                        isActive
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-foreground/70 hover:bg-content2",
                      )}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onClose();
                          router.push(item.href);
                        }
                      }}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </DrawerBody>
          <DrawerFooter className="flex flex-col gap-2">
            <Divider />
            <Button
              color="danger"
              variant="flat"
              fullWidth
              startContent={<LogOut className="w-4 h-4" />}
              onClick={handleLogout}
              isLoading={isLoggingOut}
              isDisabled={isLoggingOut}
            >
              Cerrar Sesión
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={createEventModal.isOpen}
        onClose={createEventModal.onClose}
      />
    </>
  );
}
