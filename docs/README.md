# Invify Documentation

> Digital wedding invitation platform with QR-based check-in system.

## Quick Navigation

| Section                                             | Description                        |
| --------------------------------------------------- | ---------------------------------- |
| [Getting Started](./guides/getting-started.md)      | Setup, installation, and first run |
| [Architecture Overview](./architecture/overview.md) | System design and key decisions    |
| [Data Flow](./architecture/data-flow.md)            | How data moves through the app     |

### Feature Guides

| Guide                                        | Description                                    |
| -------------------------------------------- | ---------------------------------------------- |
| [Authentication](./guides/authentication.md) | Better Auth integration, sessions, permissions |
| [Sections System](./guides/sections.md)      | Dynamic section rendering and configuration    |
| [Check-in System](./guides/check-in.md)      | QR scanning, offline support, sync strategies  |
| [Theming](./guides/theming.md)               | Custom themes and color system                 |

### API Reference

| Reference                                 | Description                             |
| ----------------------------------------- | --------------------------------------- |
| [Server Actions](./api/server-actions.md) | All server actions and their signatures |
| [Route Handlers](./api/route-handlers.md) | REST API endpoints                      |
| [Database Schema](./api/database.md)      | Prisma models and relationships         |

### Development

| Guide                                         | Description                        |
| --------------------------------------------- | ---------------------------------- |
| [Testing](./testing/overview.md)              | Test patterns, mocks, and coverage |
| [Code Style](./development/code-style.md)     | Conventions and linting rules      |
| [Contributing](./development/contributing.md) | How to contribute to the project   |

---

## Tech Stack

| Layer      | Technology                          |
| ---------- | ----------------------------------- |
| Framework  | Next.js 15.5 (App Router)           |
| UI         | React 19, HeroUI v2, Tailwind CSS 4 |
| Database   | PostgreSQL + Prisma 6               |
| Auth       | Better Auth                         |
| Validation | Zod 4                               |
| Testing    | Vitest + Testing Library            |

## Project Structure

```
invify/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, signup, join)
│   ├── (invitation)/      # Public invitation flow
│   ├── backoffice/        # Admin dashboard
│   ├── actions/           # Server Actions
│   ├── api/               # Route Handlers
│   └── r/[token]/         # Token-based invitation access
├── components/            # React components
│   ├── sections/          # Dynamic invitation sections
│   ├── backoffice/        # Admin-specific components
│   ├── providers/         # Context providers
│   └── ui/                # Reusable UI components
├── lib/                   # Core utilities
│   ├── auth.ts            # Better Auth configuration
│   ├── prisma.ts          # Database client
│   ├── permissions.ts     # Bitmask permission system
│   └── check-in/          # Check-in strategies
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
├── prisma/                # Database schema
└── tests/                 # Test files
```

## Key Concepts

### 1. Two Authentication Systems

The app has **two separate auth flows**:

1. **Admin Auth** (Better Auth) - For backoffice users managing events
2. **Guest Auth** (JWT cookies) - For invitation recipients viewing their invitation

### 2. Multi-tenant by Design

- Each **Event** has one **Owner** and multiple **Collaborators**
- Permissions are granular using a **bitmask system**
- Subscription tiers control feature access (FREE, BASIC, COMPANY)

### 3. Offline-First Check-in

The QR check-in system works offline:

- IndexedDB caches invitation data
- Check-ins queue locally when offline
- Background sync when connection restores

### 4. Dynamic Sections

Invitation pages are composed of configurable sections:

- Sections can be enabled/disabled per event
- Each section has its own settings schema
- Render order is customizable via drag-and-drop

---

## Quick Commands

```bash
# Development
pnpm install
pnpm run dev

# Testing
pnpm run test           # Watch mode
pnpm run test:run       # Single run
pnpm run test:coverage  # With coverage

# Linting
pnpm run lint           # Fix issues
pnpm run lint:strict    # Zero warnings

# Database
npx prisma migrate dev  # Apply migrations
npx prisma studio       # Visual editor

# Scripts
pnpm run internal:create-user          # Create admin user
pnpm run internal:generate-secrets     # Generate env secrets
```

---

## Environment Variables

See [`.env.example`](../.env.example) for all required variables.

Critical ones:

- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Auth encryption key (min 32 chars)
- `BETTER_AUTH_URL` - Base URL for auth callbacks

---

## Need Help?

1. Check the relevant guide in this docs folder
2. Look at existing code patterns in similar files
3. Run tests to understand expected behavior
4. Check `AGENTS.md` for AI-assisted development rules
