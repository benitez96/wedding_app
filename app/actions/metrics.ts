'use server'

import prisma from '@/lib/prisma'
import { headers } from 'next/headers'
import crypto from 'crypto'
import { JWT_SECRET } from '@/lib/config'

// Función para generar fingerprint del dispositivo
async function generateDeviceFingerprint(userAgent: string): Promise<string> {
  const hash = crypto.createHash('sha256')
  hash.update(userAgent + JWT_SECRET)
  return hash.digest('hex').substring(0, 16) // Primeros 16 caracteres
}

/**
 * Actualiza las métricas de acceso de un token de invitación
 * @param tokenId - ID del token de invitación
 */
export async function updateTokenAccessMetrics(tokenId: string) {
  try {
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || 'Unknown'
    
    // Generar fingerprint del dispositivo
    const deviceFp = await generateDeviceFingerprint(userAgent)
    
    // Primero verificar si firstAccessAt ya está establecido
    const currentToken = await prisma.invitationToken.findUnique({
      where: { id: tokenId },
      select: { 
        firstAccessAt: true,
        deviceId: true 
      }
    })
    
    if (!currentToken) {
      console.warn(`Token no encontrado: ${tokenId}`)
      return { success: false, error: 'Token no encontrado' }
    }
    
    // Preparar datos para actualización
    const updateData: any = {
      lastAccessAt: new Date(),
      accessCount: {
        increment: 1
      },
      userAgent: userAgent,
      deviceId: deviceFp // Guardar el fingerprint del dispositivo
    }
    
    // Solo establecer firstAccessAt si no está ya establecido
    if (!currentToken.firstAccessAt) {
      updateData.firstAccessAt = new Date()
    }
    
    await prisma.invitationToken.update({
      where: { id: tokenId },
      data: updateData
    })
    
    console.log(`✅ Métricas actualizadas para token: ${tokenId} con deviceId: ${deviceFp}`)
    return { success: true }
    
  } catch (error) {
    console.error('Error actualizando métricas de acceso:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Obtiene estadísticas de acceso para un token específico
 * @param tokenId - ID del token de invitación
 */
export async function getTokenAccessStats(tokenId: string) {
  try {
    const token = await prisma.invitationToken.findUnique({
      where: { id: tokenId },
      select: {
        firstAccessAt: true,
        lastAccessAt: true,
        accessCount: true,
        deviceId: true,
        userAgent: true
      }
    })
    
    return { success: true, data: token }
  } catch (error) {
    console.error('Error obteniendo estadísticas de acceso:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Obtiene estadísticas agregadas de todos los tokens
 */
export async function getAggregatedAccessStats() {
  try {
    const stats = await prisma.invitationToken.aggregate({
      _sum: {
        accessCount: true
      },
      _count: {
        id: true,
        deviceId: true
      },
      _min: {
        firstAccessAt: true
      },
      _max: {
        lastAccessAt: true
      }
    })
    
    // Contar dispositivos únicos (deviceId no nulos)
    const uniqueDevices = await prisma.invitationToken.count({
      where: {
        deviceId: {
          not: null
        }
      }
    })
    
    const result = {
      totalAccesses: stats._sum.accessCount || 0,
      totalTokens: stats._count.id,
      uniqueDevices: uniqueDevices,
      firstAccess: stats._min.firstAccessAt,
      lastAccess: stats._max.lastAccessAt
    }
    
    console.log('📊 Estadísticas agregadas:', result)
    return { success: true, data: result }
    
  } catch (error) {
    console.error('Error obteniendo estadísticas agregadas:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}
