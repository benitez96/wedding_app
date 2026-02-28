import { cookies } from "next/headers";
import * as jose from "jose";
import prisma from "@/lib/prisma";
import { getJwtSecret, getSecurityConfig } from "@/lib/config";
import { logError } from "@/lib/logger";

/**
 * Invitation guest user (NOT a registered User)
 * Anonymous access via single-use invitation token
 * Session duration: 180 days
 */
export interface InvitationUser {
  invitationId: string;
  tokenId: string;
  guestName: string;
  guestNickname?: string;
  maxGuests: number;
  hasResponded: boolean;
  isAttending?: boolean;
  guestCount?: number;
  respondedAt?: Date;
}

/**
 * Verify invitation guest session from JWT cookie
 * Returns invitation user if valid, null otherwise
 */
export async function verifyInvitationAuth(): Promise<{
  success: boolean;
  user?: InvitationUser;
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("invitation_session");

    if (!session) {
      return { success: false, error: "no-session" };
    }

    const JWT_SECRET = getJwtSecret();
    const SECURITY_CONFIG = getSecurityConfig();

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(session.value, secret, {
      issuer: SECURITY_CONFIG.JWT_ISSUER,
      audience: SECURITY_CONFIG.JWT_INVITATION_AUDIENCE,
      algorithms: [SECURITY_CONFIG.JWT_ALGORITHM],
    });

    // Verify JWT claims
    if (
      payload.iss !== SECURITY_CONFIG.JWT_ISSUER ||
      payload.aud !== SECURITY_CONFIG.JWT_INVITATION_AUDIENCE
    ) {
      return { success: false, error: "invalid-claims" };
    }

    // Validate invitation token exists and is active
    const validation = await validateToken(payload.tokenId as string);

    if (!validation.valid || !validation.invitation) {
      return { success: false, error: "invalid-token" };
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
        respondedAt: validation.invitation.respondedAt || undefined,
      },
    };
  } catch (error) {
    // Error during invitation auth verification
    logError("Error verifying invitation auth", error);
    return { success: false, error: "verification-error" };
  }
}

/**
 * Helper: Validate invitation token exists and is active
 */
async function validateToken(tokenId: string) {
  try {
    const invitationToken = await prisma.invitationToken.findUnique({
      where: { id: tokenId },
      include: { invitation: true },
    });

    if (!invitationToken || !invitationToken.isActive) {
      return { valid: false };
    }

    // Check expiration
    if (invitationToken.expiresAt && new Date() > invitationToken.expiresAt) {
      return { valid: false };
    }

    return {
      valid: true,
      invitation: invitationToken.invitation,
    };
  } catch (error) {
    logError("Error validating token", error);
    return { valid: false };
  }
}

/**
 * Wrapper to protect invitation guest server actions
 * Verifies JWT session and extracts invitation user
 */
export function withInvitationAuth<T extends any[], R>(
  action: (user: InvitationUser, ...args: T) => Promise<R>,
) {
  return async (...args: T): Promise<R> => {
    const authResult = await verifyInvitationAuth();

    if (!authResult.success || !authResult.user) {
      throw new Error("Unauthorized: No valid invitation session");
    }

    return action(authResult.user, ...args);
  };
}
