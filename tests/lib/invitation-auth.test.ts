/**
 * Tests for lib/invitation-auth.ts
 *
 * CRITICAL: Only testing withInvitationAuth wrapper logic
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { InvitationUser } from "@/lib/invitation-auth";

// Mock dependencies
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("jose", () => ({
  jwtVerify: vi.fn(),
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

// Import mocked dependencies
import { cookies } from "next/headers";
import * as jose from "jose";
import prisma from "@/lib/prisma";

// Import function under test
import { withInvitationAuth } from "@/lib/invitation-auth";

describe("invitation-auth", () => {
  const mockInvitationUser: InvitationUser = {
    invitationId: "invitation-123",
    tokenId: "token-123",
    guestName: "John Doe",
    guestNickname: "Johnny",
    maxGuests: 2,
    hasResponded: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("withInvitationAuth", () => {
    it("should call action with invitation user if authenticated", async () => {
      // Mock cookies
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({
          value: "valid-jwt-token",
        }),
      } as any);

      // Mock JWT verification
      vi.mocked(jose.jwtVerify).mockResolvedValue({
        payload: {
          iss: "wedding-app",
          aud: "wedding-invitation",
          invitationId: "invitation-123",
          tokenId: "token-123",
        },
        protectedHeader: {},
      } as any);

      // Mock Prisma token validation
      vi.mocked(prisma.invitationToken.findUnique).mockResolvedValue({
        id: "token-123",
        isActive: true,
        expiresAt: null,
        invitation: {
          id: "invitation-123",
          guestName: "John Doe",
          guestNickname: "Johnny",
          maxGuests: 2,
          hasResponded: false,
          isAttending: null,
          guestCount: null,
          respondedAt: null,
        },
      } as any);

      const mockAction = vi.fn().mockResolvedValue({ success: true });
      const wrappedAction = withInvitationAuth(mockAction);

      const result = await wrappedAction("arg1", "arg2");

      expect(mockAction).toHaveBeenCalledWith(
        expect.objectContaining({
          invitationId: "invitation-123",
          tokenId: "token-123",
          guestName: "John Doe",
          maxGuests: 2,
        }),
        "arg1",
        "arg2",
      );
      expect(result).toEqual({ success: true });
    });

    it("should throw error if no session cookie", async () => {
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
      } as any);

      const mockAction = vi.fn();
      const wrappedAction = withInvitationAuth(mockAction);

      await expect(wrappedAction()).rejects.toThrow(
        "Unauthorized: No valid invitation session",
      );
      expect(mockAction).not.toHaveBeenCalled();
    });

    it("should throw error if JWT verification fails", async () => {
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({
          value: "invalid-jwt-token",
        }),
      } as any);

      vi.mocked(jose.jwtVerify).mockRejectedValue(new Error("Invalid JWT"));

      const mockAction = vi.fn();
      const wrappedAction = withInvitationAuth(mockAction);

      await expect(wrappedAction()).rejects.toThrow(
        "Unauthorized: No valid invitation session",
      );
      expect(mockAction).not.toHaveBeenCalled();
    });

    it("should throw error if token is not active", async () => {
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({
          value: "valid-jwt-token",
        }),
      } as any);

      vi.mocked(jose.jwtVerify).mockResolvedValue({
        payload: {
          iss: "wedding-app",
          aud: "wedding-invitation",
          invitationId: "invitation-123",
          tokenId: "token-123",
        },
        protectedHeader: {},
      } as any);

      vi.mocked(prisma.invitationToken.findUnique).mockResolvedValue({
        id: "token-123",
        isActive: false, // Inactive token
        expiresAt: null,
        invitation: {} as any,
      } as any);

      const mockAction = vi.fn();
      const wrappedAction = withInvitationAuth(mockAction);

      await expect(wrappedAction()).rejects.toThrow(
        "Unauthorized: No valid invitation session",
      );
      expect(mockAction).not.toHaveBeenCalled();
    });

    it("should throw error if token is expired", async () => {
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({
          value: "valid-jwt-token",
        }),
      } as any);

      vi.mocked(jose.jwtVerify).mockResolvedValue({
        payload: {
          iss: "wedding-app",
          aud: "wedding-invitation",
          invitationId: "invitation-123",
          tokenId: "token-123",
        },
        protectedHeader: {},
      } as any);

      const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24); // Yesterday
      vi.mocked(prisma.invitationToken.findUnique).mockResolvedValue({
        id: "token-123",
        isActive: true,
        expiresAt: pastDate,
        invitation: {} as any,
      } as any);

      const mockAction = vi.fn();
      const wrappedAction = withInvitationAuth(mockAction);

      await expect(wrappedAction()).rejects.toThrow(
        "Unauthorized: No valid invitation session",
      );
      expect(mockAction).not.toHaveBeenCalled();
    });

    it("should pass multiple arguments to action", async () => {
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({
          value: "valid-jwt-token",
        }),
      } as any);

      vi.mocked(jose.jwtVerify).mockResolvedValue({
        payload: {
          iss: "wedding-app",
          aud: "wedding-invitation",
          invitationId: "invitation-123",
          tokenId: "token-123",
        },
        protectedHeader: {},
      } as any);

      vi.mocked(prisma.invitationToken.findUnique).mockResolvedValue({
        id: "token-123",
        isActive: true,
        expiresAt: null,
        invitation: {
          id: "invitation-123",
          guestName: "Jane Doe",
          guestNickname: null,
          maxGuests: 3,
          hasResponded: true,
          isAttending: true,
          guestCount: 2,
          respondedAt: new Date(),
        },
      } as any);

      const mockAction = vi.fn().mockResolvedValue("ok");
      const wrappedAction = withInvitationAuth(mockAction);

      await wrappedAction(1, "two", { three: 3 });

      expect(mockAction).toHaveBeenCalledWith(
        expect.objectContaining({
          invitationId: "invitation-123",
          guestName: "Jane Doe",
        }),
        1,
        "two",
        { three: 3 },
      );
    });

    it("should propagate errors from action", async () => {
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({
          value: "valid-jwt-token",
        }),
      } as any);

      vi.mocked(jose.jwtVerify).mockResolvedValue({
        payload: {
          iss: "wedding-app",
          aud: "wedding-invitation",
          invitationId: "invitation-123",
          tokenId: "token-123",
        },
        protectedHeader: {},
      } as any);

      vi.mocked(prisma.invitationToken.findUnique).mockResolvedValue({
        id: "token-123",
        isActive: true,
        expiresAt: null,
        invitation: {
          id: "invitation-123",
          guestName: "Test User",
          guestNickname: null,
          maxGuests: 1,
          hasResponded: false,
          isAttending: null,
          guestCount: null,
          respondedAt: null,
        },
      } as any);

      const mockAction = vi.fn().mockRejectedValue(new Error("Action failed"));
      const wrappedAction = withInvitationAuth(mockAction);

      await expect(wrappedAction()).rejects.toThrow("Action failed");
    });
  });
});
