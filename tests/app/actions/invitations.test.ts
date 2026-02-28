/**
 * Tests for app/actions/invitations.ts
 *
 * Strategy: mock ALL I/O (prisma, jose, cookies, headers, rate-limiter)
 * and test only the branching logic of processInvitationToken and getCurrentUser.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("next/headers", () => ({
  headers: vi.fn(),
  cookies: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("jose", () => ({
  jwtVerify: vi.fn(),
  // SignJWT placeholder — real implementation installed in beforeEach
  SignJWT: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    invitationToken: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/config", () => ({
  getJwtSecret: vi.fn(() => "test-jwt-secret-with-at-least-32-characters!!"),
  getSecurityConfig: vi.fn(() => ({
    JWT_ISSUER: "wedding-app",
    JWT_INVITATION_AUDIENCE: "wedding-invitation",
    JWT_ALGORITHM: "HS512",
    COOKIE_SECURE: false,
    COOKIE_SAME_SITE: "lax",
    INVITATION_SESSION_DURATION: 15552000,
  })),
}));

vi.mock("@/lib/rate-limiter-prisma", () => ({
  getClientIP: vi.fn(() => Promise.resolve("127.0.0.1")),
  recordAttempt: vi.fn(() =>
    Promise.resolve({ allowed: true, remainingAttempts: 9 }),
  ),
}));

vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
}));

// ── Imports after mocks ───────────────────────────────────────────────────────

import { headers, cookies } from "next/headers";
import * as jose from "jose";
import prisma from "@/lib/prisma";
import { recordAttempt } from "@/lib/rate-limiter-prisma";
import {
  processInvitationToken,
  getCurrentUser,
} from "@/app/actions/invitations/";

// ── Helpers ───────────────────────────────────────────────────────────────────

const VALID_TOKEN = "valid-token-abc123";

/** Build a mock cookie store */
function makeCookieStore(sessionValue?: string) {
  return {
    get: vi.fn((name: string) =>
      name === "invitation_session" && sessionValue
        ? { value: sessionValue }
        : undefined,
    ),
    set: vi.fn(),
  };
}

/** Build a mock headers object */
function makeHeaders(userAgent = "Test Browser") {
  return {
    get: vi.fn((name: string) => (name === "user-agent" ? userAgent : null)),
  };
}

/** Build a valid DB token record */
function makeDbToken(overrides: Record<string, unknown> = {}) {
  return {
    id: VALID_TOKEN,
    isActive: true,
    isUsed: false,
    expiresAt: null,
    userAgent: null,
    invitation: {
      id: "invitation-123",
      eventId: "event-456",
      guestName: "Jane Doe",
      guestNickname: "Janie",
      maxGuests: 4,
      hasResponded: false,
      isAttending: null,
      guestCount: null,
      respondedAt: null,
    },
    ...overrides,
  };
}

// ── processInvitationToken ────────────────────────────────────────────────────

/** Reinstall SignJWT mock — must be called after vi.clearAllMocks().
 *  IMPORTANT: Must use a regular function (not arrow) so it can be called with `new`.
 *  The constructor returns a fluent chain object; each builder method returns `this`.
 */
function installSignJwtMock() {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  vi.mocked(jose.SignJWT).mockImplementation(function (this: any) {
    this.sign = vi.fn(() => Promise.resolve("signed.jwt.token"));
    const methods = [
      "setProtectedHeader",
      "setSubject",
      "setIssuer",
      "setAudience",
      "setIssuedAt",
      "setNotBefore",
      "setExpirationTime",
      "setJti",
    ];
    methods.forEach((m) => {
      this[m] = vi.fn(() => this);
    });
    return this;
  } as any);
}

describe("processInvitationToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // SignJWT implementation must be reinstalled after clearAllMocks
    installSignJwtMock();
    // Default mocks for happy path
    vi.mocked(headers).mockResolvedValue(makeHeaders() as any);
    vi.mocked(cookies).mockResolvedValue(makeCookieStore() as any);
    vi.mocked(prisma.invitationToken.findUnique).mockResolvedValue(
      makeDbToken() as any,
    );
    vi.mocked(prisma.invitationToken.update).mockResolvedValue({} as any);
    // Mock updateMany for atomic token usage (race condition fix)
    vi.mocked(prisma.invitationToken.updateMany).mockResolvedValue({
      count: 1,
    } as any);
    vi.mocked(recordAttempt).mockResolvedValue({
      allowed: true,
      remainingAttempts: 9,
    });
  });

  describe("token format validation", () => {
    it("returns invalid-token for empty string", async () => {
      const result = await processInvitationToken("");
      expect(result).toEqual({
        success: false,
        action: "error",
        error: "invalid-token",
      });
    });

    it("returns invalid-token for token with special chars", async () => {
      const result = await processInvitationToken("bad token!!!");
      expect(result).toEqual({
        success: false,
        action: "error",
        error: "invalid-token",
      });
    });

    it("returns invalid-token for token exceeding 100 chars", async () => {
      const longToken = "a".repeat(101);
      const result = await processInvitationToken(longToken);
      expect(result).toEqual({
        success: false,
        action: "error",
        error: "invalid-token",
      });
    });
  });

  describe("rate limiting", () => {
    it("returns rate-limit-exceeded when rate limiter blocks", async () => {
      const blockedUntil = new Date(Date.now() + 60000);
      vi.mocked(recordAttempt).mockResolvedValueOnce({
        allowed: false,
        remainingAttempts: 0,
        blockedUntil,
      });

      const result = await processInvitationToken(VALID_TOKEN);
      expect(result).toEqual({
        success: false,
        action: "error",
        error: "rate-limit-exceeded",
        blockedUntil,
      });
    });
  });

  describe("existing session handling", () => {
    it("returns redirect when valid session matches same token", async () => {
      vi.mocked(cookies).mockResolvedValue(
        makeCookieStore("existing.jwt.session") as any,
      );

      vi.mocked(jose.jwtVerify).mockResolvedValue({
        payload: {
          iss: "wedding-app",
          aud: "wedding-invitation",
          tokenId: VALID_TOKEN, // same token
        },
        protectedHeader: {},
      } as any);

      const result = await processInvitationToken(VALID_TOKEN);
      expect(result).toEqual({ success: true, action: "redirect" });
    });

    it("continues with new token when session has different token", async () => {
      vi.mocked(cookies).mockResolvedValue(
        makeCookieStore("other.jwt.session") as any,
      );

      vi.mocked(jose.jwtVerify).mockResolvedValue({
        payload: {
          iss: "wedding-app",
          aud: "wedding-invitation",
          tokenId: "different-token", // different token
        },
        protectedHeader: {},
      } as any);

      const result = await processInvitationToken(VALID_TOKEN);
      // Should complete the full flow (authenticated)
      expect(result).toEqual({ success: true, action: "authenticated" });
    });

    it("continues when existing session JWT is invalid", async () => {
      vi.mocked(cookies).mockResolvedValue(
        makeCookieStore("malformed.jwt") as any,
      );

      vi.mocked(jose.jwtVerify).mockRejectedValueOnce(new Error("Invalid JWT"));

      const result = await processInvitationToken(VALID_TOKEN);
      expect(result).toEqual({ success: true, action: "authenticated" });
    });
  });

  describe("token not found in DB", () => {
    it("returns invalid-token when token does not exist", async () => {
      vi.mocked(prisma.invitationToken.findUnique).mockResolvedValue(null);

      const result = await processInvitationToken(VALID_TOKEN);
      expect(result).toEqual({
        success: false,
        action: "error",
        error: "invalid-token",
      });
    });
  });

  describe("token state validation", () => {
    it("returns token-already-used when token.isUsed is true", async () => {
      vi.mocked(prisma.invitationToken.findUnique).mockResolvedValue(
        makeDbToken({ isUsed: true }) as any,
      );

      const result = await processInvitationToken(VALID_TOKEN);
      expect(result).toEqual({
        success: false,
        action: "error",
        error: "token-already-used",
      });
    });

    it("returns token-already-used when updateMany returns 0 (race condition)", async () => {
      // Token appears valid on read, but another concurrent request already used it
      vi.mocked(prisma.invitationToken.findUnique).mockResolvedValue(
        makeDbToken({ isUsed: false }) as any,
      );

      // Atomic update returns count=0 (no rows updated)
      vi.mocked(prisma.invitationToken.updateMany).mockResolvedValue({
        count: 0,
      } as any);

      const result = await processInvitationToken(VALID_TOKEN);
      expect(result).toEqual({
        success: false,
        action: "error",
        error: "token-already-used",
      });
    });

    it("returns token-expired when token has past expiration", async () => {
      const yesterday = new Date(Date.now() - 86400000);
      vi.mocked(prisma.invitationToken.findUnique).mockResolvedValue(
        makeDbToken({ expiresAt: yesterday }) as any,
      );

      const result = await processInvitationToken(VALID_TOKEN);
      expect(result).toEqual({
        success: false,
        action: "error",
        error: "token-expired",
      });
    });

    it("returns invalid-token when token.isActive is false", async () => {
      vi.mocked(prisma.invitationToken.findUnique).mockResolvedValue(
        makeDbToken({ isActive: false }) as any,
      );

      const result = await processInvitationToken(VALID_TOKEN);
      expect(result).toEqual({
        success: false,
        action: "error",
        error: "invalid-token",
      });
    });
  });

  describe("happy path", () => {
    it("returns authenticated and marks token as used", async () => {
      const result = await processInvitationToken(VALID_TOKEN);

      expect(result).toEqual({ success: true, action: "authenticated" });
      // Verify atomic updateMany (race condition fix)
      expect(prisma.invitationToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: VALID_TOKEN, isUsed: false },
          data: expect.objectContaining({ isUsed: true }),
        }),
      );
    });

    it("sets invitation_session cookie", async () => {
      const cookieStore = makeCookieStore();
      vi.mocked(cookies).mockResolvedValue(cookieStore as any);

      await processInvitationToken(VALID_TOKEN);

      expect(cookieStore.set).toHaveBeenCalledWith(
        "invitation_session",
        expect.any(String),
        expect.objectContaining({ httpOnly: true }),
      );
    });

    it("records a successful rate limit attempt", async () => {
      await processInvitationToken(VALID_TOKEN);

      // Last recordAttempt call should be with success=true
      const calls = vi.mocked(recordAttempt).mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall![2]).toBe(true);
    });

    it("accepts token with future expiration", async () => {
      const tomorrow = new Date(Date.now() + 86400000);
      vi.mocked(prisma.invitationToken.findUnique).mockResolvedValue(
        makeDbToken({ expiresAt: tomorrow }) as any,
      );

      const result = await processInvitationToken(VALID_TOKEN);
      expect(result).toEqual({ success: true, action: "authenticated" });
    });
  });

  describe("error handling", () => {
    it("returns error-processing-token on unexpected DB error", async () => {
      vi.mocked(prisma.invitationToken.findUnique).mockRejectedValue(
        new Error("DB connection error"),
      );

      const result = await processInvitationToken(VALID_TOKEN);
      expect(result).toEqual({
        success: false,
        action: "error",
        error: "error-processing-token",
      });
    });
  });
});

// ── getCurrentUser ────────────────────────────────────────────────────────────

describe("getCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue(makeCookieStore() as any);
  });

  it("returns { success: false, user: null } when no session cookie", async () => {
    vi.mocked(cookies).mockResolvedValue(makeCookieStore() as any); // no session

    const result = await getCurrentUser();
    expect(result).toEqual({ success: false, user: null });
  });

  it("returns { success: false, user: null } when JWT is invalid", async () => {
    vi.mocked(cookies).mockResolvedValue(
      makeCookieStore("invalid.jwt.token") as any,
    );
    vi.mocked(jose.jwtVerify).mockRejectedValue(new Error("Invalid JWT"));

    const result = await getCurrentUser();
    expect(result).toEqual({ success: false, user: null });
  });

  it("returns { success: false, user: null } when token not found in DB", async () => {
    vi.mocked(cookies).mockResolvedValue(makeCookieStore("valid.jwt") as any);
    vi.mocked(jose.jwtVerify).mockResolvedValue({
      payload: {
        iss: "wedding-app",
        aud: "wedding-invitation",
        tokenId: "token-123",
        invitationId: "invitation-123",
      },
      protectedHeader: {},
    } as any);
    vi.mocked(prisma.invitationToken.findUnique).mockResolvedValue(null);

    const result = await getCurrentUser();
    expect(result).toEqual({ success: false, user: null });
  });

  it("returns user data on valid session", async () => {
    vi.mocked(cookies).mockResolvedValue(makeCookieStore("valid.jwt") as any);
    vi.mocked(jose.jwtVerify).mockResolvedValue({
      payload: {
        iss: "wedding-app",
        aud: "wedding-invitation",
        tokenId: "token-123",
        invitationId: "invitation-123",
      },
      protectedHeader: {},
    } as any);
    vi.mocked(prisma.invitationToken.findUnique).mockResolvedValue(
      makeDbToken({ id: "token-123" }) as any,
    );

    const result = await getCurrentUser();

    expect(result.success).toBe(true);
    expect(result.user).toMatchObject({
      invitationId: "invitation-123",
      tokenId: "token-123",
      guestName: "Jane Doe",
      maxGuests: 4,
      hasResponded: false,
    });
  });

  it("returns { success: false, user: null } on DB error", async () => {
    vi.mocked(cookies).mockResolvedValue(makeCookieStore("valid.jwt") as any);
    vi.mocked(jose.jwtVerify).mockResolvedValue({
      payload: {
        iss: "wedding-app",
        aud: "wedding-invitation",
        tokenId: "token-123",
        invitationId: "invitation-123",
      },
      protectedHeader: {},
    } as any);
    vi.mocked(prisma.invitationToken.findUnique).mockRejectedValue(
      new Error("DB error"),
    );

    const result = await getCurrentUser();
    expect(result).toEqual({ success: false, user: null });
  });
});
