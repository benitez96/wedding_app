import { test, expect } from "@playwright/test";

// Sign-up is a public page — clear stored auth to avoid auto-redirect
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Sign-Up", () => {
  test("should display sign-up form with all required fields", async ({
    page,
  }) => {
    await page.goto("/sign-up");

    // All form fields are present
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();

    // Submit button is present
    await expect(
      page.getByRole("button", { name: /crear cuenta|registrarse|sign up/i }),
    ).toBeVisible();

    // Password too short triggers validation error
    await page.locator('input[name="name"]').fill("Test User");
    await page.locator('input[name="email"]').fill("test@example.com");
    await page.locator('input[name="password"]').fill("short");
    await page.locator('input[name="confirmPassword"]').fill("short");
    await page.getByRole("button", { name: /crear cuenta|registrarse|sign up/i }).click();

    await expect(
      page.getByText("La contraseña debe tener al menos 10 caracteres"),
    ).toBeVisible({ timeout: 5_000 });
  });
});
