import { defineConfig, devices } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Database URL for test seeding — connects from host to Docker-exposed port
const dbPassword = process.env.POSTGRES_PASSWORD ?? "postgres";
process.env.TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  `postgresql://postgres:${dbPassword}@localhost:5432/wedding_app`;

export const E2E_STATE_DIR = path.join(__dirname, ".e2e-state");

export const AUTH_STATE = {
  FREE: path.join(E2E_STATE_DIR, "auth-free.json"),
  BASIC: path.join(E2E_STATE_DIR, "auth-basic.json"),
  COMPANY: path.join(E2E_STATE_DIR, "auth-company.json"),
} as const;

export default defineConfig({
  testDir: "./specs",
  testIgnore: ["**/seed.spec.ts"],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["html", { outputFolder: ".e2e-report", open: "never" }]],
  // Increase assertion timeout from default 5s → 10s.
  // Next.js dev mode inside Docker can be slow on first SSR compilation.
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  globalSetup: "./tests/e2e/global-setup.ts",
  globalTeardown: "./tests/e2e/global-teardown.ts",

  /**
   * Three projects, one per subscription tier.
   * Every test in specs/ runs for all three tiers.
   * Use test.info().project.name ('free' | 'basic' | 'company')
   * inside tests to assert tier-specific behavior.
   */
  projects: [
    {
      name: "free",
      use: {
        ...devices["Desktop Chrome"],
        storageState: AUTH_STATE.FREE,
      },
    },
    {
      name: "basic",
      use: {
        ...devices["Desktop Chrome"],
        storageState: AUTH_STATE.BASIC,
      },
    },
    {
      name: "company",
      use: {
        ...devices["Desktop Chrome"],
        storageState: AUTH_STATE.COMPANY,
      },
    },
  ],
});
