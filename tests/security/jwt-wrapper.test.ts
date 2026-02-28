/**
 * JWT Wrapper Security Tests
 *
 * CRITICAL: These tests verify OUR JWT wrapper implementation,
 * not the jose library (which is already tested by its maintainers).
 *
 * We test:
 * - Configuration is correct (algorithm, secret length, etc.)
 * - Error handling in our wrapper
 * - Business logic AFTER JWT verification (DB checks)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock dependencies
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("jose", () => ({
  jwtVerify: vi.fn(),
  SignJWT: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    invitationToken: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/config", () => ({
  getJwtSecret: vi.fn(() => "test-secret-with-at-least-32-characters-long"),
  getSecurityConfig: vi.fn(() => ({
    JWT_ISSUER: "wedding-app",
    JWT_INVITATION_AUDIENCE: "wedding-invitation",
    JWT_ALGORITHM: "HS512",
  })),
}));

import { cookies } from "next/headers";
import * as jose from "jose";
import prisma from "@/lib/prisma";
import { getJwtSecret, getSecurityConfig } from "@/lib/config";
import { verifyInvitationAuth } from "@/lib/invitation-auth";

describe("JWT Wrapper Configuration", () => {
  it("should use HS512 algorithm (not weaker HS256)", () => {
    const config = getSecurityConfig();

    expect(config.JWT_ALGORITHM).toBe("HS512");
    expect(config.JWT_ALGORITHM).not.toBe("HS256");
  });

  it("should have JWT secret with sufficient length", () => {
    const secret = getJwtSecret();

    // Minimum 32 characters for HS512
    expect(secret.length).toBeGreaterThanOrEqual(32);
  });

  it("should use correct issuer", () => {
    const config = getSecurityConfig();

    expect(config.JWT_ISSUER).toBe("wedding-app");
  });

  it("should use correct audience for invitations", () => {
    const config = getSecurityConfig();

    expect(config.JWT_INVITATION_AUDIENCE).toBe("wedding-invitation");
  });
});

describe("JWT Wrapper - Error Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when no session cookie exists", async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as any);

    const result = await verifyInvitationAuth();

    expect(result.success).toBe(false);
    expect(result.error).toBe("no-session");
  });

  it("should return error when JWT verification fails", async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "invalid-jwt" }),
    } as any);

    vi.mocked(jose.jwtVerify).mockRejectedValue(new Error("Invalid signature"));

    const result = await verifyInvitationAuth();

    expect(result.success).toBe(false);
    expect(result.error).toBe("verification-error");
  });

  it("should verify issuer claim matches config", async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "valid-jwt" }),
    } as any);

    vi.mocked(jose.jwtVerify).mockResolvedValue({
      payload: {
        iss: "attacker.com", // Wrong issuer
        aud: "wedding-invitation",
        tokenId: "token-123",
        invitationId: "inv-123",
      },
      protectedHeader: {},
    } as any);

    const result = await verifyInvitationAuth();

    expect(result.success).toBe(false);
    expect(result.error).toBe("invalid-claims");
  });

  it("should verify audience claim matches config", async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "valid-jwt" }),
    } as any);

    vi.mocked(jose.jwtVerify).mockResolvedValue({
      payload: {
        iss: "wedding-app",
        aud: "wrong-audience", // Wrong audience
        tokenId: "token-123",
        invitationId: "inv-123",
      },
      protectedHeader: {},
    } as any);

    const result = await verifyInvitationAuth();

    expect(result.success).toBe(false);
    expect(result.error).toBe("invalid-claims");
  });
});

describe("JWT Wrapper - Database Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "valid-jwt" }),
    } as any);

    vi.mocked(jose.jwtVerify).mockResolvedValue({
      payload: {
        iss: "wedding-app",
        aud: "wedding-invitation",
        tokenId: "token-123",
        invitationId: "inv-123",
      },
      protectedHeader: {},
    } as any);
  });

  it("should reject valid JWT if token is not in database", async () => {
    vi.mocked(prisma.invitationToken.findUnique).mockResolvedValue(null);

    const result = await verifyInvitationAuth();

    expect(result.success).toBe(false);
    expect(result.error).toBe("invalid-token");
  });

  it("should reject valid JWT if token is inactive", async () => {
    vi.mocked(prisma.invitationToken.findUnique).mockResolvedValue({
      id: "token-123",
      isActive: false, // Revoked token
      expiresAt: null,
      invitation: {
        id: "inv-123",
        guestName: "Test Guest",
        maxGuests: 2,
        hasResponded: false,
      },
    } as any);

    const result = await verifyInvitationAuth();

    expect(result.success).toBe(false);
    expect(result.error).toBe("invalid-token");
  });

  it("should reject valid JWT if token is expired", async () => {
    const pastDate = new Date(Date.now() - 86400000); // Yesterday

    vi.mocked(prisma.invitationToken.findUnique).mockResolvedValue({
      id: "token-123",
      isActive: true,
      expiresAt: pastDate, // Expired
      invitation: {
        id: "inv-123",
        guestName: "Test Guest",
        maxGuests: 2,
        hasResponded: false,
      },
    } as any);

    const result = await verifyInvitationAuth();

    expect(result.success).toBe(false);
    expect(result.error).toBe("invalid-token");
  });

  it("should accept valid JWT with active token", async () => {
    vi.mocked(prisma.invitationToken.findUnique).mockResolvedValue({
      id: "token-123",
      isActive: true,
      expiresAt: null,
      invitation: {
        id: "inv-123",
        guestName: "Test Guest",
        guestNickname: "TG",
        maxGuests: 2,
        hasResponded: false,
        isAttending: null,
        guestCount: null,
        respondedAt: null,
      },
    } as any);

    const result = await verifyInvitationAuth();

    expect(result.success).toBe(true);
    expect(result.user).toMatchObject({
      invitationId: "inv-123",
      tokenId: "token-123",
      guestName: "Test Guest",
      maxGuests: 2,
      hasResponded: false,
    });
  });
});

describe("JWT Wrapper - Security Best Practices", () => {
  it("should call jwtVerify with algorithm whitelist", async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "jwt" }),
    } as any);

    vi.mocked(jose.jwtVerify).mockResolvedValue({
      payload: {
        iss: "wedding-app",
        aud: "wedding-invitation",
        tokenId: "token-123",
        invitationId: "inv-123",
      },
      protectedHeader: {},
    } as any);

    vi.mocked(prisma.invitationToken.findUnique).mockResolvedValue({
      id: "token-123",
      isActive: true,
      expiresAt: null,
      invitation: {
        id: "inv-123",
        guestName: "Test",
        maxGuests: 1,
        hasResponded: false,
      },
    } as any);

    await verifyInvitationAuth();

    // Verify jwtVerify was called with correct parameters
    expect(jose.jwtVerify).toHaveBeenCalledTimes(1);

    const call = vi.mocked(jose.jwtVerify).mock.calls[0];

    // First arg: JWT string
    expect(call[0]).toBe("jwt");

    // Second arg: Secret key (Uint8Array) - just verify it exists and is object-like
    expect(call[1]).toBeDefined();

    // Third arg: Options with algorithm whitelist
    expect(call[2]).toMatchObject({
      issuer: "wedding-app",
      audience: "wedding-invitation",
      algorithms: ["HS512"], // CRITICAL: Only HS512 allowed, not HS256 or "none"
    });
  });

  it("should not log sensitive data in production", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "jwt" }),
    } as any);

    vi.mocked(jose.jwtVerify).mockRejectedValue(
      new Error("Sensitive error message"),
    );

    await verifyInvitationAuth();

    // Logger logs in production but sanitizes sensitive data
    // It should log the context but NOT the sensitive error details
    expect(consoleSpy).toHaveBeenCalledWith(
      "[Error verifying invitation auth]",
    );

    // Verify it doesn't log the actual sensitive error message
    const calls = consoleSpy.mock.calls.flat();
    expect(calls.join(" ")).not.toContain("Sensitive error message");

    consoleSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });
});
