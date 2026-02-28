# Testing Overview

Invify uses **Vitest** for unit testing and **Testing Library** for component tests.

## Test Stack

| Tool                   | Purpose                    |
| ---------------------- | -------------------------- |
| Vitest                 | Test runner and assertions |
| @testing-library/react | React component testing    |
| msw                    | API mocking                |
| vitest-mock-extended   | TypeScript-friendly mocks  |

---

## Running Tests

```bash
# Watch mode (development)
pnpm run test

# Single run
pnpm run test:run

# With coverage
pnpm run test:coverage

# Run specific file
pnpm run test -- path/to/file.test.ts

# Run matching pattern
pnpm run test -- -t "should validate"
```

---

## Test Structure

```
tests/
├── helpers/
│   ├── mock-types.ts      # Typed mock factories
│   └── test-utils.tsx     # Custom render, providers
├── unit/
│   ├── lib/               # Utility tests
│   └── hooks/             # Hook tests
├── components/
│   ├── sections/          # Section component tests
│   └── backoffice/        # Admin component tests
└── integration/
    └── actions/           # Server action tests
```

---

## Mock Factories

Use typed factories from `tests/helpers/mock-types.ts`:

```typescript
import {
  createMockUser,
  createMockEvent,
  createMockInvitation,
} from "@/tests/helpers/mock-types";

// Create with defaults
const user = createMockUser();

// Override specific fields
const event = createMockEvent({
  name: "Custom Wedding",
  activeTheme: "mocha",
});

// Create related mocks
const invitation = createMockInvitation({
  eventId: event.id,
  guestName: "John Doe",
  maxGuests: 4,
});
```

### Available Factories

```typescript
createMockUser(overrides?: Partial<User>): User
createMockEvent(overrides?: Partial<Event>): Event
createMockInvitation(overrides?: Partial<Invitation>): Invitation
createMockInvitationToken(overrides?: Partial<InvitationToken>): InvitationToken
createMockCheckIn(overrides?: Partial<CheckIn>): CheckIn
createMockEventMember(overrides?: Partial<EventMember>): EventMember
createMockSubscription(overrides?: Partial<Subscription>): Subscription
createMockSectionConfiguration(overrides?: Partial<SectionConfiguration>): SectionConfiguration
```

---

## Unit Tests

### Testing Utilities

```typescript
// tests/unit/lib/permissions.test.ts
import { describe, it, expect } from "vitest";
import { hasPermission, addPermission, PERMISSIONS } from "@/lib/permissions";

describe("permissions", () => {
  describe("hasPermission", () => {
    it("should return true when user has permission", () => {
      const perms = PERMISSIONS.GUESTS_VIEW | PERMISSIONS.GUESTS_EDIT;

      expect(hasPermission(perms, PERMISSIONS.GUESTS_VIEW)).toBe(true);
      expect(hasPermission(perms, PERMISSIONS.GUESTS_EDIT)).toBe(true);
    });

    it("should return false when user lacks permission", () => {
      const perms = PERMISSIONS.GUESTS_VIEW;

      expect(hasPermission(perms, PERMISSIONS.GUESTS_DELETE)).toBe(false);
    });
  });

  describe("addPermission", () => {
    it("should add permission to existing set", () => {
      const initial = PERMISSIONS.GUESTS_VIEW;
      const updated = addPermission(initial, PERMISSIONS.GUESTS_EDIT);

      expect(hasPermission(updated, PERMISSIONS.GUESTS_VIEW)).toBe(true);
      expect(hasPermission(updated, PERMISSIONS.GUESTS_EDIT)).toBe(true);
    });
  });
});
```

### Testing Hooks

```typescript
// tests/unit/hooks/useDebounce.test.ts
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "@/hooks/useDebounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should debounce value changes", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: "initial" } },
    );

    expect(result.current).toBe("initial");

    rerender({ value: "updated" });
    expect(result.current).toBe("initial"); // Not yet

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe("updated"); // Now updated
  });
});
```

---

## Component Tests

### Testing with Providers

```typescript
// tests/components/RSVPSection.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RSVPSection } from "@/components/sections/RSVPSection";
import { createMockUser } from "@/tests/helpers/mock-types";

describe("RSVPSection", () => {
  const defaultSettings = {
    collectMenu: false,
    collectDietary: false,
    collectMessage: true,
  };

  it("should render RSVP form when user has not responded", () => {
    const user = createMockUser({
      hasResponded: false,
      maxGuests: 2,
    });

    render(
      <RSVPSection
        settings={defaultSettings}
        user={user}
      />
    );

    expect(screen.getByRole("form")).toBeInTheDocument();
    expect(screen.getByText(/confirmar asistencia/i)).toBeInTheDocument();
  });

  it("should show confirmation when user has responded", () => {
    const user = createMockUser({
      hasResponded: true,
      isAttending: true,
      guestCount: 2,
    });

    render(
      <RSVPSection
        settings={defaultSettings}
        user={user}
      />
    );

    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(screen.getByText(/ya confirmaste/i)).toBeInTheDocument();
  });
});
```

### Mocking Server Actions

```typescript
// tests/components/InvitationForm.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { InvitationForm } from "@/components/backoffice/InvitationForm";

// Mock the server action
vi.mock("@/app/actions/invitations", () => ({
  createInvitation: vi.fn(),
}));

import { createInvitation } from "@/app/actions/invitations";

describe("InvitationForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call createInvitation on submit", async () => {
    (createInvitation as any).mockResolvedValue({
      success: true,
      invitation: { id: "inv_123" }
    });

    render(<InvitationForm onSuccess={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/nombre/i), {
      target: { value: "John Doe" },
    });

    fireEvent.click(screen.getByRole("button", { name: /crear/i }));

    await waitFor(() => {
      expect(createInvitation).toHaveBeenCalledWith(
        expect.objectContaining({ guestName: "John Doe" })
      );
    });
  });
});
```

---

## Integration Tests

### Testing Server Actions

```typescript
// tests/integration/actions/invitations.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createInvitation } from "@/app/actions/invitations/crud";
import { prisma } from "@/lib/prisma";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    invitation: {
      create: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// Mock auth
vi.mock("@/lib/server-auth", () => ({
  withEventAuth: (fn: Function) => fn,
}));

describe("createInvitation", () => {
  const mockCtx = {
    user: { id: "user_123" },
    event: { eventId: "event_123", isOwner: true, permissions: 0n },
    tierContext: { tier: "BASIC", maxGuests: 100, guestCount: 10 },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create invitation successfully", async () => {
    (prisma.invitation.create as any).mockResolvedValue({
      id: "inv_new",
      guestName: "Test Guest",
    });

    const result = await createInvitation(mockCtx, {
      guestName: "Test Guest",
      maxGuests: 2,
    });

    expect(result.success).toBe(true);
    expect(prisma.invitation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        guestName: "Test Guest",
        maxGuests: 2,
        eventId: "event_123",
      }),
    });
  });

  it("should reject when tier limit reached", async () => {
    const limitedCtx = {
      ...mockCtx,
      tierContext: { ...mockCtx.tierContext, guestCount: 100 },
    };

    const result = await createInvitation(limitedCtx, {
      guestName: "Over Limit",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("límite");
  });
});
```

---

## Coverage

```bash
# Run with coverage
pnpm run test:coverage

# Coverage thresholds (vitest.config.ts)
coverage: {
  thresholds: {
    lines: 70,
    functions: 70,
    branches: 60,
    statements: 70,
  },
}
```

### Coverage Report

```
-----------------------|---------|----------|---------|---------|
File                   | % Stmts | % Branch | % Funcs | % Lines |
-----------------------|---------|----------|---------|---------|
lib/permissions.ts     |   100   |   100    |   100   |   100   |
lib/theme-utils.ts     |    95   |    90    |   100   |    95   |
hooks/useDebounce.ts   |   100   |   100    |   100   |   100   |
-----------------------|---------|----------|---------|---------|
```

---

## Best Practices

### 1. Test Behavior, Not Implementation

```typescript
// ✅ Good - tests what the user sees
expect(screen.getByText("Guest added")).toBeInTheDocument();

// ❌ Bad - tests internal state
expect(component.state.isLoading).toBe(false);
```

### 2. Use Semantic Queries

```typescript
// ✅ Good - accessible queries
screen.getByRole("button", { name: /submit/i });
screen.getByLabelText(/email/i);

// ❌ Bad - implementation details
screen.getByTestId("submit-btn");
container.querySelector(".btn-primary");
```

### 3. Isolate Tests

```typescript
// ✅ Good - each test is independent
beforeEach(() => {
  vi.clearAllMocks();
});

// ❌ Bad - tests depend on each other
let sharedState;
it("first test", () => {
  sharedState = "set";
});
it("second test", () => {
  expect(sharedState).toBe("set");
});
```

### 4. Test Edge Cases

```typescript
describe("validateEmail", () => {
  it.each([
    ["valid@email.com", true],
    ["invalid", false],
    ["", false],
    [null, false],
    ["a@b.c", true],
  ])("should validate %s as %s", (email, expected) => {
    expect(validateEmail(email)).toBe(expected);
  });
});
```

---

## Debugging Tests

```bash
# Run with verbose output
pnpm run test -- --reporter=verbose

# Run specific test with debugging
pnpm run test -- --inspect-brk path/to/file.test.ts

# Show browser for component tests
DEBUG_PRINT_LIMIT=10000 pnpm run test
```

### Common Issues

| Issue              | Solution                               |
| ------------------ | -------------------------------------- |
| "Module not found" | Check import aliases in vitest.config  |
| Tests timeout      | Increase timeout or fix async handling |
| Mock not working   | Ensure mock is before import           |
| "act()" warnings   | Wrap state updates in waitFor/act      |
