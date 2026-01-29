"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Mail, User } from "lucide-react";
import Link from "next/link";
import PasswordInput from "@/components/ui/PasswordInput";

interface SignUpFormProps {
  redirectTo?: string;
  showLoginLink?: boolean;
}

export function SignUpForm({
  redirectTo = "/backoffice",
  showLoginLink = true,
}: SignUpFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string>();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(undefined);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setIsPending(false);
      return;
    }

    // Validar longitud mínima de contraseña
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      setIsPending(false);
      return;
    }

    const result = await authClient.signUp.email({
      name,
      email,
      password,
    });

    if (result.error) {
      setError(
        result.error.message || "Error al crear la cuenta. Intenta nuevamente.",
      );
      setIsPending(false);
      return;
    }

    // Redirigir al backoffice
    router.push(redirectTo);
    router.refresh();
  };

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Crear tu cuenta
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Empezá a gestionar tus eventos en minutos
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="pb-0">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Registro
            </h3>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                type="text"
                name="name"
                label="Nombre completo"
                placeholder="Juan Pérez"
                startContent={<User className="w-4 h-4" />}
                isRequired
                isDisabled={isPending}
                autoComplete="name"
                fullWidth
              />

              <Input
                type="email"
                name="email"
                label="Correo electrónico"
                placeholder="tu@email.com"
                startContent={<Mail className="w-4 h-4" />}
                isRequired
                isDisabled={isPending}
                autoComplete="email"
                fullWidth
              />

              <PasswordInput
                name="password"
                label="Contraseña"
                description="Mínimo 8 caracteres"
                isRequired
                isDisabled={isPending}
                autoComplete="new-password"
              />

              <PasswordInput
                name="confirmPassword"
                label="Confirmar contraseña"
                isRequired
                isDisabled={isPending}
                autoComplete="new-password"
              />

              {error && (
                <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                color="primary"
                className="w-full"
                isLoading={isPending}
                isDisabled={isPending}
              >
                {isPending ? "Creando cuenta..." : "Crear Cuenta"}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                    o continuar con
                  </span>
                </div>
              </div>

              {/* Google Sign Up */}
              <Button
                type="button"
                variant="bordered"
                className="w-full"
                isDisabled={isPending}
                onPress={async () => {
                  setIsPending(true);
                  try {
                    await authClient.signIn.social({
                      provider: "google",
                      callbackURL: redirectTo,
                    });
                  } catch (err) {
                    setError("Error al registrarse con Google");
                    setIsPending(false);
                  }
                }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continuar con Google
              </Button>

              {showLoginLink && (
                <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                  ¿Ya tenés cuenta?{" "}
                  <Link
                    href="/login"
                    className="font-medium text-primary hover:text-primary-600"
                  >
                    Iniciá sesión
                  </Link>
                </p>
              )}
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
