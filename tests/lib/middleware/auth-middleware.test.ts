/**
 * Tests for lib/middleware/auth-middleware.ts
 *
 * CRITICAL: Security middleware - authentication and authorization
 * Must be exhaustively tested to prevent unauthorized access
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  checkEventPermission,
  checkInvitationPermission,
  requireAuth,
} from "@/lib/middleware/auth-middleware";
import { PERMISSIONS } from "@/lib/permissions";

// Mock dependencies BEFORE imports
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    event: {
      findUnique: vi.fn(),
    },
    eventMember: {
      findUnique: vi.fn(),
    },
    invitation: {
      findUnique: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

describe("auth-middleware", () => {
  let mockRequest: NextRequest;

  // Helper to create mock session with all required Better Auth fields
  const createMockSession = (userId: string, email: string, name: string) => ({
    session: {
      id: "session-123",
      createdAt: new Date(),
      updatedAt: new Date(),
      userId,
      expiresAt: new Date(Date.now() + 86400000), // 24h from now
      token: "mock-token",
      ipAddress: "127.0.0.1",
      userAgent: "test-agent",
    },
    user: {
      id: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      email,
      emailVerified: true,
      name,
      image: null,
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock request
    mockRequest = {
      headers: new Headers(),
      nextUrl: { searchParams: new URLSearchParams() },
    } as unknown as NextRequest;
  });

  describe("requireAuth", () => {
    it("should return authorized with session when user is authenticated", async () => {
      const mockSession = createMockSession(
        "user-123",
        "test@example.com",
        "Test User",
      );

      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

      const result = await requireAuth(mockRequest);

      expect(result.authorized).toBe(true);
      if (result.authorized) {
        expect(result.session).toEqual(mockSession);
      }
    });

    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      const result = await requireAuth(mockRequest);

      expect(result.authorized).toBe(false);
      if (!result.authorized) {
        expect(result.response.status).toBe(401);
        const body = await result.response.json();
        expect(body.error).toBe("No autenticado");
      }
    });

    it("should return 401 when session has no user", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({ user: null } as any);

      const result = await requireAuth(mockRequest);

      expect(result.authorized).toBe(false);
      if (!result.authorized) {
        expect(result.response.status).toBe(401);
      }
    });
  });

  describe("checkEventPermission", () => {
    const eventId = "event-123";
    const userId = "user-456";
    const ownerId = "owner-789";

    const mockSession = createMockSession(
      userId,
      "test@example.com",
      "Test User",
    );

    describe("authentication", () => {
      it("should return 401 when user is not authenticated", async () => {
        vi.mocked(auth.api.getSession).mockResolvedValue(null);

        const result = await checkEventPermission(mockRequest, eventId);

        expect(result.authorized).toBe(false);
        if (!result.authorized) {
          expect(result.response.status).toBe(401);
          const body = await result.response.json();
          expect(body.error).toBe("No autenticado");
        }
      });
    });

    describe("event existence", () => {
      it("should return 404 when event does not exist", async () => {
        vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
        vi.mocked(prisma.event.findUnique).mockResolvedValue(null);

        const result = await checkEventPermission(mockRequest, eventId);

        expect(result.authorized).toBe(false);
        if (!result.authorized) {
          expect(result.response.status).toBe(404);
          const body = await result.response.json();
          expect(body.error).toBe("Evento no encontrado");
        }
      });
    });

    describe("owner access", () => {
      it("should grant access when user is event owner", async () => {
        vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
        vi.mocked(prisma.event.findUnique).mockResolvedValue({
          id: eventId,
          ownerId: userId, // Same as session user
        } as any);

        const result = await checkEventPermission(mockRequest, eventId);

        expect(result.authorized).toBe(true);
        if (result.authorized) {
          expect(result.session).toEqual(mockSession);
          expect(result.isOwner).toBe(true);
        }

        // Should NOT check member permissions for owner
        expect(prisma.eventMember.findUnique).not.toHaveBeenCalled();
      });
    });

    describe("member access with permissions", () => {
      beforeEach(() => {
        vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
        vi.mocked(prisma.event.findUnique).mockResolvedValue({
          id: eventId,
          ownerId, // Different from session user
        } as any);
      });

      it("should grant access when member has required permission", async () => {
        vi.mocked(prisma.eventMember.findUnique).mockResolvedValue({
          eventId,
          userId,
          permissions: PERMISSIONS.CHECKIN_SCAN,
        } as any);

        const result = await checkEventPermission(mockRequest, eventId);

        expect(result.authorized).toBe(true);
        if (result.authorized) {
          expect(result.session).toEqual(mockSession);
          expect(result.isOwner).toBe(false);
        }
      });

      it("should accept custom required permission", async () => {
        vi.mocked(prisma.eventMember.findUnique).mockResolvedValue({
          eventId,
          userId,
          permissions: PERMISSIONS.GUESTS_VIEW,
        } as any);

        const result = await checkEventPermission(
          mockRequest,
          eventId,
          PERMISSIONS.GUESTS_VIEW,
        );

        expect(result.authorized).toBe(true);
      });

      it("should deny access when member lacks required permission", async () => {
        vi.mocked(prisma.eventMember.findUnique).mockResolvedValue({
          eventId,
          userId,
          permissions: PERMISSIONS.GUESTS_VIEW, // Wrong permission
        } as any);

        const result = await checkEventPermission(
          mockRequest,
          eventId,
          PERMISSIONS.CHECKIN_SCAN,
        );

        expect(result.authorized).toBe(false);
        if (!result.authorized) {
          expect(result.response.status).toBe(403);
          const body = await result.response.json();
          expect(body.error).toBe("Sin permisos para esta acción");
        }
      });

      it("should deny access when user is not a member", async () => {
        vi.mocked(prisma.eventMember.findUnique).mockResolvedValue(null);

        const result = await checkEventPermission(mockRequest, eventId);

        expect(result.authorized).toBe(false);
        if (!result.authorized) {
          expect(result.response.status).toBe(403);
        }
      });

      it("should verify with correct where clause", async () => {
        vi.mocked(prisma.eventMember.findUnique).mockResolvedValue({
          eventId,
          userId,
          permissions: PERMISSIONS.CHECKIN_SCAN,
        } as any);

        await checkEventPermission(mockRequest, eventId);

        expect(prisma.eventMember.findUnique).toHaveBeenCalledWith({
          where: {
            eventId_userId: {
              eventId,
              userId,
            },
          },
        });
      });
    });

    describe("permission combinations", () => {
      beforeEach(() => {
        vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
        vi.mocked(prisma.event.findUnique).mockResolvedValue({
          id: eventId,
          ownerId,
        } as any);
      });

      it("should grant access when member has multiple permissions including required", async () => {
        const multiplePermissions =
          PERMISSIONS.CHECKIN_SCAN |
          PERMISSIONS.GUESTS_VIEW |
          PERMISSIONS.ANALYTICS_VIEW;

        vi.mocked(prisma.eventMember.findUnique).mockResolvedValue({
          eventId,
          userId,
          permissions: multiplePermissions,
        } as any);

        const result = await checkEventPermission(mockRequest, eventId);

        expect(result.authorized).toBe(true);
      });

      it("should deny access when member has permissions but not the required one", async () => {
        const otherPermissions =
          PERMISSIONS.GUESTS_VIEW | PERMISSIONS.ANALYTICS_VIEW;

        vi.mocked(prisma.eventMember.findUnique).mockResolvedValue({
          eventId,
          userId,
          permissions: otherPermissions,
        } as any);

        const result = await checkEventPermission(
          mockRequest,
          eventId,
          PERMISSIONS.CHECKIN_SCAN,
        );

        expect(result.authorized).toBe(false);
      });
    });
  });

  describe("checkInvitationPermission", () => {
    const invitationId = "invitation-123";
    const eventId = "event-456";
    const userId = "user-789";
    const ownerId = "owner-012";

    const mockSession = createMockSession(
      userId,
      "test@example.com",
      "Test User",
    );

    const mockInvitation = {
      id: invitationId,
      eventId,
      guestName: "Guest Name",
      guestNickname: null,
      maxGuests: 4,
      checkInCount: 0,
      lastCheckInAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      event: {
        id: eventId,
        ownerId,
      },
    };

    describe("authentication", () => {
      it("should return 401 when user is not authenticated", async () => {
        vi.mocked(auth.api.getSession).mockResolvedValue(null);

        const result = await checkInvitationPermission(
          mockRequest,
          invitationId,
        );

        expect(result.authorized).toBe(false);
        if (!result.authorized) {
          expect(result.response.status).toBe(401);
        }
      });
    });

    describe("invitation existence", () => {
      it("should return 404 when invitation does not exist", async () => {
        vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
        vi.mocked(prisma.invitation.findUnique).mockResolvedValue(null);

        const result = await checkInvitationPermission(
          mockRequest,
          invitationId,
        );

        expect(result.authorized).toBe(false);
        if (!result.authorized) {
          expect(result.response.status).toBe(404);
          const body = await result.response.json();
          expect(body.error).toBe("Invitación no encontrada");
        }
      });

      it("should fetch invitation with event data", async () => {
        vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
        vi.mocked(prisma.invitation.findUnique).mockResolvedValue(
          mockInvitation as any,
        );
        vi.mocked(prisma.eventMember.findUnique).mockResolvedValue({
          eventId,
          userId,
          permissions: PERMISSIONS.CHECKIN_SCAN,
        } as any);

        await checkInvitationPermission(mockRequest, invitationId);

        expect(prisma.invitation.findUnique).toHaveBeenCalledWith({
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
      });
    });

    describe("owner access", () => {
      it("should grant access when user is event owner", async () => {
        const ownerSession = createMockSession(
          ownerId,
          "owner@example.com",
          "Owner",
        );

        vi.mocked(auth.api.getSession).mockResolvedValue(ownerSession);
        vi.mocked(prisma.invitation.findUnique).mockResolvedValue(
          mockInvitation as any,
        );

        const result = await checkInvitationPermission(
          mockRequest,
          invitationId,
        );

        expect(result.authorized).toBe(true);
        if (result.authorized) {
          expect(result.isOwner).toBe(true);
          expect(result.invitation).toEqual(mockInvitation);
        }

        // Should NOT check member permissions for owner
        expect(prisma.eventMember.findUnique).not.toHaveBeenCalled();
      });
    });

    describe("member access with permissions", () => {
      beforeEach(() => {
        vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
        vi.mocked(prisma.invitation.findUnique).mockResolvedValue(
          mockInvitation as any,
        );
      });

      it("should grant access when member has required permission", async () => {
        vi.mocked(prisma.eventMember.findUnique).mockResolvedValue({
          eventId,
          userId,
          permissions: PERMISSIONS.CHECKIN_SCAN,
        } as any);

        const result = await checkInvitationPermission(
          mockRequest,
          invitationId,
        );

        expect(result.authorized).toBe(true);
        if (result.authorized) {
          expect(result.isOwner).toBe(false);
          expect(result.invitation).toEqual(mockInvitation);
        }
      });

      it("should accept custom required permission", async () => {
        vi.mocked(prisma.eventMember.findUnique).mockResolvedValue({
          eventId,
          userId,
          permissions: PERMISSIONS.GUESTS_EDIT,
        } as any);

        const result = await checkInvitationPermission(
          mockRequest,
          invitationId,
          PERMISSIONS.GUESTS_EDIT,
        );

        expect(result.authorized).toBe(true);
      });

      it("should deny access when member lacks required permission", async () => {
        vi.mocked(prisma.eventMember.findUnique).mockResolvedValue({
          eventId,
          userId,
          permissions: PERMISSIONS.GUESTS_VIEW,
        } as any);

        const result = await checkInvitationPermission(
          mockRequest,
          invitationId,
          PERMISSIONS.CHECKIN_SCAN,
        );

        expect(result.authorized).toBe(false);
        if (!result.authorized) {
          expect(result.response.status).toBe(403);
          const body = await result.response.json();
          expect(body.error).toBe("Sin permisos para registrar check-ins");
        }
      });

      it("should deny access when user is not a member", async () => {
        vi.mocked(prisma.eventMember.findUnique).mockResolvedValue(null);

        const result = await checkInvitationPermission(
          mockRequest,
          invitationId,
        );

        expect(result.authorized).toBe(false);
        if (!result.authorized) {
          expect(result.response.status).toBe(403);
        }
      });

      it("should use invitation's eventId for member lookup", async () => {
        vi.mocked(prisma.eventMember.findUnique).mockResolvedValue({
          eventId,
          userId,
          permissions: PERMISSIONS.CHECKIN_SCAN,
        } as any);

        await checkInvitationPermission(mockRequest, invitationId);

        expect(prisma.eventMember.findUnique).toHaveBeenCalledWith({
          where: {
            eventId_userId: {
              eventId, // From invitation.event.id
              userId,
            },
          },
        });
      });
    });

    describe("invitation data in response", () => {
      it("should return invitation data when authorized", async () => {
        const ownerSession = createMockSession(
          ownerId,
          "owner@example.com",
          "Owner",
        );

        vi.mocked(auth.api.getSession).mockResolvedValue(ownerSession);
        vi.mocked(prisma.invitation.findUnique).mockResolvedValue(
          mockInvitation as any,
        );

        const result = await checkInvitationPermission(
          mockRequest,
          invitationId,
        );

        expect(result.authorized).toBe(true);
        if (result.authorized) {
          expect(result.invitation.id).toBe(invitationId);
          expect(result.invitation.eventId).toBe(eventId);
          expect(result.invitation.guestName).toBe("Guest Name");
          expect(result.invitation.maxGuests).toBe(4);
          expect(result.invitation.checkInCount).toBe(0);
          expect(result.invitation.event.id).toBe(eventId);
          expect(result.invitation.event.ownerId).toBe(ownerId);
        }
      });
    });
  });

  describe("edge cases", () => {
    const mockSession = createMockSession(
      "user-123",
      "test@example.com",
      "Test User",
    );

    it("should handle database errors gracefully", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
      vi.mocked(prisma.event.findUnique).mockRejectedValue(
        new Error("Database error"),
      );

      await expect(
        checkEventPermission(mockRequest, "event-123"),
      ).rejects.toThrow("Database error");
    });

    it("should handle auth errors gracefully", async () => {
      vi.mocked(auth.api.getSession).mockRejectedValue(
        new Error("Auth service down"),
      );

      await expect(
        checkEventPermission(mockRequest, "event-123"),
      ).rejects.toThrow("Auth service down");
    });

    it("should handle malformed session data", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: undefined,
      } as any);

      const result = await requireAuth(mockRequest);

      expect(result.authorized).toBe(false);
    });

    it("should handle permission value of 0n (no permissions)", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        id: "event-123",
        ownerId: "other-user",
      } as any);
      vi.mocked(prisma.eventMember.findUnique).mockResolvedValue({
        eventId: "event-123",
        userId: "user-123",
        permissions: 0n, // No permissions
      } as any);

      const result = await checkEventPermission(mockRequest, "event-123");

      expect(result.authorized).toBe(false);
      if (!result.authorized) {
        expect(result.response.status).toBe(403);
      }
    });
  });
});
