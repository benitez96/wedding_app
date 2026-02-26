"use server";

import prisma from "@/lib/prisma";
import * as jose from "jose";
import { cookies } from "next/headers";
import { getJwtSecret, getSecurityConfig } from "@/lib/config";
import { logError } from "@/lib/logger";

/**
 * Get current invitation guest user from session
 */
export async function getCurrentUser() {
  try {
    // Load config once
    const JWT_SECRET = getJwtSecret();
    const SECURITY_CONFIG = getSecurityConfig();

    const cookieStore = await cookies();
    const session = cookieStore.get("invitation_session");

    if (!session) {
      return { success: false, user: null };
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(session.value, secret, {
      issuer: SECURITY_CONFIG.JWT_ISSUER,
      audience: SECURITY_CONFIG.JWT_INVITATION_AUDIENCE,
      algorithms: [SECURITY_CONFIG.JWT_ALGORITHM],
    });

    // Verify claims
    if (
      payload.iss !== SECURITY_CONFIG.JWT_ISSUER ||
      payload.aud !== SECURITY_CONFIG.JWT_INVITATION_AUDIENCE
    ) {
      return { success: false, user: null };
    }

    // Get token and invitation (no state validation needed - user already has valid JWT session)
    // The JWT itself proves the token was valid when the session was created
    const token = await prisma.invitationToken.findUnique({
      where: { id: payload.tokenId as string },
      include: { invitation: true },
    });

    if (!token || !token.invitation) {
      return { success: false, user: null };
    }

    return {
      success: true,
      user: {
        invitationId: payload.invitationId,
        tokenId: payload.tokenId,
        eventId: token.invitation.eventId,
        guestName: token.invitation.guestName,
        guestNickname: token.invitation.guestNickname,
        maxGuests: token.invitation.maxGuests,
        hasResponded: token.invitation.hasResponded,
        isAttending: token.invitation.isAttending,
        guestCount: token.invitation.guestCount,
        respondedAt: token.invitation.respondedAt,
      },
    };
  } catch (error) {
    logError("Error getting current user", error);
    return { success: false, user: null };
  }
}
