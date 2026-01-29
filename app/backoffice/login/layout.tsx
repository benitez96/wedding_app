import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import BackofficeNavbar from "../BackofficeNavbar";

interface LoginLayoutProps {
  children: React.ReactNode;
}

export default async function LoginLayout({ children }: LoginLayoutProps) {
  // Verificar si el usuario ya está autenticado
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Si ya está autenticado, redirigir al backoffice
  if (session) {
    redirect("/backoffice");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar sin menú (solo logo) */}
      <BackofficeNavbar showMenu={false} />
      {children}
    </div>
  );
}
