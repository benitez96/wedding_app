"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCurrentUser } from "@/app/actions/invitations";
import { updateTokenAccessMetrics } from "@/app/actions/metrics";
import LoadingSpinner from "./LoadingSpinner";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const result = await getCurrentUser();

        if (result.success && result.user) {
          setIsAuthenticated(true);
          if (
            result.user.tokenId &&
            typeof result.user.tokenId === "string" &&
            pathname === "/"
          ) {
            void updateTokenAccessMetrics(result.user.tokenId);
          }
        } else {
          // Usuario no autenticado, redirigir a error
          router.replace("/error?message=necesita-invitacion");
          return;
        }
      } catch (error) {
        console.error("Error al verificar autenticación:", error);
        router.replace("/error?message=error-verificando-autenticacion");
        return;
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, pathname]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return null; // No renderizar nada mientras se redirige
  }

  return <>{children}</>;
}
