import { test } from "@playwright/test";

/**
 * Seed file for the Playwright MCP planner/generator.
 * Logs in as the admin user and navigates to the backoffice so the planner
 * can explore the full feature set.
 *
 * This file is for exploration only — actual tests use per-tier auth states
 * created by the global setup (tests/e2e/global-setup.ts).
 */
test("seed", async ({ page }) => {
  await page.goto("http://localhost:3000/backoffice/login");
  await page.locator('input[name="email"]').fill("admin@invify.ar");
  await page.locator('input[name="password"]').fill("Admin123_admin");
  await page.getByRole("button", { name: "Iniciar Sesión" }).click();
  // /backoffice redirects to /backoffice/dashboard — wait for that, not the login page
  await page.waitForURL("**/backoffice/dashboard**", { timeout: 15_000 });
});
