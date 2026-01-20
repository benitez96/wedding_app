import BackofficeNavbar from "../BackofficeNavbar";

interface LoginLayoutProps {
  children: React.ReactNode;
}

export default function LoginLayout({ children }: LoginLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar sin menú (solo logo) */}
      <BackofficeNavbar showMenu={false} />
      {children}
    </div>
  );
}
