import { headers } from 'next/headers'
import prisma from '@/lib/prisma'

// Interfaz para el rate limiter
interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
  blockDurationMs: number
}

// Configuraciones por tipo de acción
const RATE_LIMIT_CONFIGS = {
  // Procesamiento de tokens de invitación
  'invitation-token': {
    maxAttempts: 10, // 10 intentos por ventana
    windowMs: 15 * 60 * 1000, // 15 minutos
    blockDurationMs: 24 * 60 * 60 * 1000 // 24 horas
  },
  // Login del backoffice
  'admin-login': {
    maxAttempts: 3, // 3 intentos fallidos
    windowMs: 15 * 60 * 1000, // 15 minutos
    blockDurationMs: 24 * 60 * 60 * 1000 // 24 horas
  },
  // Acciones generales de invitación
  'invitation-actions': {
    maxAttempts: 50, // 50 acciones por ventana
    windowMs: 60 * 60 * 1000, // 1 hora
    blockDurationMs: 2 * 60 * 60 * 1000 // 2 horas
  }
} as const

// Función para obtener la IP real del cliente
export async function getClientIP(): Promise<string> {
  const headersList = await headers()
  
  // Intentar obtener IP de diferentes headers (para diferentes configuraciones de proxy)
  const ip = headersList.get('x-forwarded-for') || 
             headersList.get('x-real-ip') || 
             headersList.get('cf-connecting-ip') || // Cloudflare
             headersList.get('x-client-ip') ||
             'unknown'
  
  // Si hay múltiples IPs (x-forwarded-for puede contener varias), tomar la primera
  return ip.split(',')[0].trim()
}

// Función para verificar si una IP está bloqueada
export async function isIPBlocked(ip: string, actionType: keyof typeof RATE_LIMIT_CONFIGS): Promise<boolean> {
  const now = new Date()
  const config = RATE_LIMIT_CONFIGS[actionType]
  
  // Buscar bloqueos activos para esta IP y acción
  const activeBlock = await prisma.rateLimitBlock.findFirst({
    where: {
      ip,
      actionType,
      blockedUntil: {
        gt: now
      }
    }
  })
  
  return !!activeBlock
}

// Función para registrar un intento
export async function recordAttempt(ip: string, actionType: keyof typeof RATE_LIMIT_CONFIGS, success: boolean = false): Promise<{
  allowed: boolean
  remainingAttempts: number
  blockedUntil?: Date
}> {
  const now = new Date()
  const config = RATE_LIMIT_CONFIGS[actionType]
  
  // Verificar si ya está bloqueado
  if (await isIPBlocked(ip, actionType)) {
    const block = await prisma.rateLimitBlock.findFirst({
      where: {
        ip,
        actionType,
        blockedUntil: {
          gt: now
        }
      }
    })
    
    return {
      allowed: false,
      remainingAttempts: 0,
      blockedUntil: block?.blockedUntil
    }
  }
  
  // Limpiar intentos antiguos fuera de la ventana
  const windowStart = new Date(now.getTime() - config.windowMs)
  await prisma.rateLimitAttempt.deleteMany({
    where: {
      ip,
      actionType,
      timestamp: {
        lt: windowStart
      }
    }
  })
  
  // Contar intentos en la ventana actual
  const attemptsInWindow = await prisma.rateLimitAttempt.count({
    where: {
      ip,
      actionType,
      timestamp: {
        gte: windowStart
      }
    }
  })
  
  // Registrar el intento actual
  await prisma.rateLimitAttempt.create({
    data: {
      ip,
      actionType,
      success,
      timestamp: now
    }
  })
  
  const remainingAttempts = Math.max(0, config.maxAttempts - attemptsInWindow - 1)
  
  // Si se excedió el límite, bloquear la IP
  if (attemptsInWindow >= config.maxAttempts) {
    const blockedUntil = new Date(now.getTime() + config.blockDurationMs)
    
    await prisma.rateLimitBlock.create({
      data: {
        ip,
        actionType,
        blockedUntil,
        reason: `Excedió límite de ${config.maxAttempts} intentos en ${config.windowMs / 1000 / 60} minutos`
      }
    })
    
    return {
      allowed: false,
      remainingAttempts: 0,
      blockedUntil
    }
  }
  
  return {
    allowed: true,
    remainingAttempts
  }
}

// Función para verificar rate limit sin registrar intento
export async function checkRateLimit(ip: string, actionType: keyof typeof RATE_LIMIT_CONFIGS): Promise<{
  allowed: boolean
  remainingAttempts: number
  blockedUntil?: Date
}> {
  const now = new Date()
  const config = RATE_LIMIT_CONFIGS[actionType]
  
  // Verificar si está bloqueado
  if (await isIPBlocked(ip, actionType)) {
    const block = await prisma.rateLimitBlock.findFirst({
      where: {
        ip,
        actionType,
        blockedUntil: {
          gt: now
        }
      }
    })
    
    return {
      allowed: false,
      remainingAttempts: 0,
      blockedUntil: block?.blockedUntil
    }
  }
  
  // Contar intentos en la ventana actual
  const windowStart = new Date(now.getTime() - config.windowMs)
  const attemptsInWindow = await prisma.rateLimitAttempt.count({
    where: {
      ip,
      actionType,
      timestamp: {
        gte: windowStart
      }
    }
  })
  
  return {
    allowed: attemptsInWindow < config.maxAttempts,
    remainingAttempts: Math.max(0, config.maxAttempts - attemptsInWindow)
  }
}

// Función para bloquear IP por honeypot (bloqueo inmediato y más largo)
export async function blockIPForHoneypot(ip: string, actionType: keyof typeof RATE_LIMIT_CONFIGS, details?: string): Promise<void> {
  const now = new Date()
  // Bloqueo más largo para honeypot: 7 días
  const blockedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  
  // Crear bloqueo inmediato
  await prisma.rateLimitBlock.create({
    data: {
      ip,
      actionType,
      blockedUntil,
      reason: `Honeypot activado${details ? `: ${details}` : ''}`
    }
  })
}

// Función para limpiar datos antiguos (puede ejecutarse como cron job)
export async function cleanupOldRateLimitData(): Promise<void> {
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  
  // Limpiar intentos de hace más de 1 día
  await prisma.rateLimitAttempt.deleteMany({
    where: {
      timestamp: {
        lt: oneDayAgo
      }
    }
  })
  
  // Limpiar bloqueos expirados
  await prisma.rateLimitBlock.deleteMany({
    where: {
      blockedUntil: {
        lt: now
      }
    }
  })
}
