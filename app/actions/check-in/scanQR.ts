"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { z } from "zod";

const scanQRSchema = z.object({
  tokenId: z.string().min(1, "Token inválido"),
  eventId: z.string().cuid(),
});

interface ScanQRResult {
  success: boolean;
  error?: string;
  invitation?: {
    id: string;
    tokenId: string;
    guestName: string;
    guestNickname: string | null;
    maxGuests: number;
    checkInCount: number;
    remaining: number;
  };
}

/**
 * Validar QR y obtener datos de la invitación
 *
 * Este endpoint se llama cuando el staff escanea un QR.
 * Valida:
 * - Token existe y está activo
 * - Usuario tiene permiso CHECKIN_SCAN
 * - Token pertenece al evento actual
 *
 * Retorna datos de la invitación para mostrar en el modal de check-in.
 */
export async function scanQR(
  input: z.infer<typeof scanQRSchema>,
): Promise<ScanQRResult> {
  try {
    // 1. Autenticación
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      return { success: false, error: "No autenticado" };
    }

    // 2. Validar input
    const validated = scanQRSchema.parse(input);

    // 3. Buscar token
    const token = await prisma.invitationToken.findUnique({
      where: { id: validated.tokenId },
      include: {
        invitation: {
          include: {
            event: {
              select: {
                ownerId: true,
                members: {
                  where: { userId: session.user.id },
                },
              },
            },
          },
        },
      },
    });

    if (!token) {
      return {
        success: false,
        error: "Código QR inválido o no encontrado",
      };
    }

    // 4. Verificar que el token esté activo
    if (!token.isActive) {
      return {
        success: false,
        error: "Este código QR ha sido revocado",
      };
    }

    // 5. Verificar que no haya expirado
    if (token.expiresAt < new Date()) {
      return {
        success: false,
        error: "Este código QR ha expirado",
      };
    }

    // 6. Verificar que pertenece al evento correcto
    if (token.invitation.eventId !== validated.eventId) {
      return {
        success: false,
        error: "Este código QR no pertenece a este evento",
      };
    }

    // 7. Verificar permisos del usuario (owner tiene acceso automático)
    const isOwner = token.invitation.event.ownerId === session.user.id;

    if (!isOwner) {
      const member = token.invitation.event.members[0];
      if (
        !member ||
        !hasPermission(member.permissions, PERMISSIONS.CHECKIN_SCAN)
      ) {
        return {
          success: false,
          error: "No tienes permisos para escanear códigos QR",
        };
      }
    }

    // 8. Calcular lugares restantes
    const remaining =
      token.invitation.maxGuests - token.invitation.checkInCount;

    // 9. Retornar datos de la invitación
    return {
      success: true,
      invitation: {
        id: token.invitation.id,
        tokenId: token.id,
        guestName: token.invitation.guestName,
        guestNickname: token.invitation.guestNickname,
        maxGuests: token.invitation.maxGuests,
        checkInCount: token.invitation.checkInCount,
        remaining,
      },
    };
  } catch (error) {
    console.error("[scanQR] Error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Datos inválidos",
      };
    }

    return {
      success: false,
      error: "Error al procesar el código QR",
    };
  }
}
