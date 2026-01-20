import { getCSRFTokenForForm } from "@/lib/csrf";
import AdminLoginForm from "@/components/backoffice/AdminLoginForm";

export default async function AdminLoginPage() {
  // Generar CSRF token en el servidor (sin waterfall)
  const csrfData = await getCSRFTokenForForm();

  return <AdminLoginForm csrfData={csrfData} />;
}
