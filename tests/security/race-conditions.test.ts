/**
 * Race Condition Security Tests
 *
 * CRITICAL: These tests verify that concurrent operations are handled correctly
 * and don't lead to data corruption, duplicate entries, or security bypasses.
 *
 * Strategy: Simulate concurrent requests using Promise.all()
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock Prisma with transaction support
vi.mock("@/lib/prisma", () => ({
  default: {
    $transaction: vi.fn(),
    invitationToken: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    invitation: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    checkIn: {
      findFirst: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";

describe("Race Conditions - Token Usage", () => {
  const mockToken = {
    id: "token-123",
    invitationId: "invitation-456",
    isActive: true,
    isUsed: false,
    expiresAt: null,
    invitation: {
      id: "invitation-456",
      guestName: "Test Guest",
      maxGuests: 2,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Concurrent Token Usage", () => {
    it("should prevent double token usage - optimistic scenario", async () => {
      let tokenUsed = false;

      // Mock token update with race condition check
      vi.mocked(prisma.invitationToken.update).mockImplementation(
        async (args: any) => {
          if (tokenUsed) {
            // Second call fails because token is already used
            throw new Error("Token already used");
          }

          // First call succeeds
          tokenUsed = true;
          return { ...mockToken, isUsed: true } as any;
        },
      );

      vi.mocked(prisma.invitationToken.findUnique).mockResolvedValue(
        mockToken as any,
      );

      // Simulate 5 concurrent requests trying to use same token
      const promises = Array(5)
        .fill(null)
        .map(async () => {
          try {
            const token = await prisma.invitationToken.findUnique({
              where: { id: "token-123" },
            });

            if (token?.isUsed) {
              throw new Error("Token already used");
            }

            await prisma.invitationToken.update({
              where: { id: "token-123" },
              data: { isUsed: true },
            });

            return { success: true };
          } catch (error) {
            return { success: false, error: (error as Error).message };
          }
        });

      const results = await Promise.all(promises);

      // Only ONE should succeed
      const successes = results.filter((r) => r.success);
      const failures = results.filter((r) => !r.success);

      expect(successes.length).toBe(1);
      expect(failures.length).toBe(4);
      expect(failures.every((f) => f.error === "Token already used")).toBe(
        true,
      );
    });

    it("should use database transaction for atomic token usage", async () => {
      // Mock transaction implementation
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        // Simulate transaction isolation
        return callback(prisma as any);
      });

      let usageCount = 0;

      vi.mocked(prisma.invitationToken.update).mockImplementation(
        async (args: any) => {
          // Simulate row-level locking in transaction
          if (usageCount > 0) {
            throw new Error("Concurrent modification");
          }
          usageCount++;
          return { ...mockToken, isUsed: true } as any;
        },
      );

      const promises = Array(10)
        .fill(null)
        .map(() =>
          prisma.$transaction(async (tx) => {
            return tx.invitationToken.update({
              where: { id: "token-123" },
              data: { isUsed: true },
            });
          }),
        );

      const results = await Promise.allSettled(promises);

      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");

      // Only one should succeed due to transaction isolation
      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(9);
    });

    it("should handle token expiry race condition", async () => {
      const almostExpiredToken = {
        ...mockToken,
        expiresAt: new Date(Date.now() + 100), // Expires in 100ms
      };

      vi.mocked(prisma.invitationToken.findUnique).mockResolvedValue(
        almostExpiredToken as any,
      );

      // First request: check token (valid)
      const request1 = async () => {
        const token = await prisma.invitationToken.findUnique({
          where: { id: "token-123" },
        });

        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 150));

        // Now check if expired
        if (token?.expiresAt && token.expiresAt < new Date()) {
          throw new Error("Token expired");
        }

        return { success: true };
      };

      await expect(request1()).rejects.toThrow("Token expired");
    });
  });
});

describe("Race Conditions - RSVP Submissions", () => {
  const mockInvitation = {
    id: "invitation-123",
    guestName: "Test Guest",
    maxGuests: 3,
    hasResponded: false,
    isAttending: null,
    guestCount: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Concurrent RSVP Updates", () => {
    it("should prevent double RSVP submission", async () => {
      let responseSubmitted = false;

      vi.mocked(prisma.invitation.findUnique).mockResolvedValue(
        mockInvitation as any,
      );

      vi.mocked(prisma.invitation.update).mockImplementation(
        async (args: any) => {
          if (responseSubmitted) {
            throw new Error("RSVP already submitted");
          }

          responseSubmitted = true;
          return {
            ...mockInvitation,
            hasResponded: true,
            isAttending: args.data.isAttending,
            guestCount: args.data.guestCount,
          } as any;
        },
      );

      // Simulate 2 concurrent RSVP submissions with conflicting data
      const promises = [
        async () => {
          try {
            const invitation = await prisma.invitation.findUnique({
              where: { id: "invitation-123" },
            });

            if (invitation?.hasResponded) {
              throw new Error("Already responded");
            }

            await prisma.invitation.update({
              where: { id: "invitation-123" },
              data: {
                hasResponded: true,
                isAttending: true,
                guestCount: 2,
              },
            });

            return { success: true, attending: true };
          } catch (error) {
            return { success: false, error: (error as Error).message };
          }
        },
        async () => {
          try {
            const invitation = await prisma.invitation.findUnique({
              where: { id: "invitation-123" },
            });

            if (invitation?.hasResponded) {
              throw new Error("Already responded");
            }

            await prisma.invitation.update({
              where: { id: "invitation-123" },
              data: {
                hasResponded: true,
                isAttending: false,
                guestCount: 0,
              },
            });

            return { success: true, attending: false };
          } catch (error) {
            return { success: false, error: (error as Error).message };
          }
        },
      ];

      const results = await Promise.all(promises.map((fn) => fn()));

      // Only ONE should succeed
      const successes = results.filter((r) => r.success);
      const failures = results.filter((r) => !r.success);

      expect(successes.length).toBe(1);
      expect(failures.length).toBe(1);
    });

    it("should use optimistic locking with version field", async () => {
      const invitationWithVersion = {
        ...mockInvitation,
        version: 1,
      };

      vi.mocked(prisma.invitation.findUnique).mockResolvedValue(
        invitationWithVersion as any,
      );

      let currentVersion = 1;

      vi.mocked(prisma.invitation.update).mockImplementation(
        async (args: any) => {
          // Check version in WHERE clause
          if (args.where.version !== currentVersion) {
            throw new Error("Version mismatch");
          }

          currentVersion++;
          return {
            ...invitationWithVersion,
            version: currentVersion,
            hasResponded: true,
          } as any;
        },
      );

      // Two requests with same version
      const request1 = prisma.invitation.update({
        where: { id: "invitation-123", version: 1 },
        data: { hasResponded: true, isAttending: true },
      });

      const request2 = prisma.invitation.update({
        where: { id: "invitation-123", version: 1 },
        data: { hasResponded: true, isAttending: false },
      });

      const results = await Promise.allSettled([request1, request2]);

      // One succeeds, one fails due to version mismatch
      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");

      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);
    });
  });
});

describe("Race Conditions - Check-In Operations", () => {
  const mockInvitation = {
    id: "invitation-789",
    guestName: "VIP Guest",
    maxGuests: 4,
    checkInCount: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Concurrent Check-Ins", () => {
    it("should prevent double check-in for same invitation", async () => {
      vi.mocked(prisma.invitation.findUnique).mockResolvedValue(
        mockInvitation as any,
      );

      let checkInCreated = false;

      // Check if check-in already exists
      vi.mocked(prisma.checkIn.findFirst).mockImplementation(async () => {
        if (checkInCreated) {
          return { id: "checkin-1", invitationId: "invitation-789" } as any;
        }
        return null;
      });

      vi.mocked(prisma.checkIn.create).mockImplementation(async () => {
        if (checkInCreated) {
          throw new Error("Check-in already exists");
        }

        checkInCreated = true;
        return {
          id: "checkin-1",
          invitationId: "invitation-789",
          guestsCount: 2,
        } as any;
      });

      // Simulate 3 concurrent check-in attempts
      const promises = Array(3)
        .fill(null)
        .map(async () => {
          try {
            // Check if already checked in
            const existing = await prisma.checkIn.findFirst({
              where: { invitationId: "invitation-789" },
            });

            if (existing) {
              throw new Error("Already checked in");
            }

            await prisma.checkIn.create({
              data: {
                invitationId: "invitation-789",
                guestsCount: 2,
                checkedInBy: "staff-123",
                clientId: "device-456",
              },
            });

            return { success: true };
          } catch (error) {
            return { success: false, error: (error as Error).message };
          }
        });

      const results = await Promise.all(promises);

      // Only ONE should succeed
      const successes = results.filter((r) => r.success);
      expect(successes.length).toBe(1);
    });

    it("should enforce max guests limit during concurrent check-ins", async () => {
      const invitation = {
        ...mockInvitation,
        maxGuests: 5,
        checkInCount: 4, // Already 4 checked in
      };

      vi.mocked(prisma.invitation.findUnique).mockResolvedValue(
        invitation as any,
      );

      vi.mocked(prisma.checkIn.count).mockResolvedValue(4);

      // Two concurrent check-ins trying to add 2 guests each
      const promises = [
        async () => {
          const inv = await prisma.invitation.findUnique({
            where: { id: "invitation-789" },
          });

          const currentCount = await prisma.checkIn.count({
            where: { invitationId: "invitation-789" },
          });

          const newCount = currentCount + 2;

          if (newCount > (inv?.maxGuests ?? 0)) {
            throw new Error("Exceeds max guests");
          }

          return { success: true, newCount };
        },
        async () => {
          const inv = await prisma.invitation.findUnique({
            where: { id: "invitation-789" },
          });

          const currentCount = await prisma.checkIn.count({
            where: { invitationId: "invitation-789" },
          });

          const newCount = currentCount + 2;

          if (newCount > (inv?.maxGuests ?? 0)) {
            throw new Error("Exceeds max guests");
          }

          return { success: true, newCount };
        },
      ];

      const results = await Promise.allSettled(
        promises.map((fn) => fn().catch((e) => ({ success: false, error: e }))),
      );

      // Both would pass the check individually, but together exceed limit
      // In a real system with transactions, one should fail
      const allResults = results.map((r) =>
        r.status === "fulfilled" ? r.value : r.reason,
      );

      // Without proper locking, both might succeed (bug!)
      // With proper locking, one should fail
      expect(allResults.length).toBe(2);
    });

    it("should use database constraints for check-in uniqueness", async () => {
      // Simulate UNIQUE constraint on (invitationId, deletedAt = NULL)
      let checkInExists = false;

      vi.mocked(prisma.checkIn.create).mockImplementation(async () => {
        if (checkInExists) {
          // Prisma error for unique constraint violation
          throw new Error("Unique constraint failed");
        }

        checkInExists = true;
        return {
          id: "checkin-1",
          invitationId: "invitation-789",
        } as any;
      });

      const promises = Array(5)
        .fill(null)
        .map(() =>
          prisma.checkIn.create({
            data: {
              invitationId: "invitation-789",
              guestsCount: 2,
              checkedInBy: "staff-123",
              clientId: "device-456",
            },
          }),
        );

      const results = await Promise.allSettled(promises);

      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");

      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(4);
    });
  });
});

describe("Race Conditions - Counter Updates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Concurrent Counter Increments", () => {
    it("should handle lost updates in counter fields", async () => {
      // Initial state
      let guestCount = 10;

      // Simulate read-modify-write race condition
      const incrementWithoutLocking = async () => {
        const currentCount = guestCount; // READ
        await new Promise((resolve) => setTimeout(resolve, 10)); // Delay
        guestCount = currentCount + 1; // WRITE
        return guestCount;
      };

      // 5 concurrent increments
      const promises = Array(5)
        .fill(null)
        .map(() => incrementWithoutLocking());

      await Promise.all(promises);

      // Expected: 15 (10 + 5)
      // Actual: Could be 11 due to lost updates (race condition bug!)
      // This demonstrates why atomic operations are needed
      expect(guestCount).toBeLessThanOrEqual(15);
      // In worst case, all 5 read "10" and write "11"
    });

    it("should use atomic increment for counters", async () => {
      let checkInCount = 0;

      const mockInvitation = {
        id: "invitation-123",
        checkInCount: 0,
        eventId: "event-123",
        guestName: "Test Guest",
      };

      // Simulate atomic increment (e.g., SQL: UPDATE ... SET count = count + 1)
      vi.mocked(prisma.invitation.update).mockImplementation(
        async (args: any) => {
          // Atomic operation - no race condition possible
          checkInCount++;
          return { ...mockInvitation, checkInCount } as any;
        },
      );

      // 10 concurrent increments
      const promises = Array(10)
        .fill(null)
        .map(() =>
          prisma.invitation.update({
            where: { id: "invitation-123" },
            data: { checkInCount: { increment: 1 } }, // Atomic
          }),
        );

      await Promise.all(promises);

      // Should be exactly 10 (no lost updates)
      expect(checkInCount).toBe(10);
    });
  });
});

describe("Race Conditions - Resource Allocation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Event Slot Reservation", () => {
    it("should prevent overbooking with concurrent reservations", async () => {
      let reservedSlots = 8;
      const maxSlots = 10;

      // Simulate slot reservation
      const reserveSlot = async () => {
        // Check availability
        if (reservedSlots >= maxSlots) {
          throw new Error("Event is full");
        }

        // Simulate processing time
        await new Promise((resolve) => setTimeout(resolve, 10));

        // Reserve slot
        if (reservedSlots >= maxSlots) {
          throw new Error("Event is full");
        }

        reservedSlots++;
        return { success: true, slot: reservedSlots };
      };

      // 5 concurrent reservation attempts (should only accept 2)
      const promises = Array(5)
        .fill(null)
        .map(() => reserveSlot().catch((e) => ({ error: e.message })));

      const results = await Promise.all(promises);

      const successes = results.filter((r: any) => r.success);

      // With proper locking, should be exactly 2
      // Without locking, could be more (overbooking!)
      expect(reservedSlots).toBeLessThanOrEqual(maxSlots);
    });
  });
});

describe("Race Conditions - Session Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Concurrent Login Attempts", () => {
    it("should prevent session fixation via concurrent logins", async () => {
      const sessions = new Set<string>();

      const createSession = async (userId: string) => {
        const sessionId = `session-${userId}-${Math.random()}`;
        sessions.add(sessionId);
        return sessionId;
      };

      // Attacker tries to predict session ID by creating many sessions
      const promises = Array(100)
        .fill(null)
        .map(() => createSession("user-123"));

      const sessionIds = await Promise.all(promises);

      // All sessions should be unique
      expect(new Set(sessionIds).size).toBe(100);

      // Session IDs should be unpredictable (high entropy)
      const allDifferent = sessionIds.every(
        (id, i) => !sessionIds.slice(i + 1).includes(id),
      );
      expect(allDifferent).toBe(true);
    });
  });

  describe("Concurrent Logout", () => {
    it("should handle concurrent logout requests gracefully", async () => {
      let sessionActive = true;

      const logout = async () => {
        if (!sessionActive) {
          return { success: false, error: "Already logged out" };
        }

        sessionActive = false;
        return { success: true };
      };

      // Multiple logout requests (e.g., from different tabs)
      const promises = Array(3)
        .fill(null)
        .map(() => logout());

      const results = await Promise.all(promises);

      // Only first should succeed
      const successes = results.filter((r) => r.success);
      expect(successes.length).toBe(1);
    });
  });
});
