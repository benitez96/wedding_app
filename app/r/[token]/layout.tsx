import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Invitación de Boda",
  description: "Invitación especial para celebrar nuestra boda",
  robots: "noindex, nofollow", // Para que no aparezca en buscadores
}

export default function InvitationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}
