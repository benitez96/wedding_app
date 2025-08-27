import { headers } from 'next/headers'
import prisma from '@/lib/prisma'

export interface SecurityEvent {
  type: 'login-attempt' | 'login-success' | 'login-failed' | 'rate-limit-triggered' | 'honeypot-triggered'
  ip: string
  userAgent: string
  details?: Record<string, any>
  timestamp: Date
}

// Función para obtener información del cliente
async function getClientInfo() {
  const headersList = await headers()
  
  return {
    ip: headersList.get('x-forwarded-for') || 
        headersList.get('x-real-ip') || 
        headersList.get('cf-connecting-ip') || 
        headersList.get('x-client-ip') ||
        'unknown',
    userAgent: headersList.get('user-agent') || 'unknown',
    referer: headersList.get('referer') || 'unknown'
  }
}

// Función para loggear eventos de seguridad
export async function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): Promise<void> {
  try {
    const { ip, userAgent, referer } = await getClientInfo()
    
    // Loggear en consola para desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 Security Event:', {
        ...event,
        ip,
        userAgent,
        referer,
        timestamp: new Date().toISOString()
      })
    }
    
    // En producción, podrías enviar a un servicio de logging
    // como Sentry, LogRocket, o un sistema interno
    
    // También podrías guardar en base de datos para análisis
    // await prisma.securityLog.create({
    //   data: {
    //     type: event.type,
    //     ip,
    //     userAgent,
    //     referer,
    //     details: event.details,
    //     timestamp: new Date()
    //   }
    // })
    
  } catch (error) {
    // No fallar si el logging falla
    console.error('Error logging security event:', error)
  }
}

// Función para detectar patrones sospechosos
export async function detectSuspiciousActivity(ip: string): Promise<{
  isSuspicious: boolean
  reasons: string[]
}> {
  const reasons: string[] = []
  
  try {
    // Verificar intentos recientes
    const recentAttempts = await prisma.rateLimitAttempt.count({
      where: {
        ip,
        actionType: 'admin-login',
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
        }
      }
    })
    
    if (recentAttempts > 10) {
      reasons.push(`Muchos intentos recientes: ${recentAttempts}`)
    }
    
    // Verificar bloqueos recientes
    const recentBlocks = await prisma.rateLimitBlock.count({
      where: {
        ip,
        actionType: 'admin-login',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Última semana
        }
      }
    })
    
    if (recentBlocks > 2) {
      reasons.push(`Múltiples bloqueos recientes: ${recentBlocks}`)
    }
    
    // Verificar patrones de IPs conocidas como maliciosas
    const suspiciousIPs: string[] = [
      // Agregar IPs conocidas como maliciosas o rangos de IPs de datacenters sospechosos
    ]
    
    if (suspiciousIPs.includes(ip)) {
      reasons.push('IP en lista negra')
    }
    
    return {
      isSuspicious: reasons.length > 0,
      reasons
    }
    
  } catch (error) {
    console.error('Error detecting suspicious activity:', error)
    return { isSuspicious: false, reasons: [] }
  }
}

// Función para obtener estadísticas de seguridad
export async function getSecurityStats(): Promise<{
  totalAttempts: number
  failedAttempts: number
  blockedIPs: number
  suspiciousIPs: number
}> {
  try {
    const [totalAttempts, failedAttempts, blockedIPs] = await Promise.all([
      prisma.rateLimitAttempt.count({
        where: {
          actionType: 'admin-login',
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.rateLimitAttempt.count({
        where: {
          actionType: 'admin-login',
          success: false,
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.rateLimitBlock.count({
        where: {
          actionType: 'admin-login',
          blockedUntil: {
            gt: new Date()
          }
        }
      })
    ])
    
    return {
      totalAttempts,
      failedAttempts,
      blockedIPs,
      suspiciousIPs: 0 // Implementar lógica más avanzada si es necesario
    }
    
  } catch (error) {
    console.error('Error getting security stats:', error)
    return {
      totalAttempts: 0,
      failedAttempts: 0,
      blockedIPs: 0,
      suspiciousIPs: 0
    }
  }
}
