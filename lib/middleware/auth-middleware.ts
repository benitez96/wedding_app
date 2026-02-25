/**
 * Authentication and Authorization middleware helpers
 *
 * Centralized logic for API route protection to avoid code duplication
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hasPermission, PERMISSIONS, type Permission } from "@/lib/permissions";

interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
  };
}

interface AuthCheckResult {
  authorized: true;
  session: AuthSession;
  isOwner: boolean;
}

interface AuthCheckError {
  authorized: false;
  response: NextResponse;
}

type AuthCheckResponse = AuthCheckResult | AuthCheckError;

/**
 * Check authentication + event-level permissions
 *
 * Validates:
 * 1. User is authenticated
 * 2. Event exists
 * 3. User is owner OR has required permission
 *
 * @param request - Next.js request object
 * @param eventId - Event ID to check permissions for
 * @param requiredPermission - Permission required (defaults to CHECKIN_SCAN)
 * @returns AuthCheckResult if authorized, or NextResponse error if not
 *
 * @example
 * ```typescript
 * const authCheck = await checkEventPermission(request, eventId);
 * if (!authCheck.authorized) return authCheck.response;
 *
 * const { session, isOwner } = authCheck;
 * // Proceed with authorized operation
 * ```
 */
export async function checkEventPermission(
  request: NextRequest,
  eventId: string,
  requiredPermission: Permission = PERMISSIONS.CHECKIN_SCAN,
): Promise<AuthCheckResponse> {
  // 1. Check authentication
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 },
      ),
    };
  }

  // 2. Check event exists
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      ownerId: true,
    },
  });

  if (!event) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: "Evento no encontrado" },
        { status: 404 },
      ),
    };
  }

  // 3. Check if user is owner
  const isOwner = event.ownerId === session.user.id;

  if (isOwner) {
    // Owner has automatic access
    return {
      authorized: true,
      session: session as AuthSession,
      isOwner: true,
    };
  }

  // 4. Check member permissions
  const member = await prisma.eventMember.findUnique({
    where: {
      eventId_userId: {
        eventId,
        userId: session.user.id,
      },
    },
  });

  if (!member || !hasPermission(member.permissions, requiredPermission)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: "Sin permisos para esta acción" },
        { status: 403 },
      ),
    };
  }

  // 5. Authorized as member
  return {
    authorized: true,
    session: session as AuthSession,
    isOwner: false,
  };
}

/**
 * Check authentication + invitation-level permissions
 *
 * Validates:
 * 1. User is authenticated
 * 2. Invitation exists
 * 3. User is event owner OR has required permission
 *
 * @param request - Next.js request object
 * @param invitationId - Invitation ID to check permissions for
 * @param requiredPermission - Permission required (defaults to CHECKIN_SCAN)
 * @returns AuthCheckResult if authorized, or NextResponse error if not
 *
 * @example
 * ```typescript
 * const authCheck = await checkInvitationPermission(request, invitationId);
 * if (!authCheck.authorized) return authCheck.response;
 *
 * const { session, isOwner, invitation } = authCheck;
 * // Proceed with authorized operation
 * ```
 */
export async function checkInvitationPermission(
  request: NextRequest,
  invitationId: string,
  requiredPermission: Permission = PERMISSIONS.CHECKIN_SCAN,
): Promise<
  (AuthCheckResult & { invitation: InvitationWithEvent }) | AuthCheckError
> {
  // 1. Check authentication
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 },
      ),
    };
  }

  // 2. Fetch invitation with event data
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    include: {
      event: {
        select: {
          id: true,
          ownerId: true,
        },
      },
    },
  });

  if (!invitation) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: "Invitación no encontrada" },
        { status: 404 },
      ),
    };
  }

  // 3. Check if user is owner
  const isOwner = invitation.event.ownerId === session.user.id;

  if (isOwner) {
    // Owner has automatic access
    return {
      authorized: true,
      session: session as AuthSession,
      isOwner: true,
      invitation,
    };
  }

  // 4. Check member permissions
  const member = await prisma.eventMember.findUnique({
    where: {
      eventId_userId: {
        eventId: invitation.event.id,
        userId: session.user.id,
      },
    },
  });

  if (!member || !hasPermission(member.permissions, requiredPermission)) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          error: "Sin permisos para registrar check-ins",
        },
        { status: 403 },
      ),
    };
  }

  // 5. Authorized as member
  return {
    authorized: true,
    session: session as AuthSession,
    isOwner: false,
    invitation,
  };
}

/**
 * Type for invitation with event data (used in checkInvitationPermission)
 */
type InvitationWithEvent = {
  id: string;
  eventId: string;
  guestName: string;
  guestNickname: string | null;
  maxGuests: number;
  checkInCount: number;
  lastCheckInAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  event: {
    id: string;
    ownerId: string;
  };
};

/**
 * Simple authentication check (no permissions)
 *
 * Use when you only need to verify user is logged in
 *
 * @param request - Next.js request object
 * @returns Session if authenticated, or NextResponse error
 *
 * @example
 * ```typescript
 * const authCheck = await requireAuth(request);
 * if (!authCheck.authorized) return authCheck.response;
 *
 * const { session } = authCheck;
 * ```
 */
export async function requireAuth(
  request: NextRequest,
): Promise<{ authorized: true; session: AuthSession } | AuthCheckError> {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 },
      ),
    };
  }

  return {
    authorized: true,
    session: session as AuthSession,
  };
}
