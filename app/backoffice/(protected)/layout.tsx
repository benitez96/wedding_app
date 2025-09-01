import AdminAuthGuard from '@/components/AdminAuthGuard'

interface ProtectedLayoutProps {
  children: React.ReactNode
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <AdminAuthGuard>
      {children}
    </AdminAuthGuard>
  )
}
