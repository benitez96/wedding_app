import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

interface AuthLayoutProps {
  children: ReactNode;
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
  // Verificar si el usuario ya está autenticado
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Si ya está autenticado, redirigir al backoffice
  if (session) {
    redirect("/backoffice");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">{children}</div>
  );
}
