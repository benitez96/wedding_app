import { test, expect } from "@playwright/test";

// Clear project-level storageState — tests the unauthenticated login error path
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Authentication", () => {
  test("should show error with invalid credentials", async ({ page }) => {
    await page.goto("/backoffice/login");

    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();

    await page.locator('input[name="email"]').fill("wrong@email.com");
    await page.locator('input[name="password"]').fill("wrongpassword");
    await page.getByRole("button", { name: "Iniciar Sesión" }).click();

    // LoginForm renders a red error div when authentication fails
    await expect(page.locator(".text-red-600").first()).toBeVisible({
      timeout: 10_000,
    });

    // URL must not have changed from login page
    await expect(page).toHaveURL(/\/backoffice\/login/);
  });
});
