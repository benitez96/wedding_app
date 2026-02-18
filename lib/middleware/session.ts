/**
 * Session helpers for middleware.
 *
 * Two independent session systems coexist in this app:
 *
 *  1. Better Auth (backoffice users)
 *     Cookie name resolved via `getSessionCookie()` from `better-auth/cookies`.
 *     The cookie payload is a signed/cached compact JWT — no DB call needed.
 *
 *  2. Invitation JWT (`invitation_session`)
 *     A custom HTTP-only JWT issued by `processInvitationToken()` in
 *     app/actions/invitations.ts. Public guests use this to access their
 *     personal invitation page.
 *
 * The middleware only checks for cookie *presence* — no DB or fetch call.
 * Real validation (expiry, DB lookup) happens inside server actions and
 * API routes via `auth.api.getSession()` or `getCurrentUser()`.
 *
 * Why no self-fetch? Calling /api/auth/get-session from inside the middleware
 * causes an infinite redirect loop: the request goes through middleware again,
 * which calls the API, which goes through middleware, etc.
 *
 * Ref: https://www.better-auth.com/docs/integrations/next
 */

import { getSessionCookie } from "better-auth/cookies";
import type { NextRequest } from "next/server";

export interface SessionPresence {
  /** Better Auth session cookie is present. */
  hasBackofficeSession: boolean;
  /** Invitation JWT cookie is present. */
  hasInvitationSession: boolean;
  /** Either session type is present. */
  hasAnySession: boolean;
}

export function getSessionPresence(request: NextRequest): SessionPresence {
  const backofficeSession = getSessionCookie(request);
  const invitationSession = request.cookies.get("invitation_session");

  return {
    hasBackofficeSession: Boolean(backofficeSession),
    hasInvitationSession: Boolean(invitationSession),
    hasAnySession: Boolean(backofficeSession ?? invitationSession),
  };
}
