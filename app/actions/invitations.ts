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

  if (token.expiresAt && new Date() > token.expiresAt) {
    return { valid: false, error: "Token expired" };
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
    const session = cookieStore.get("invitation_session");

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

        // If same token ID, just redirect (id IS the token now)
        if (payload.tokenId === token) {
          return { success: true, action: "redirect" };
        }
      } catch (jwtError) {
        // Invalid session, continue with new token
      }
    }

    // Lookup token in database by id (the id IS the token in the URL)
    const validatedToken = tokenValidation.data;
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

    // Check expiration
    if (invitationToken.expiresAt && new Date() > invitationToken.expiresAt) {
      await recordAttempt(clientIP, "invitation-token", false);
      return { success: false, action: "error", error: "token-expired" };
    }

    // Mark token as used
    await prisma.invitationToken.update({
      where: { id: validatedToken },
      data: {
        isUsed: true,
        userAgent,
      },
    });

    // Create JWT session for guest (tokenId = the crypto-secure id)
    const secret = new TextEncoder().encode(JWT_SECRET);
    const sessionToken = await new jose.SignJWT({
      tokenId: invitationToken.id,
      invitationId: invitationToken.invitation.id,
      createdAt: Date.now(),
    })
      .setProtectedHeader({
        alg: SECURITY_CONFIG.JWT_ALGORITHM,
        typ: "JWT",
      })
      .setSubject(invitationToken.invitation.id)
      .setIssuer(SECURITY_CONFIG.JWT_ISSUER)
      .setAudience(SECURITY_CONFIG.JWT_INVITATION_AUDIENCE)
      .setIssuedAt()
      .setNotBefore(new Date())
      .setExpirationTime(`${SECURITY_CONFIG.INVITATION_SESSION_DURATION}s`)
      .setJti(crypto.randomUUID())
      .sign(secret);

    // Set HTTP-only cookie with guest session
    // SECURITY: Use specific cookie name to avoid collision with Better Auth's session
    cookieStore.set("invitation_session", sessionToken, {
      httpOnly: true,
      secure: SECURITY_CONFIG.COOKIE_SECURE,
      sameSite: SECURITY_CONFIG.COOKIE_SAME_SITE,
      maxAge: SECURITY_CONFIG.INVITATION_SESSION_DURATION,
      path: "/",
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
