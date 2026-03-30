import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "../../app/generated/prisma/index.js";

// Use empty storage state — this test performs its own fresh login so it
// doesn't invalidate the project-level stored auth used by all other tests.
test.use({ storageState: { cookies: [], origins: [] } });

test.beforeAll(async () => {
  // Clear sign-in rate limits so this fresh login isn't blocked
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
  test("should logout and redirect to login page", async ({ page }) => {
    const credentialsPath = path.join(
      process.cwd(),
      ".e2e-state",
      "credentials.json",
    );
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));
    const tier = test.info().project.name as "free" | "basic" | "company";
    const { email, password } = credentials[tier];

    // Login fresh so we don't invalidate the project's stored auth state
    await page.goto("/backoffice/login");
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.getByRole("button", { name: "Iniciar Sesión" }).click();
    await page.waitForURL("**/backoffice/dashboard**", { timeout: 30_000 });

    await expect(
      page.getByRole("navigation", { name: "Menú principal" }),
    ).toBeVisible();

    // Click the logout button in the sidebar
    await page.getByRole("button", { name: "Cerrar Sesión" }).click();

    // Wait for navigation away from dashboard
    await page.waitForURL(
      (url) => !url.pathname.includes("/backoffice/dashboard"),
      { timeout: 15_000 },
    );

    // Should land on login page
    await expect(page).toHaveURL(/\/backoffice\/login/);

    // Sidebar should no longer be visible
    await expect(
      page.getByRole("navigation", { name: "Menú principal" }),
    ).not.toBeVisible();
  });
});
