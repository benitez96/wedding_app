"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader, CardFooter } from "@heroui/card";
import { acceptInviteLink } from "@/app/actions/collaborators";
import Link from "next/link";

interface JoinEventClientProps {
  token: string;
  eventName: string;
  eventDescription: string | null;
  isAuthenticated: boolean;
  error?: string;
}

export default function JoinEventClient({
  token,
  eventName,
  eventDescription,
  isAuthenticated,
  error: initialError,
}: JoinEventClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(initialError ?? null);

  const handleAccept = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await acceptInviteLink(token);
      if (result.success) {
        router.push("/backoffice/dashboard");
      } else {
        setError(result.error ?? "Error al aceptar la invitación");
      }
    } catch (err) {
      setError("Error al aceptar la invitación");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="flex flex-col items-center gap-2 pt-6">
          <h1 className="text-2xl font-bold text-center">
            Invitación a colaborar
          </h1>
          <p className="text-lg text-primary font-medium">{eventName}</p>
          {eventDescription && (
            <p className="text-sm text-default-500 text-center">
              {eventDescription}
            </p>
          )}
        </CardHeader>

        <CardBody className="flex flex-col gap-4 items-center">
          {error && (
            <div className="w-full p-3 bg-danger-50 border border-danger-200 text-danger-700 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <p className="text-sm text-default-600 text-center">
            Has sido invitado a colaborar en este evento. Al aceptar, podrás
            acceder al backoffice del evento con los permisos asignados.
          </p>
        </CardBody>

        <CardFooter className="flex flex-col gap-3 pb-6">
          {isAuthenticated ? (
            <Button
              color="primary"
              fullWidth
              onPress={handleAccept}
              isLoading={isLoading}
            >
              Aceptar invitación
            </Button>
          ) : (
            <>
              <Button
                as={Link}
                href={`/login?callbackURL=/join/${token}`}
                color="primary"
                fullWidth
              >
                Iniciar sesión para aceptar
              </Button>
              <Button
                as={Link}
                href={`/signup?callbackURL=/join/${token}`}
                variant="bordered"
                fullWidth
              >
                Crear cuenta
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
