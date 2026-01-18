"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logoutAdmin } from "@/app/actions/admin";
import { Button } from "@heroui/react";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoading(true);

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
      setIsLoading(false);
    }
  };

  return (
    <Button
      color="danger"
      variant="light"
      size="sm"
      startContent={<LogOut className="w-4 h-4" />}
      onClick={handleLogout}
      isLoading={isLoading}
      isDisabled={isLoading}
      className="min-w-0"
    >
      <span className="hidden sm:inline">Cerrar Sesión</span>
    </Button>
  );
}
