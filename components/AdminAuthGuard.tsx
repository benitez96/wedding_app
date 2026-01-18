"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentAdmin } from "@/app/actions/admin";
import LoadingSpinner from "./LoadingSpinner";

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let isActive = true;

    const checkAuth = async () => {
      try {
        const result = await getCurrentAdmin();

        if (result.success && result.user) {
          if (isActive) {
            setIsAuthenticated(true);
          }
        } else {
          // Usuario no autenticado, redirigir a login
          router.replace("/backoffice/login");
          return;
        }
      } catch (error) {
        console.error("Error al verificar autenticación de admin:", error);
        router.replace("/backoffice/login");
        return;
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isActive = false;
    };
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // No renderizar nada mientras se redirige
  }

  return <>{children}</>;
}
