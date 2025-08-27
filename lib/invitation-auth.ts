import { cookies } from 'next/headers'
import * as jose from 'jose'
import prisma from '@/lib/prisma'

export interface InvitationUser {
  invitationId: string
  tokenId: string
  guestName: string
  guestNickname?: string
  maxGuests: number
  hasResponded: boolean
  isAttending?: boolean
  guestCount?: number
  respondedAt?: Date
}

export async function verifyInvitationAuth(): Promise<{ success: boolean; user?: InvitationUser; error?: string }> {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get('session')

    if (!session) {
      return { success: false, error: 'no-session' }
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret')
    const { payload } = await jose.jwtVerify(session.value, secret, {
      issuer: 'wedding-app',
      audience: 'wedding-invitation',
      algorithms: ['HS512']
    })

    // Verificar claims adicionales de seguridad
    if (payload.iss !== 'wedding-app' || payload.aud !== 'wedding-invitation') {
      return { success: false, error: 'invalid-claims' }
    }

    // Verificar que sea una sesión de invitación (no admin)
    if (payload.sessionType === 'admin') {
      return { success: false, error: 'invalid-session-type' }
    }

    // Validar el token usando la helper function
    const validation = await validateToken(payload.tokenId as string)
    
    if (!validation.valid || !validation.invitation) {
      return { success: false, error: 'invalid-token' }
    }

    return { 
      success: true, 
      user: {
        invitationId: payload.invitationId as string,
        tokenId: payload.tokenId as string,
        guestName: validation.invitation.guestName,
        guestNickname: validation.invitation.guestNickname || undefined,
        maxGuests: validation.invitation.maxGuests,
        hasResponded: validation.invitation.hasResponded,
        isAttending: validation.invitation.isAttending || undefined,
        guestCount: validation.invitation.guestCount || undefined,
        respondedAt: validation.invitation.respondedAt || undefined
      }
    }
  } catch (error) {
    console.error('Error verificando autenticación de invitación:', error)
    return { success: false, error: 'verification-error' }
  }
}

// Función helper para validar token (copiada del archivo invitations.ts)
async function validateToken(tokenId: string) {
  try {
    const invitationToken = await prisma.invitationToken.findUnique({
      where: { id: tokenId },
      include: {
        invitation: true
      }
    })

    if (!invitationToken) {
      return { valid: false, error: 'token-no-existe' }
    }

    if (!invitationToken.isActive) {
      return { valid: false, error: 'token-inactivo' }
    }

    if (!invitationToken.isUsed) {
      return { valid: false, error: 'token-no-usado' }
    }

    return { 
      valid: true, 
      invitation: invitationToken.invitation 
    }
  } catch (error) {
    console.error('Error validando token:', error)
    return { valid: false, error: 'error-validando-token' }
  }
}

// Wrapper para proteger server actions de invitaciones
export function withInvitationAuth<T extends any[], R>(
  action: (user: InvitationUser, ...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const authResult = await verifyInvitationAuth()
    
    if (!authResult.success || !authResult.user) {
      throw new Error('No autorizado')
    }

    return action(authResult.user, ...args)
  }
}
