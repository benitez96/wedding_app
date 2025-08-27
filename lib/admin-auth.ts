import { cookies } from 'next/headers'
import * as jose from 'jose'
import prisma from '@/lib/prisma'

export interface AdminUser {
  id: string
  username: string
}

export async function verifyAdminAuth(): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get('admin-session')

    if (!session) {
      return { success: false, error: 'no-session' }
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret')
    const { payload } = await jose.jwtVerify(session.value, secret, {
      issuer: 'wedding-app',
      audience: 'wedding-admin',
      algorithms: ['HS512']
    })

    // Verificar claims adicionales de seguridad
    if (payload.iss !== 'wedding-app' || payload.aud !== 'wedding-admin') {
      return { success: false, error: 'invalid-claims' }
    }

    // Verificar que sea una sesión de admin
    if (payload.sessionType !== 'admin') {
      return { success: false, error: 'invalid-session-type' }
    }

    // Verificar que el usuario admin aún existe
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: payload.userId as string }
    })

    if (!adminUser) {
      return { success: false, error: 'user-not-found' }
    }

    return { 
      success: true, 
      user: {
        id: adminUser.id,
        username: adminUser.username
      }
    }
  } catch (error) {
    console.error('Error verificando autenticación de admin:', error)
    return { success: false, error: 'verification-error' }
  }
}

// Wrapper para proteger server actions
export function withAdminAuth<T extends any[], R>(
  action: (user: AdminUser, ...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const authResult = await verifyAdminAuth()
    
    if (!authResult.success || !authResult.user) {
      throw new Error('No autorizado')
    }

    return action(authResult.user, ...args)
  }
}
