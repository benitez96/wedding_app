import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/app/actions/admin";
import BackofficeNavbar from "../BackofficeNavbar";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default async function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  // Verificar autenticación en el servidor (sin waterfall client-side)
  const result = await getCurrentAdmin();

  if (!result.success || !result.user) {
    redirect("/backoffice/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar con menú (solo para usuarios logueados) */}
      <BackofficeNavbar showMenu={true} />

      {/* Main Content */}
      <main className="container mx-auto max-w-screen-xl px-2 md:px-4 py-4 md:py-6">
        {children}
      </main>
    </div>
  );
}
