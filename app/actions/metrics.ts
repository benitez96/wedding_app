"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma";
import { headers } from "next/headers";
import crypto from "crypto";
import { logError } from "@/lib/logger";
import { verifyInvitationAuth } from "@/lib/invitation-auth";

/**
 * Dedicated salt for device fingerprinting.
 * SECURITY: Uses a separate salt instead of JWT_SECRET to prevent
 * known-plaintext attacks if the fingerprint hash is ever exposed.
 */
const DEVICE_FINGERPRINT_SALT = crypto
  .createHash("sha256")
  .update("wedding-app-device-fingerprint-salt-v1")
  .digest("hex");

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

  hash.update(normalizedUA + DEVICE_FINGERPRINT_SALT);
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
    const updateData: Prisma.InvitationTokenUpdateInput = {
      lastAccessAt: new Date(),
      accessCount: {
        increment: 1,
      },
      userAgent: userAgent,
      deviceId: deviceFp,
      ...(!currentToken.firstAccessAt && { firstAccessAt: new Date() }),
    };

    await prisma.invitationToken.update({
      where: { id: tokenId },
      data: updateData,
    });

    // Metrics updated successfully
    return { success: true };
  } catch (error) {
    logError("Error actualizando métricas de acceso", error);
    return { success: false, error: "Error interno del servidor" };
  }
}
