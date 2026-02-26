import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "../../app/generated/prisma/index.js";

const TIER_BADGE: Record<string, string> = {
  free: "Gratis",
  basic: "Basic",
  company: "Company",
};

// Clear project-level storageState — this test validates the login flow itself
test.use({ storageState: { cookies: [], origins: [] } });

test.beforeAll(async () => {
  // Clear sign-in rate limits so this fresh login isn't blocked by accumulated
  // attempts from global setup + previous projects' login tests
  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.TEST_DATABASE_URL } },
  });
  try {
    await prisma.$executeRaw`DELETE FROM rate_limit WHERE key LIKE '%/sign-in/email%'`;
  } finally {
    await prisma.$disconnect();
  }
});

test.describe("Authentication", () => {
  test("should login with valid credentials and redirect to dashboard", async ({
    page,
  }) => {
    const credentialsPath = path.join(
      process.cwd(),
      ".e2e-state",
      "credentials.json",
    );
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));
    const tier = test.info().project.name as "free" | "basic" | "company";
    const { email, password } = credentials[tier];

    await page.goto("/backoffice/login");

    // Verify form elements are present
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Iniciar Sesión" }),
    ).toBeVisible();

    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.getByRole("button", { name: "Iniciar Sesión" }).click();

    await page.waitForURL("**/backoffice/dashboard**", { timeout: 30_000 });

    await expect(
      page.getByRole("navigation", { name: "Menú principal" }),
    ).toBeVisible();

    // Tier badge in the sidebar matches the current project
    await expect(
      page.getByText(TIER_BADGE[tier], { exact: true }),
    ).toBeVisible();
  });
});
