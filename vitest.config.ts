import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  // Vite plugins - auto-import React in JSX (test environment only)
  plugins: [react()],

  // Set Vite cache directory to avoid permission issues
  cacheDir: ".vite-cache",

  test: {
    // Environment variables for tests
    // These are set BEFORE any modules are imported
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://localhost:5432/wedding_test",
      JWT_SECRET: "test-jwt-secret-with-at-least-32-characters-for-testing!!",
      NEXT_PUBLIC_WEDDING_DATE: "20260214193000",
    },

    // jsdom environment for React tests
    // Default to jsdom but can be overridden per test
    environment: "jsdom",

    // Globals: describe, it, expect without imports
    // Best practice: use globals for Jest compatibility
    globals: true,

    // Setup files - run before each test file
    setupFiles: ["./vitest.setup.ts"],

    // Test file patterns
    // Only look for tests in the tests/ directory
    include: ["tests/**/*.{test,spec}.{js,ts,jsx,tsx}"],

    // Exclude directories without tests
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/coverage/**",
      "**/prisma/**",
      "**/.git/**",
      "**/scripts/**", // Internal scripts are not tested
      // Exclude complex hook tests (constructor mocking issues in Vitest, E2E tested instead)
      "tests/hooks/useCheckInStrategy.test.ts",
      "tests/hooks/useSSEStream.test.ts",
    ],

    // Coverage with V8 (faster than Istanbul)
    coverage: {
      provider: "v8",

      // Multiple report formats
      // - text: Console output
      // - html: Visual browsable report
      // - lcov: For CI integrations (Codecov, Coveralls)
      // - json: For programmatic processing
      reporter: ["text", "json", "html", "lcov"],

      // Directory where reports are saved
      reportsDirectory: "./coverage",

      // Files to include in coverage report
      include: [
        "utils/**/*.{ts,tsx}",
        "lib/**/*.{ts,tsx}",
        "hooks/**/*.{ts,tsx}",
        "components/**/*.{ts,tsx}",
        "app/actions/schemas.ts", // Only schemas, not full actions
        "lib/middleware/**/*.ts", // Middleware modules (pure logic, edge-safe)
      ],

      // Files to exclude from coverage
      exclude: [
        "**/*.d.ts",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/index.{ts,tsx}", // Barrel files
        "**/*.config.{ts,js}",
        "**/types/**",
        "**/*.metadata.ts",
        "**/*.stories.{ts,tsx}", // Storybook files
        "**/node_modules/**",
        // Exclude Prisma adapters (not business logic, just DB glue)
        "**/*-prisma.{ts,tsx}",
        // Exclude QR scanner (React hook with Web APIs, E2E tested)
        "**/lib/qr/**",
        // Exclude IndexedDB wrapper (idb library wrapper, E2E tested)
        "**/lib/offline/indexedDB.ts",
        // Exclude Better Auth config files (E2E tested)
        "**/lib/auth.ts",
        "**/lib/auth-client.ts",
        // Exclude wrapper hooks (passthrough with no logic, E2E tested)
        "hooks/useAuth.ts",
        // Exclude complex hooks (constructor mocking issues, E2E tested)
        "hooks/useCheckInStrategy.ts",
        "hooks/useSSEStream.ts",

        // ── UI-only components (no testable logic, E2E coverage only) ──
        // Loaders & animations
        "components/HeartLoader.tsx",
        "components/SimpleConfetti.tsx",
        "components/LoadingSpinner.tsx",
        "components/AnimatedDividerCSS.tsx",
        "components/AnimatedSectionCSS.tsx",
        // Modals (composition only, no logic)
        "components/InvitationDetailModal.tsx",
        "components/RSVPModal.tsx", // Logic extracted to lib/rsvp-modal-utils.ts
        "components/RSVPReminderModal.tsx", // Uses lib/rsvp-reminder-utils.ts
        "components/RSVPReminderHandler.tsx", // Logic extracted to lib/rsvp-reminder-utils.ts
        "components/DeleteConfirmationModal.tsx",
        "components/EditInvitationModal.tsx",
        "components/CreateInvitationModal.tsx",
        // Form components (logic extracted to lib/)
        "components/InvitationStatusSelect.tsx", // Logic extracted to lib/invitation-status-utils.ts
        // Backoffice components (UI orchestration + server actions, E2E coverage only)
        "components/backoffice/EventListSelector.tsx",
        "components/backoffice/EventSelector.tsx",
        "components/backoffice/InviteCollaboratorModal.tsx", // Logic extracted to lib/invite-link-utils.ts
        "components/backoffice/AppSidebar/EventSwitcher.tsx", // Layout + server action orchestration
        "components/backoffice/AppSidebar/MobileMenu.tsx", // Mobile drawer + navigation orchestration
        "components/backoffice/ServiceWorkerRegistration.tsx", // Browser API (navigator.serviceWorker), E2E tested
        // Music buttons (UI-only with scroll listeners + audio hook)
        "components/FloatingMusicButton.tsx",
        "components/HeroMusicButton.tsx",
        // Cards/tables (simple rendering, logic tested elsewhere)
        "components/InvitationDetailModal/TokensTable.tsx",
        "components/InvitationDetailModal/RSVPResponseCard.tsx",
        "components/InvitationDetailModal/InvitationInfoCard.tsx",
        // RSVP modal steps (form fields, no logic)
        "components/RSVPModal/RSVPStepAttendance.tsx",
        "components/RSVPModal/RSVPStepGuestCount.tsx",
        "components/RSVPModal/RSVPStepMenu.tsx",
        "components/RSVPModal/RSVPStepDietary.tsx",
        "components/RSVPModal/RSVPStepMessage.tsx",
        "components/RSVPModal/RSVPStepProgress.tsx",
        "components/RSVPModal/RSVPModalPreview.tsx",
        // Section components (visual presentation, no business logic, E2E coverage only)
        "components/sections/**", // All section components (visual presentation, config-driven)
        // Section utilities (layout only)
        "components/section/**",
        // UI utilities
        "components/ui/FeedbackMessage.tsx",
        "components/ui/DecorationLayer.tsx",
        "components/ui/DecorationPreview.tsx",
        // SVG components (no logic, just visual assets)
        "components/Logo.tsx",
      ],

      // Coverage thresholds
      // Start low and gradually increase as we add tests
      // Final goal: 80% on all metrics
      thresholds: {
        lines: 10,
        functions: 10,
        branches: 10,
        statements: 10,
        // Uncomment when close to target
        // autoUpdate: true, // Auto-update thresholds as we improve
      },
    },

    // Timeouts (in ms)
    testTimeout: 10000, // 10s for individual tests
    hookTimeout: 10000, // 10s for hooks (beforeAll, afterAll, etc)

    // Mock configuration
    // clearMocks: Clear call history after each test
    // restoreMocks: Restore original implementation after each test
    // unstubEnvs: Restore env vars after each test
    // unstubGlobals: Restore globals after each test
    clearMocks: true,
    restoreMocks: true,
    mockReset: false, // Don't reset implementation (only call history)
    unstubEnvs: true, // Restore env vars after each test
    unstubGlobals: true, // Restore globals after each test

    // Execution pool
    // threads: Faster, uses workers
    // forks: More isolated, uses separate processes
    pool: "threads",

    // Isolate: Each test file runs in isolated context
    // Prevents state bleeding between files
    isolate: true,

    // CSS/Assets handling
    // Vitest mocks CSS modules by default
    css: false, // Don't process CSS in tests (faster)

    // Watch mode configuration
    watch: false, // Disabled by default (use --watch flag)

    // Reporters for output
    reporters: ["verbose"], // 'default', 'verbose', 'dot', 'json'

    // Retry failed tests (useful for flaky tests)
    retry: 0, // Don't retry by default

    // Bail on first failure (useful for CI)
    bail: 0, // 0 = no bail, N = stop after N failures
  },

  // Resolver aliases (same as tsconfig.json)
  // IMPORTANT: Keep in sync with tsconfig paths
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // Mock server-only for tests (only works in Next.js server)
      "server-only": path.resolve(__dirname, "tests/mocks/server-only.ts"),
    },
  },
});
