import { processInvitationToken } from '@/app/actions/invitations'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

interface TokenPageProps {
  params: {
    token: string
  }
}

export default async function TokenPage({ params }: TokenPageProps) {
  const { token } = await params

  // Procesar el token directamente
  const result = await processInvitationToken(token)
  
  if (result.success && result.cookie) {
    // Setear la cookie
    const cookieStore = await cookies()
    cookieStore.set('wedding-session', result.cookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30 días
    })
    
    redirect('/')
  } else {
    redirect(`/error?message=${result.error}`)
  }
}
