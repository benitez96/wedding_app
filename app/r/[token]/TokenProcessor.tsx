"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { processInvitationToken } from "@/app/actions/invitations";
import LoadingSpinner from "@/components/LoadingSpinner";

interface TokenProcessorProps {
  token: string;
}

export default function TokenProcessor({ token }: TokenProcessorProps) {
  const router = useRouter();

  useEffect(() => {
    let isActive = true;

    const processToken = async () => {
      try {
        // Procesar el token usando el server action
        const result = await processInvitationToken(token);

        if (!isActive) return;

        // Manejar los diferentes casos según el resultado
        switch (result.action) {
          case "redirect":
            // Usuario ya tiene sesión válida, redirigir al sitio público
            router.replace("/");
            break;

          case "authenticated":
            // Usuario autenticado exitosamente, redirigir al sitio público
            router.replace("/");
            break;

          case "error":
            // Error en el procesamiento, redirigir a página de error
            router.replace(`/error?message=${result.error}`);
            break;

          default:
            // Caso por defecto, redirigir a error
            router.replace("/error?message=error-desconocido");
        }
      } catch (error) {
        console.error("Error al procesar token:", error);
        router.replace("/error?message=error-procesando-token");
      }
    };

    processToken();

    return () => {
      isActive = false;
    };
  }, [token, router]);

  return <LoadingSpinner />;
}
