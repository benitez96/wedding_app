"use client";

import { useState, useEffect, useActionState } from "react";
import { useRouter } from "next/navigation";
import { authenticateAdminAction } from "@/app/actions/admin";
import { Button, Input, Card, CardBody, CardHeader, Form } from "@heroui/react";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { useCSRF } from "@/hooks/useCSRF";

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const { csrfData } = useCSRF();
  const router = useRouter();

  // useActionState para manejar el login
  const [state, formAction, isPending] = useActionState(
    authenticateAdminAction,
    null,
  );

  // Redirigir cuando el login es exitoso
  useEffect(() => {
    if (state?.success) {
      router.replace("/backoffice");
      router.refresh();
    }
  }, [state?.success, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Panel de Administración
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Ingresa tus credenciales para acceder
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="pb-0">
            <h3 className="text-lg font-medium text-gray-900">
              Iniciar Sesión
            </h3>
          </CardHeader>
          <CardBody>
            <Form action={formAction} className="space-y-6">
              {/* Campo hidden para CSRF */}
              <input
                type="hidden"
                name="csrfToken"
                value={csrfData?.token || ""}
              />

                <Input
                  type="text"
                  name="username"
                  label="Usuario"
                  placeholder="Ingresa tu usuario"
                  startContent={<User className="w-4 h-4" />}
                  isRequired
                  isDisabled={isPending}
                  fullWidth
                />

              {/* Honeypot field - oculto para usuarios reales, visible para bots */}
              <div className="absolute left-[-9999px] opacity-0 pointer-events-none">
                <Input
                  type="text"
                  name="masterkey"
                  autoComplete="off"
                  tabIndex={-1}
                />
              </div>

                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  label="Contraseña"
                  placeholder="Ingresa tu contraseña"
                  startContent={<Lock className="w-4 h-4" />}
                  endContent={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      onMouseDown={(e) => e.preventDefault()}
                      onTouchStart={(e) => e.preventDefault()}
                      className="focus:outline-none"
                      aria-label={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  }
                  isRequired
                  isDisabled={isPending}
                  fullWidth
                />

              {state?.error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                  {state.error === "credenciales-invalidas"
                    ? "Usuario o contraseña incorrectos"
                    : state.error === "error-autenticando"
                      ? "Error al autenticar. Intenta nuevamente."
                      : "Usuario o contraseña incorrectos"}
                </div>
              )}

              <Button
                type="submit"
                color="primary"
                className="w-full"
                isLoading={isPending}
                isDisabled={isPending}
              >
                {isPending ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </Form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
