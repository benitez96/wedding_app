"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import * as jose from "jose";
import { headers, cookies } from "next/headers";
import crypto from "crypto";
import { JWT_SECRET, SECURITY_CONFIG } from "@/lib/config";
import { tokenSchema, validateAndSanitize } from "@/utils/validation";
import { getClientIP, recordAttempt } from "@/lib/rate-limiter";
import { logError } from "@/lib/logger";

/**
 * Helper: Validate invitation token exists and is active
 */
async function validateToken(tokenId: string) {
  const token = await prisma.invitationToken.findUnique({
    where: { id: tokenId },
    include: { invitation: true },
  });

  if (!token || !token.isActive) {
    return { valid: false, error: "Token invalid or revoked" };
  }

  if (!token.invitation) {
    return { valid: false, error: "Invitation not found" };
  }

  return { valid: true, token, invitation: token.invitation };
}

/**
 * Process invitation token: validate and create JWT session
 * Public action - no auth required
 */
export async function processInvitationToken(token: string) {
  try {
    // Validate token format
    const tokenValidation = validateAndSanitize(tokenSchema, token);
    if (!tokenValidation.success) {
      return { success: false, action: "error", error: "invalid-token" };
    }

    // Check rate limiting
    const clientIP = await getClientIP();
    const rateLimitResult = await recordAttempt(
      clientIP,
      "invitation-token",
      false,
    );

    if (!rateLimitResult.allowed) {
      return {
        success: false,
        action: "error",
        error: "rate-limit-exceeded",
        blockedUntil: rateLimitResult.blockedUntil,
      };
    }

    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "Unknown";
    const cookieStore = await cookies();
    const session = cookieStore.get("session");

    // If user already has session, check if it's the same token
    if (session) {
      try {
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
          throw new Error("Invalid JWT claims");
        }

        // If same token, just redirect
        if (payload.tokenId === token) {
          return { success: true, action: "redirect" };
        }
      } catch (jwtError) {
        // Invalid session, continue with new token
      }
    }

    // Lookup token in database
    const validatedToken = (tokenValidation as { success: true; data: string })
      .data;
    const invitationToken = await prisma.invitationToken.findUnique({
      where: { id: validatedToken },
      include: { invitation: true },
    });

    if (!invitationToken || !invitationToken.isActive) {
      await recordAttempt(clientIP, "invitation-token", false);
      return { success: false, action: "error", error: "invalid-token" };
    }

    if (invitationToken.isUsed) {
      await recordAttempt(clientIP, "invitation-token", false);
      return { success: false, action: "error", error: "token-already-used" };
    }

    // Mark token as used
    await prisma.invitationToken.update({
      where: { id: validatedToken },
      data: {
        isUsed: true,
        userAgent,
      },
    });

    // Create JWT session for guest
    const secret = new TextEncoder().encode(JWT_SECRET);
    const sessionToken = await new jose.SignJWT({
      tokenId: validatedToken,
      invitationId: invitationToken.invitation.id,
      iss: SECURITY_CONFIG.JWT_ISSUER,
      aud: SECURITY_CONFIG.JWT_INVITATION_AUDIENCE,
      sub: invitationToken.invitation.id,
      createdAt: Date.now(),
    })
      .setProtectedHeader({
        alg: SECURITY_CONFIG.JWT_ALGORITHM,
        typ: "JWT",
      })
      .setIssuedAt()
      .setNotBefore(new Date())
      .setExpirationTime(`${SECURITY_CONFIG.INVITATION_SESSION_DURATION}s`)
      .setJti(crypto.randomUUID())
      .sign(secret);

    // Set HTTP-only cookie with guest session
    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: SECURITY_CONFIG.COOKIE_SECURE,
      sameSite: SECURITY_CONFIG.COOKIE_SAME_SITE,
      maxAge: SECURITY_CONFIG.INVITATION_SESSION_DURATION,
    });

    // Log successful token use
    await recordAttempt(clientIP, "invitation-token", true);

    return {
      success: true,
      action: "authenticated",
    };
  } catch (error) {
    logError("Error processing invitation token", error);
    return { success: false, action: "error", error: "error-processing-token" };
  }
}

/**
 * Get current invitation guest user from session
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session");

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

    // Validate token exists and is active
    const validation = await validateToken(payload.tokenId as string);

    if (!validation.valid || !validation.invitation) {
      return { success: false, user: null };
    }

    return {
      success: true,
      user: {
        invitationId: payload.invitationId,
        tokenId: payload.tokenId,
        eventId: validation.invitation.eventId,
        guestName: validation.invitation.guestName,
        guestNickname: validation.invitation.guestNickname,
        maxGuests: validation.invitation.maxGuests,
        hasResponded: validation.invitation.hasResponded,
        isAttending: validation.invitation.isAttending,
        guestCount: validation.invitation.guestCount,
        respondedAt: validation.invitation.respondedAt,
      },
    };
  } catch (error) {
    logError("Error getting current user", error);
    return { success: false, user: null };
  }
}

// Re-export protected invitation actions
import { updateInvitationResponse as protectedUpdateInvitationResponse } from "./protected-invitations";
export const updateInvitationResponse = protectedUpdateInvitationResponse;
