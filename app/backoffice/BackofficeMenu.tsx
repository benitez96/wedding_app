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
  X,
  LogOut,
  Palette,
} from "lucide-react";
import clsx from "clsx";
import { logoutAdmin } from "@/app/actions/admin";

interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
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
];

export default function BackofficeMenu() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const result = await logoutAdmin();

      if (!result.success) {
        console.error("Error al cerrar sesión:", result.error);
      }

      // Redirigir a la página de login
      router.replace("/backoffice/login");
      router.refresh();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      // Aún así redirigir al login
      router.replace("/backoffice/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

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
            <h2 className="text-lg font-semibold">Menú</h2>
          </DrawerHeader>
          <DrawerBody>
            <nav className="flex flex-col gap-2">
              {MENU_ITEMS.map((item) => {
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
    </>
  );
}
