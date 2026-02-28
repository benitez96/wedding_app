/**
 * Mock Types for Testing
 *
 * Typed mock factories to replace `as any` in tests.
 * These provide type-safe partial mocks that satisfy Vitest mocking.
 *
 * @example
 * // Instead of:
 * vi.mocked(prisma.invitation.findUnique).mockResolvedValue({} as any);
 *
 * // Use:
 * vi.mocked(prisma.invitation.findUnique).mockResolvedValue(
 *   mockInvitation({ guestName: "John" })
 * );
 */

import type {
  Invitation,
  InvitationToken,
  Event,
  User,
  CheckIn,
} from "@/app/generated/prisma";

// ============================================================================
// INVITATION MOCKS
// ============================================================================

export interface MockInvitationData {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  guestName?: string;
  guestNickname?: string | null;
  guestPhone?: string | null;
  maxGuests?: number;
  hasResponded?: boolean;
  isAttending?: boolean | null;
  guestCount?: number | null;
  respondedAt?: Date | null;
  checkInCount?: number;
  lastCheckInAt?: Date | null;
  eventId?: string;
  menuPreference?: string | null;
  dietaryRestrictions?: string | null;
  messageForCouple?: string | null;
}

/**
 * Creates a mock Invitation with sensible defaults
 */
export function mockInvitation(overrides: MockInvitationData = {}): Invitation {
  const now = new Date();
  return {
    id: overrides.id ?? "invitation-test-123",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    guestName: overrides.guestName ?? "Test Guest",
    guestNickname: overrides.guestNickname ?? null,
    guestPhone: overrides.guestPhone ?? null,
    maxGuests: overrides.maxGuests ?? 2,
    hasResponded: overrides.hasResponded ?? false,
    isAttending: overrides.isAttending ?? null,
    guestCount: overrides.guestCount ?? null,
    respondedAt: overrides.respondedAt ?? null,
    checkInCount: overrides.checkInCount ?? 0,
    lastCheckInAt: overrides.lastCheckInAt ?? null,
    eventId: overrides.eventId ?? "event-test-123",
    menuPreference: overrides.menuPreference ?? null,
    dietaryRestrictions: overrides.dietaryRestrictions ?? null,
    messageForCouple: overrides.messageForCouple ?? null,
  } as Invitation;
}

// ============================================================================
// INVITATION TOKEN MOCKS
// ============================================================================

export interface MockTokenData {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isActive?: boolean;
  isUsed?: boolean;
  expiresAt?: Date | null;
  firstAccessAt?: Date | null;
  lastAccessAt?: Date | null;
  deviceId?: string | null;
  userAgent?: string | null;
  accessCount?: number;
  invitationId?: string;
}

/**
 * Creates a mock InvitationToken with sensible defaults
 */
export function mockInvitationToken(
  overrides: MockTokenData = {},
): InvitationToken {
  const now = new Date();
  return {
    id: overrides.id ?? "token-test-abc123",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    isActive: overrides.isActive ?? true,
    isUsed: overrides.isUsed ?? false,
    expiresAt: overrides.expiresAt ?? null,
    firstAccessAt: overrides.firstAccessAt ?? null,
    lastAccessAt: overrides.lastAccessAt ?? null,
    deviceId: overrides.deviceId ?? null,
    userAgent: overrides.userAgent ?? null,
    accessCount: overrides.accessCount ?? 0,
    invitationId: overrides.invitationId ?? "invitation-test-123",
  } as InvitationToken;
}

/**
 * Creates a mock token with invitation included (for findUnique with include)
 */
export function mockTokenWithInvitation(
  tokenOverrides: MockTokenData = {},
  invitationOverrides: MockInvitationData = {},
) {
  return {
    ...mockInvitationToken(tokenOverrides),
    invitation: mockInvitation(invitationOverrides),
  };
}

// ============================================================================
// EVENT MOCKS
// ============================================================================

export interface MockEventData {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  name?: string;
  slug?: string;
  description?: string | null;
  ownerId?: string;
}

/**
 * Creates a mock Event with sensible defaults
 */
export function mockEvent(overrides: MockEventData = {}): Event {
  const now = new Date();
  return {
    id: overrides.id ?? "event-test-123",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    name: overrides.name ?? "Test Wedding",
    slug: overrides.slug ?? "test-wedding",
    description: overrides.description ?? null,
    ownerId: overrides.ownerId ?? "user-test-123",
  } as Event;
}

// ============================================================================
// USER MOCKS
// ============================================================================

export interface MockUserData {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  email?: string;
  emailVerified?: boolean;
  name?: string;
  image?: string | null;
}

/**
 * Creates a mock User with sensible defaults
 */
export function mockUser(overrides: MockUserData = {}): User {
  const now = new Date();
  return {
    id: overrides.id ?? "user-test-123",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    email: overrides.email ?? "test@example.com",
    emailVerified: overrides.emailVerified ?? false,
    name: overrides.name ?? "Test User",
    image: overrides.image ?? null,
  } as User;
}

// ============================================================================
// CHECK-IN MOCKS
// ============================================================================

export interface MockCheckInData {
  id?: string;
  createdAt?: Date;
  invitationId?: string;
  checkedInBy?: string;
  guestsCount?: number;
  clientId?: string;
  deviceId?: string | null;
  syncedAt?: Date | null;
  exceededCapacity?: boolean;
  capacityNote?: string | null;
}

/**
 * Creates a mock CheckIn with sensible defaults
 */
export function mockCheckIn(overrides: MockCheckInData = {}): CheckIn {
  const now = new Date();
  return {
    id: overrides.id ?? "checkin-test-123",
    createdAt: overrides.createdAt ?? now,
    invitationId: overrides.invitationId ?? "invitation-test-123",
    checkedInBy: overrides.checkedInBy ?? "user-test-123",
    guestsCount: overrides.guestsCount ?? 1,
    clientId: overrides.clientId ?? "client-test-123",
    deviceId: overrides.deviceId ?? null,
    syncedAt: overrides.syncedAt ?? now,
    exceededCapacity: overrides.exceededCapacity ?? false,
    capacityNote: overrides.capacityNote ?? null,
  } as CheckIn;
}

// ============================================================================
// NEXT.JS MOCKS
// ============================================================================

/**
 * Creates a mock Headers object
 */
export function mockHeaders(headers: Record<string, string> = {}) {
  const headersMap = new Map(
    Object.entries({
      "user-agent": "Test Browser",
      ...headers,
    }),
  );

  return {
    get: (name: string) => headersMap.get(name.toLowerCase()) ?? null,
    has: (name: string) => headersMap.has(name.toLowerCase()),
    entries: () => headersMap.entries(),
    keys: () => headersMap.keys(),
    values: () => headersMap.values(),
    forEach: (fn: (value: string, key: string) => void) =>
      headersMap.forEach(fn),
  };
}

/**
 * Creates a mock cookie store
 */
export function mockCookieStore(cookies: Record<string, string> = {}) {
  const cookieMap = new Map(Object.entries(cookies));

  return {
    get: (name: string) => {
      const value = cookieMap.get(name);
      return value ? { name, value } : undefined;
    },
    getAll: () =>
      Array.from(cookieMap.entries()).map(([name, value]) => ({ name, value })),
    has: (name: string) => cookieMap.has(name),
    set: vi.fn((name: string, value: string) => {
      cookieMap.set(name, value);
    }),
    delete: vi.fn((name: string) => {
      cookieMap.delete(name);
    }),
  };
}

// ============================================================================
// SESSION MOCKS
// ============================================================================

export interface MockSessionData {
  userId?: string;
  email?: string;
  name?: string;
}

/**
 * Creates a mock Better Auth session
 */
export function mockSession(overrides: MockSessionData = {}) {
  return {
    user: {
      id: overrides.userId ?? "user-test-123",
      email: overrides.email ?? "test@example.com",
      name: overrides.name ?? "Test User",
      image: null,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    session: {
      id: "session-test-123",
      userId: overrides.userId ?? "user-test-123",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
      token: "test-session-token",
      ipAddress: "127.0.0.1",
      userAgent: "Test Browser",
    },
  };
}

// ============================================================================
// PRISMA MOCK HELPERS
// ============================================================================

/**
 * Helper to create a Prisma transaction mock
 */
export function mockPrismaTransaction<T>(result: T) {
  return vi
    .fn()
    .mockImplementation(async (callback: (tx: unknown) => Promise<T>) => {
      // Simple mock that just calls the callback with a mock transaction
      return callback({
        invitation: {
          findUnique: vi.fn(),
          update: vi.fn(),
          create: vi.fn(),
        },
        invitationToken: {
          findUnique: vi.fn(),
          update: vi.fn(),
          updateMany: vi.fn(),
        },
        checkIn: {
          create: vi.fn().mockResolvedValue(result),
        },
      });
    });
}

// Import vi for mocking
import { vi } from "vitest";
