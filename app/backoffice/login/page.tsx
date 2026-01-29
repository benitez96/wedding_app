import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Backoffice - Iniciar Sesión",
  description: "Ingresa para gestionar tu evento",
};

export default function BackofficeLoginPage() {
  return <LoginForm redirectTo="/backoffice" showSignUpLink={true} />;
}
