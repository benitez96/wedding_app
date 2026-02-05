"use server";

import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import crypto from "crypto";
import { JWT_SECRET } from "@/lib/config";
import { verifyUserAuth } from "@/lib/server-auth";
import { verifyEventAccess, getUserEventContext } from "@/lib/event-context";
import { verifyInvitationAuth } from "@/lib/invitation-auth";

// Función para generar fingerprint del dispositivo (versión mejorada)
async function generateDeviceFingerprint(userAgent: string): Promise<string> {
  const hash = crypto.createHash("sha256");

  // Normalizar el user agent para ser menos sensible a actualizaciones menores
  const normalizedUA = userAgent
    .replace(/\d+\.\d+\.\d+\.\d+/g, "VERSION") // Reemplazar versiones específicas
    .replace(/Chrome\/[\d.]+/g, "Chrome/VERSION") // Normalizar versión de Chrome
    .replace(/Safari\/[\d.]+/g, "Safari/VERSION") // Normalizar versión de Safari
    .replace(/Firefox\/[\d.]+/g, "Firefox/VERSION") // Normalizar versión de Firefox
    .replace(/Edge\/[\d.]+/g, "Edge/VERSION"); // Normalizar versión de Edge

  hash.update(normalizedUA + JWT_SECRET);
  return hash.digest("hex").substring(0, 16); // Primeros 16 caracteres
}

/**
 * Actualiza las métricas de acceso de un token de invitación
 * @param tokenId - ID del token de invitación
 * REQUIERE: Autenticación de invitación (JWT guest session, NO Better Auth)
 * Esta función la llaman los GUESTS desde la página pública de invitación
 */
export async function updateTokenAccessMetrics(tokenId: string) {
  try {
    // Verificar autenticación de invitación (JWT, no Better Auth)
    // Los guests usan cookie "session" con JWT via jose, no "auth.session_token"
    const authResult = await verifyInvitationAuth();
    if (!authResult.success || !authResult.user) {
      return { success: false, error: "No autorizado" };
    }

    // Verificar que el tokenId pertenece a la sesión del guest
    if (authResult.user.tokenId !== tokenId) {
      return { success: false, error: "No autorizado para este token" };
    }

    // Obtener el token actual
    const currentToken = await prisma.invitationToken.findUnique({
      where: { id: tokenId },
    });

    if (!currentToken) {
      return { success: false, error: "Token no encontrado" };
    }

    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "Unknown";

    // Generar fingerprint del dispositivo
    const deviceFp = await generateDeviceFingerprint(userAgent);

    // Preparar datos para actualización
    const updateData: any = {
      lastAccessAt: new Date(),
      accessCount: {
        increment: 1,
      },
      userAgent: userAgent,
      deviceId: deviceFp, // Guardar el fingerprint del dispositivo
    };

    // Solo establecer firstAccessAt si no está ya establecido
    if (!currentToken.firstAccessAt) {
      updateData.firstAccessAt = new Date();
    }

    await prisma.invitationToken.update({
      where: { id: tokenId },
      data: updateData,
    });

    console.log(
      `✅ Métricas actualizadas para token: ${tokenId} con deviceId: ${deviceFp}`,
    );
    return { success: true };
  } catch (error) {
    console.error("Error actualizando métricas de acceso:", error);
    return { success: false, error: "Error interno del servidor" };
  }
}

/**
 * Obtiene estadísticas de acceso para un token específico
 * @param tokenId - ID del token de invitación
 * REQUIERE: Autenticación y ownership del evento asociado al token
 */
export async function getTokenAccessStats(tokenId: string) {
  try {
    // Verificar autenticación
    const authResult = await verifyUserAuth();
    if (!authResult.success || !authResult.user) {
      return { success: false, error: "No autorizado" };
    }

    // Obtener el token con su relación a invitation para verificar event ownership
    const tokenWithEvent = await prisma.invitationToken.findUnique({
      where: { id: tokenId },
      include: {
        invitation: {
          select: { eventId: true },
        },
      },
    });

    if (!tokenWithEvent || !tokenWithEvent.invitation) {
      return { success: false, error: "Token no encontrado" };
    }

    // Verificar que el usuario tiene acceso al evento
    const eventAccess = await verifyEventAccess(
      authResult.user.id,
      tokenWithEvent.invitation.eventId,
    );
    if (!eventAccess) {
      return { success: false, error: "No autorizado para este evento" };
    }

    // Return the metrics (tokenWithEvent already has the data)
    return {
      success: true,
      data: {
        firstAccessAt: tokenWithEvent.firstAccessAt,
        lastAccessAt: tokenWithEvent.lastAccessAt,
        accessCount: tokenWithEvent.accessCount,
        deviceId: tokenWithEvent.deviceId,
        userAgent: tokenWithEvent.userAgent,
      },
    };
  } catch (error) {
    console.error("Error obteniendo estadísticas de acceso:", error);
    return { success: false, error: "Error interno del servidor" };
  }
}

/**
 * Obtiene estadísticas agregadas de tokens del evento activo del usuario
 * REQUIERE: Autenticación
 */
export async function getAggregatedAccessStats() {
  try {
    // Verificar autenticación
    const authResult = await verifyUserAuth();
    if (!authResult.success || !authResult.user) {
      return { success: false, error: "No autorizado" };
    }

    // Obtener el evento activo del usuario
    const eventContext = await getUserEventContext(authResult.user.id);
    if (!eventContext) {
      return { success: false, error: "No se encontró un evento activo" };
    }

    // Scopear todas las queries por el evento del usuario
    const eventFilter = {
      invitation: {
        eventId: eventContext.eventId,
      },
    };

    const stats = await prisma.invitationToken.aggregate({
      where: eventFilter,
      _sum: {
        accessCount: true,
      },
      _count: {
        id: true,
        deviceId: true,
      },
      _min: {
        firstAccessAt: true,
      },
      _max: {
        lastAccessAt: true,
      },
    });

    // Contar dispositivos únicos (deviceId no nulos) solo del evento del usuario
    const uniqueDevices = await prisma.invitationToken.count({
      where: {
        ...eventFilter,
        deviceId: {
          not: null,
        },
      },
    });

    const result = {
      totalAccesses: stats._sum.accessCount || 0,
      totalTokens: stats._count.id,
      uniqueDevices: uniqueDevices,
      firstAccess: stats._min.firstAccessAt,
      lastAccess: stats._max.lastAccessAt,
    };

    console.log(
      `📊 Estadísticas agregadas para evento ${eventContext.eventId}:`,
    );
    return { success: true, data: result };
  } catch (error) {
    console.error("Error obteniendo estadísticas agregadas:", error);
    return { success: false, error: "Error interno del servidor" };
  }
}
