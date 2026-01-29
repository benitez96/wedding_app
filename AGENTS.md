# Wedding App - AI Agent Ruleset

> **Skills Reference**
>
> - [`better-auth-best-practices`](../skills/better-auth-best-practices/SKILL.md) - Better Auth integration
> - [`frontend-design`](../skills/frontend-design/SKILL.md) - Distinctive, production-grade frontend interfaces
> - [`nextjs-15`](../skills/nextjs-15/SKILL.md) - App Router, Server Actions
> - [`playwright`](../skills/playwright/SKILL.md) - Playwright E2E testing
> - [`react-19`](../skills/react-19/SKILL.md) - React 19 patterns with React Compiler
> - [`skill-sync`](../skills/skill-sync/SKILL.md) - Syncs skill metadata to AGENTS.md
> - [`tailwind-4`](../skills/tailwind-4/SKILL.md) - Tailwind CSS 4 patterns and best practices
> - [`typescript`](../skills/typescript/SKILL.md) - TypeScript strict patterns and best practices
> - [`vercel-composition-patterns`](../skills/vercel-composition-patterns/SKILL.md) - React composition patterns
> - [`vercel-react-best-practices`](../skills/vercel-react-best-practices/SKILL.md) - React/Next.js performance optimization
> - [`web-design-guidelines`](../skills/web-design-guidelines/SKILL.md) - UI review & Web Interface Guidelines compliance
> - [`zod-4`](../skills/zod-4/SKILL.md) - Zod 4 schema validation patterns

### Auto-invoke Skills

When performing these actions, ALWAYS invoke the corresponding skill FIRST:

| Action                                                         | Skill                         |
| -------------------------------------------------------------- | ----------------------------- |
| After creating/modifying a skill                               | `skill-sync`                  |
| App Router / Server Actions                                    | `nextjs-15`                   |
| Authentication setup or configuration with Better Auth         | `better-auth-best-practices`  |
| Building compound components or component libraries            | `vercel-composition-patterns` |
| Building new pages, landing pages, or dashboards from scratch  | `frontend-design`             |
| Bundle size or rendering performance work                      | `vercel-react-best-practices` |
| Creating visually distinctive UI components or layouts         | `frontend-design`             |
| Designing reusable component APIs with context providers       | `vercel-composition-patterns` |
| Playwright E2E testing                                         | `playwright`                  |
| React component patterns                                       | `react-19`                    |
| React/Next.js performance optimization                         | `vercel-react-best-practices` |
| Refactoring components with boolean prop proliferation         | `vercel-composition-patterns` |
| Regenerate AGENTS.md Auto-invoke tables (sync.sh)              | `skill-sync`                  |
| Session management, OAuth, or auth plugin integration          | `better-auth-best-practices`  |
| Tailwind styling and classes                                   | `tailwind-4`                  |
| Troubleshoot why a skill is missing from AGENTS.md auto-invoke | `skill-sync`                  |
| TypeScript types and interfaces                                | `typescript`                  |
| UI review, accessibility audit, or UX best practices check     | `web-design-guidelines`       |
| Zod validation and schemas                                     | `zod-4`                       |

---

## CRITICAL RULES - NON-NEGOTIABLE

### React

- ALWAYS: `import { useState, useEffect } from "react"`
- NEVER: `import React`, `import * as React`, `import React as *`
- NEVER: `useMemo`, `useCallback` (React Compiler handles optimization)

### Types

- ALWAYS: `const X = { A: "a", B: "b" } as const; type T = typeof X[keyof typeof X]`
- NEVER: `type T = "a" | "b"`

### Interfaces

- ALWAYS: One level depth only; object property → dedicated interface (recursive)
- ALWAYS: Reuse via `extends`
- NEVER: Inline nested objects

### Styling

- Prefer Tailwind classes with HeroUI + tailwind-variants
- Single class: `className="bg-slate-800 text-white"`
- Merge multiple classes: `className={clsx(BASE_STYLES, variant && "variant-class")}`
- Dynamic values: `style={{ width: "50%" }}`
- NEVER: `var()` in className, hex colors

### Scope Rule (ABSOLUTE)

- Used 2+ places → `lib/` or `types/` or `hooks/` (components go in `components/{domain}/`)
- Used 1 place → keep local in feature directory
- This determines ALL folder structure decisions

---

## DECISION TREES

### Component Placement

```
HeroUI components? → use HeroUI + Tailwind
Used 1 feature? → local folder | Used 2+? → components/{domain}/
Needs state/hooks? → "use client" | Server component? → No directive
```

### Code Location

```
Server actions → app/actions/
Route handlers → app/api/
Types (shared 2+) → types/{domain}.ts | Types (local 1) → {feature}/types.ts
Utils (shared 2+) → lib/ or utils/ | Utils (local 1) → {feature}/utils/
Hooks (shared 2+) → hooks/ | Hooks (local 1) → {feature}/hooks.ts
```

---

## PATTERNS

### Server Component

```typescript
export default async function Page() {
  const data = await fetchData();
  return <ClientComponent data={data} />;
}
```

### Server Action

```typescript
"use server";
export async function updateInvitation(formData: FormData) {
  const validated = schema.parse(Object.fromEntries(formData));
  await updateDB(validated);
  revalidatePath("/path");
}
```

### Form + Validation (Zod 4)

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.email(),
  id: z.uuid(),
});

const form = useForm({ resolver: zodResolver(schema) });
```

---

## TECH STACK

Next.js 15.5.9 | React 18.3.1 | Tailwind 4.1.11 | HeroUI v2
Prisma 6 | Zod 4 | Tailwind Variants | Framer Motion | Next Themes

---

## PROJECT STRUCTURE

```
app/
├── (invitation)/         # Public invitation flow
├── backoffice/           # Admin/backoffice
├── actions/              # Server actions
├── api/                  # Route handlers
├── r/[token]/            # Token-based access
├── providers.tsx         # App providers
└── layout.tsx            # Root layout
components/               # Shared components
config/                   # App configuration
hooks/                    # Shared hooks
lib/                      # Shared utilities
prisma/                   # Prisma schema + migrations
public/                   # Static assets
scripts/                  # Operational scripts
styles/                   # Global CSS
types/                    # Shared types
utils/                    # Shared utilities
```

---

## COMMANDS

```bash
pnpm install && pnpm run dev
pnpm run build
pnpm run start
pnpm run lint
pnpm run lint:strict
pnpm run internal:create-admin
pnpm run internal:cleanup-rate-limit
pnpm run internal:generate-secrets
```

---

## QA CHECKLIST BEFORE COMMIT

- [ ] `pnpm run lint` passes
- [ ] No secrets in code (use `.env.local`)
- [ ] Error messages sanitized
- [ ] Server-side validation present
