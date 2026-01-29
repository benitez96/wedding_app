import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Iniciar Sesión",
  description: "Ingresa a tu cuenta para gestionar tus eventos",
};

export default function LoginPage() {
  return <LoginForm />;
}
