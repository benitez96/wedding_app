# Getting Started

This guide will help you set up Invify for local development.

## Prerequisites

- **Node.js** 20+ (we use 22 LTS)
- **pnpm** 9+ (package manager)
- **PostgreSQL** 15+ (database)
- **Git** (version control)

## Quick Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd invify

# Install dependencies
pnpm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
# Database (required)
DATABASE_URL="postgresql://user:password@localhost:5432/invify"

# Better Auth (required)
BETTER_AUTH_SECRET="your-secret-key-minimum-32-characters-long"
BETTER_AUTH_URL="http://localhost:3000"

# Optional: Email provider for magic links
RESEND_API_KEY="re_xxxxxxxxx"

# Optional: File uploads
CLOUDINARY_URL="cloudinary://xxx:yyy@zzz"
```

> **Generate secrets**: Run `pnpm run internal:generate-secrets` to generate secure values for `BETTER_AUTH_SECRET`.

### 3. Database Setup

```bash
# Create the database (if not exists)
createdb invify

# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

### 4. Create Admin User

```bash
# Interactive CLI to create your first admin user
pnpm run internal:create-user
```

### 5. Start Development Server

```bash
pnpm run dev
```

Visit `http://localhost:3000` - you should see the landing page.

---

## Project Structure Overview

```
invify/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── (invitation)/      # Public invitation pages
│   ├── backoffice/        # Admin dashboard
│   │   ├── (protected)/   # Requires authentication
│   │   └── layout.tsx     # Sidebar, auth check
│   ├── actions/           # Server Actions
│   │   ├── invitations/   # Invitation CRUD
│   │   ├── check-in/      # Check-in operations
│   │   └── ...
│   ├── api/               # REST endpoints
│   │   ├── auth/          # Better Auth handlers
│   │   └── ...
│   └── r/[token]/         # Invitation access route
├── components/
│   ├── sections/          # Dynamic invitation sections
│   ├── backoffice/        # Admin-specific components
│   └── ui/                # Reusable UI primitives
├── lib/                   # Core utilities
│   ├── auth.ts            # Better Auth config
│   ├── prisma.ts          # Database client
│   └── permissions.ts     # Permission helpers
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript definitions
└── prisma/
    └── schema.prisma      # Database schema
```

---

## Key Workflows

### Creating Your First Event

1. Log in at `/auth/login` with the admin user you created
2. You'll be prompted to create your first event
3. Fill in the event details (name, date, etc.)
4. You'll be redirected to the dashboard

### Adding Guests

1. Go to **Invitations** in the sidebar
2. Click **Add Guest**
3. Enter guest details (name, phone, max guests)
4. Click **Generate Link** to create an invitation URL
5. Share the link with your guest

### Viewing an Invitation

1. Copy the invitation URL (e.g., `http://localhost:3000/r/abc123`)
2. Open in an incognito window (to test as a guest)
3. You'll see the invitation with all enabled sections

### Customizing the Invitation

1. Go to **Structure** in the sidebar
2. Enable/disable sections using the toggles
3. Drag sections to reorder them
4. Click the settings icon to customize each section
5. Go to **Design** to change colors and theme

---

## Development Commands

```bash
# Start development server
pnpm run dev

# Run tests in watch mode
pnpm run test

# Run tests once
pnpm run test:run

# Run tests with coverage
pnpm run test:coverage

# Lint and fix
pnpm run lint

# Lint with zero warnings (CI mode)
pnpm run lint:strict

# Type check
pnpm run typecheck

# Build for production
pnpm run build

# Start production server
pnpm run start
```

### Database Commands

```bash
# Open Prisma Studio (visual DB editor)
npx prisma studio

# Create a new migration
npx prisma migrate dev --name your_migration_name

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Generate Prisma client after schema changes
npx prisma generate
```

### Internal Scripts

```bash
# Create admin user
pnpm run internal:create-user

# Generate secrets for .env
pnpm run internal:generate-secrets

# Sync section metadata
pnpm run internal:sync-sections

# Cleanup old rate limit entries
pnpm run internal:cleanup-rate-limit
```

---

## Common Issues

### "Cannot find module '@/app/generated/prisma'"

Run `npx prisma generate` to generate the Prisma client.

### "BETTER_AUTH_SECRET must be at least 32 characters"

Your secret key is too short. Run `pnpm run internal:generate-secrets` to generate a proper one.

### "Port 3000 already in use"

Another process is using the port. Either kill it or use a different port:

```bash
PORT=3001 pnpm run dev
```

### "Database connection refused"

Make sure PostgreSQL is running and `DATABASE_URL` is correct. Test with:

```bash
psql $DATABASE_URL -c "SELECT 1"
```

### TypeScript errors about deleted files

The LSP sometimes caches deleted files. Restart your editor or run:

```bash
# Clear Next.js cache
rm -rf .next

# Restart TypeScript server in VS Code: Cmd+Shift+P > "Restart TS Server"
```

---

## Next Steps

- [Authentication Guide](./authentication.md) - Understand the dual auth system
- [Sections Guide](./sections.md) - Learn how dynamic sections work
- [Code Style](../development/code-style.md) - Follow our coding conventions
- [Architecture Overview](../architecture/overview.md) - Understand the system design
