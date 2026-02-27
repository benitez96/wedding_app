# Code Style Guide

This document outlines the coding conventions for Invify. Following these ensures consistency and helps the codebase remain maintainable.

## TypeScript

### Use Const Objects for Union Types

```typescript
// ✅ Good - const object pattern
export const THEME_IDS = {
  CLASSIC: "classic",
  WARM: "warm",
  MOCHA: "mocha",
} as const;

export type ThemeId = (typeof THEME_IDS)[keyof typeof THEME_IDS];

// ❌ Bad - string union
type ThemeId = "classic" | "warm" | "mocha";
```

**Why?** Const objects provide runtime values AND types, enable iteration, and offer better IDE support.

### Flat Interface Structure

```typescript
// ✅ Good - one level depth, separate interfaces
interface Address {
  street: string;
  city: string;
}

interface User {
  id: string;
  name: string;
  address: Address;
}

// ❌ Bad - nested inline objects
interface User {
  id: string;
  name: string;
  address: {
    street: string;
    city: string;
  };
}
```

### Strict Null Checks

```typescript
// ✅ Good - explicit null handling
function getUser(id: string): User | null {
  const user = users.get(id);
  return user ?? null;
}

// ❌ Bad - implicit undefined
function getUser(id: string): User | undefined {
  return users.get(id);
}
```

---

## React

### Import Named Exports

```typescript
// ✅ Good
import { useState, useEffect, useCallback } from "react";

// ❌ Bad
import React from "react";
import * as React from "react";
```

### No Manual Memoization (React 19)

```typescript
// ✅ Good - React Compiler handles optimization
function Component({ data }) {
  const processed = expensiveCalculation(data);
  const handleClick = () => doSomething(data);

  return <button onClick={handleClick}>{processed}</button>;
}

// ❌ Bad - unnecessary with React Compiler
function Component({ data }) {
  const processed = useMemo(() => expensiveCalculation(data), [data]);
  const handleClick = useCallback(() => doSomething(data), [data]);

  return <button onClick={handleClick}>{processed}</button>;
}
```

### Client vs Server Components

```typescript
// Server Component (default) - no directive needed
export default async function Page() {
  const data = await fetchData();
  return <ClientComponent data={data} />;
}

// Client Component - explicit directive
"use client";

export function InteractiveForm() {
  const [value, setValue] = useState("");
  return <input value={value} onChange={(e) => setValue(e.target.value)} />;
}
```

---

## Styling (Tailwind CSS 4)

### Direct Classes

```typescript
// ✅ Good - plain Tailwind classes
<div className="bg-primary text-white p-4 rounded-lg" />

// ❌ Bad - var() in className
<div className="bg-[var(--primary)]" />
```

### Dynamic Values via Style

```typescript
// ✅ Good - use style for dynamic values
<div
  className="rounded-lg p-4"
  style={{ backgroundColor: dynamicColor }}
/>
```

### Class Merging with clsx

```typescript
import { clsx } from "clsx";

// ✅ Good - merge classes conditionally
<button
  className={clsx(
    "px-4 py-2 rounded",
    variant === "primary" && "bg-primary text-white",
    variant === "secondary" && "bg-secondary text-secondary-foreground",
    disabled && "opacity-50 cursor-not-allowed"
  )}
/>
```

### Theme Colors Only

```typescript
// ✅ Good - use theme variables
<div className="bg-background text-foreground" />
<button className="bg-primary text-primary-foreground" />

// ❌ Bad - hardcoded colors
<div className="bg-white text-black" />
<button className="bg-blue-500 text-white" />
```

---

## File Organization

### Scope Rule

| Used in   | Location                        |
| --------- | ------------------------------- |
| 1 place   | Keep local in feature directory |
| 2+ places | Move to shared directory        |

### Directory Mapping

| Type              | Location               |
| ----------------- | ---------------------- |
| Server Actions    | `app/actions/`         |
| Route Handlers    | `app/api/`             |
| Shared Types      | `types/{domain}.ts`    |
| Local Types       | `{feature}/types.ts`   |
| Shared Utils      | `lib/` or `utils/`     |
| Local Utils       | `{feature}/utils/`     |
| Shared Hooks      | `hooks/`               |
| Local Hooks       | `{feature}/hooks.ts`   |
| Shared Components | `components/{domain}/` |

---

## Zod Validation (v4)

### Use v4 Methods

```typescript
// ✅ Good - Zod 4 syntax
import { z } from "zod";

const schema = z.object({
  email: z.email(),
  url: z.url(),
  id: z.uuid(),
});

// ❌ Bad - Zod 3 syntax (still works but deprecated)
const schema = z.object({
  email: z.string().email(),
  url: z.string().url(),
  id: z.string().uuid(),
});
```

### Schema Location

```typescript
// Shared schemas → app/actions/schemas/{domain}.ts
// Local schemas → inline with the action
```

---

## Error Handling

### Server-Side Logging

```typescript
// ✅ Good - use logError for server code
import { logError } from "@/lib/logger";

export async function myAction() {
  try {
    // ...
  } catch (error) {
    logError("myAction failed", error);
    return { success: false, error: "Operation failed" };
  }
}

// ❌ Bad - console.error in server code
catch (error) {
  console.error("Error:", error);
}
```

### Client-Side Logging

```typescript
// ✅ Good - console.error is fine in client components
"use client";

function Component() {
  const handleError = (error: Error) => {
    console.error("Component error:", error);
    toast.error("Something went wrong");
  };
}
```

### Unused Variables

```typescript
// ✅ Good - prefix with underscore
try {
  await riskyOperation();
} catch (_error) {
  return { success: false };
}

const { unused: _unused, used } = data;

// ❌ Bad - unused variable without prefix
catch (error) {
  return { success: false };
}
```

---

## Naming Conventions

### Files

| Type          | Convention           | Example                |
| ------------- | -------------------- | ---------------------- |
| Component     | PascalCase           | `ThemeSelector.tsx`    |
| Hook          | camelCase with "use" | `useDebounce.ts`       |
| Utility       | camelCase            | `permissions.ts`       |
| Type file     | kebab-case           | `check-in-strategy.ts` |
| Server Action | camelCase            | `invitations.ts`       |
| Constant      | SCREAMING_SNAKE_CASE | `PERMISSIONS`          |

### Variables

```typescript
// Constants
const MAX_GUESTS = 100;
const PERMISSIONS = { ... };

// Functions
function calculateTotal() {}
async function fetchUserData() {}

// React components
function UserProfile() {}
function ThemeSelector() {}

// Boolean variables
const isLoading = true;
const hasPermission = false;
const canEdit = true;
```

---

## Imports

### Order

```typescript
// 1. React
import { useState, useEffect } from "react";

// 2. Next.js
import { redirect } from "next/navigation";
import Image from "next/image";

// 3. External libraries
import { z } from "zod";
import { clsx } from "clsx";

// 4. Internal aliases (@/)
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions";
import type { User } from "@/types/user";

// 5. Relative imports
import { LocalComponent } from "./LocalComponent";
import type { LocalType } from "./types";
```

### Type Imports

```typescript
// ✅ Good - explicit type imports
import type { User, Event } from "@/types";
import { createUser } from "@/lib/users";

// ❌ Bad - mixing types and values
import { User, Event, createUser } from "@/lib/users";
```

---

## Comments

### When to Comment

```typescript
// ✅ Good - explain WHY, not WHAT
// Offset by 1 because the API uses 1-indexed pages
const pageIndex = page - 1;

// ❌ Bad - obvious from code
// Subtract 1 from page
const pageIndex = page - 1;
```

### JSDoc for Public APIs

```typescript
/**
 * Checks if a user has a specific permission.
 *
 * @param userPermissions - Bitmask of user's permissions
 * @param permission - Permission to check
 * @returns true if user has the permission
 *
 * @example
 * hasPermission(userPerms, PERMISSIONS.GUESTS_EDIT)
 */
export function hasPermission(
  userPermissions: bigint,
  permission: bigint,
): boolean {
  return (userPermissions & permission) === permission;
}
```

---

## ESLint / Prettier

```bash
# Fix lint issues
pnpm run lint

# Strict mode (zero warnings)
pnpm run lint:strict
```

### Key Rules

- No unused variables (prefix with `_` if intentional)
- No console.log in production (use logError for errors)
- Prefer const over let
- No any (use unknown and narrow)

---

## Git Commits

### Format

```
type(scope): short description

[optional body]

[optional footer]
```

### Types

| Type     | Description                  |
| -------- | ---------------------------- |
| feat     | New feature                  |
| fix      | Bug fix                      |
| docs     | Documentation only           |
| style    | Formatting (no code change)  |
| refactor | Code change (no new feature) |
| test     | Adding tests                 |
| chore    | Build, config, etc.          |

### Examples

```
feat(sections): add photo upload section

fix(check-in): handle offline sync race condition

docs: update authentication guide

refactor(permissions): extract bitmask helpers

chore: upgrade dependencies
```
