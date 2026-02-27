"use server";

import prisma from "@/lib/prisma";
import * as jose from "jose";
import { headers, cookies } from "next/headers";
import crypto from "crypto";
import { getJwtSecret, getSecurityConfig } from "@/lib/config";
import { tokenSchema, validateAndSanitize } from "@/utils/validation";
import { getClientIP, recordAttempt } from "@/lib/rate-limiter-prisma";
import { logError } from "@/lib/logger";
import { validateTokenState } from "@/lib/invitation-tokens";

/**
 * Process invitation token: validate and create JWT session
 * Public action - no auth required
 *
 * Error codes returned to the client (TODO i18n: map these to user-facing messages):
 *   "invalid-token" | "rate-limit-exceeded" | "token-already-used" |
 *   "token-expired" | "error-processing-token"
 */
export async function processInvitationToken(token: string) {
  try {
    // Load config once
    const JWT_SECRET = getJwtSecret();
    const SECURITY_CONFIG = getSecurityConfig();

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

    if (!invitationToken) {
      await recordAttempt(clientIP, "invitation-token", false);
      return { success: false, action: "error", error: "invalid-token" };
    }

    // Use pure validation logic
    const tokenStateValidation = validateTokenState({
      isActive: invitationToken.isActive,
      isUsed: invitationToken.isUsed,
      expiresAt: invitationToken.expiresAt,
    });

    if (!tokenStateValidation.valid) {
      await recordAttempt(clientIP, "invitation-token", false);
      const errorCode = tokenStateValidation.reason?.includes("already used")
        ? "token-already-used"
        : tokenStateValidation.reason?.includes("expired")
          ? "token-expired"
          : "invalid-token";
      return { success: false, action: "error", error: errorCode };
    }

    // Create JWT session for guest (tokenId = the crypto-secure id)
    // IMPORTANT: Create session BEFORE marking token as used to avoid burning token on errors
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

    // Mark token as used ONLY after session is successfully created
    // This prevents burning tokens on JWT creation errors
    // SECURITY: Use atomic update to prevent race condition (concurrent token usage)
    const updateResult = await prisma.invitationToken.updateMany({
      where: {
        id: validatedToken,
        isUsed: false, // Only update if not already used (atomic check-and-set)
      },
      data: {
        isUsed: true,
        userAgent,
      },
    });

    // If no rows were updated, token was already used by concurrent request
    if (updateResult.count === 0) {
      await recordAttempt(clientIP, "invitation-token", false);
      return { success: false, action: "error", error: "token-already-used" };
    }

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
