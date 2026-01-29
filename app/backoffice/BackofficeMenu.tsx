"use client";

import { useState } from "react";
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
  icon: React.ReactNode;
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

              <nav className="flex flex-col gap-2">
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={clsx(
                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-gray-700 hover:bg-gray-100",
                      )}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
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
