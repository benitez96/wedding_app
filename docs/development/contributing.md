# Contributing Guide

Thank you for your interest in contributing to Invify! This document outlines the process for contributing.

## Getting Started

1. Read the [Getting Started](../guides/getting-started.md) guide
2. Read the [Code Style](./code-style.md) guide
3. Familiarize yourself with the [Architecture](../architecture/overview.md)

---

## Development Workflow

### 1. Create a Branch

```bash
# Feature
git checkout -b feat/add-photo-section

# Bug fix
git checkout -b fix/check-in-sync-issue

# Documentation
git checkout -b docs/improve-auth-guide
```

### 2. Make Changes

Follow the [Code Style Guide](./code-style.md).

### 3. Test Your Changes

```bash
# Run tests
pnpm run test

# Run linting
pnpm run lint

# Type check
pnpm run typecheck

# Build to verify
pnpm run build
```

### 4. Commit

```bash
git add .
git commit -m "feat(sections): add photo upload section"
```

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance

### 5. Push and Create PR

```bash
git push origin feat/add-photo-section
```

Then create a Pull Request on GitHub.

---

## Pull Request Guidelines

### Title

Use the same format as commits:

```
feat(sections): add photo upload section
```

### Description

Include:

- **What** changed
- **Why** it was needed
- **How** to test it
- Screenshots (if UI change)

### Checklist

Before submitting, ensure:

- [ ] `pnpm run lint` passes with no errors
- [ ] `pnpm run test:run` passes
- [ ] `pnpm run build` succeeds
- [ ] No secrets in code
- [ ] Documentation updated if needed

---

## Code Review

### What We Look For

1. **Correctness** - Does it work as intended?
2. **Code Style** - Follows project conventions?
3. **Performance** - No obvious bottlenecks?
4. **Security** - No vulnerabilities introduced?
5. **Tests** - Adequate test coverage?

### Responding to Feedback

- Address all comments
- Explain if you disagree
- Push fixes as new commits (easier to review)
- Squash before merge if requested

---

## Adding New Features

### New Section

1. Create folder in `components/sections/MySectionSection/`
2. Add metadata file with Zod schema
3. Add component file
4. Add settings form (optional)
5. Run `pnpm run internal:sync-sections`
6. Add to component registry
7. Write tests

See [Sections Guide](../guides/sections.md) for details.

### New Server Action

1. Add to appropriate file in `app/actions/`
2. Use `withAuth` or `withEventAuth` wrapper
3. Validate input with Zod
4. Handle errors properly
5. Call `revalidatePath()` if needed
6. Write tests

See [Server Actions Reference](../api/server-actions.md).

### New API Route

1. Create in `app/api/{path}/route.ts`
2. Authenticate requests
3. Return proper status codes
4. Document in this repo

See [Route Handlers Reference](../api/route-handlers.md).

---

## Reporting Issues

### Bug Reports

Include:

- Clear title
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots/logs
- Environment (OS, browser, Node version)

### Feature Requests

Include:

- Clear title
- Problem statement
- Proposed solution
- Alternatives considered
- Additional context

---

## Questions?

- Check existing documentation
- Look at similar code in the repo
- Ask in the PR/issue

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
