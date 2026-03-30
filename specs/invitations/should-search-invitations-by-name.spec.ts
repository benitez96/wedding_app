import { test, expect } from "@playwright/test";

test.describe("Invitations Management", () => {
  test("should search invitations by name", async ({ page }) => {
    await page.goto("/backoffice/invitations");

    // Create an invitation with a unique searchable name
    await page.getByRole("button", { name: "Crear Invitación" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(page.locator('input[name="guestName"]')).toBeVisible({
      timeout: 10_000,
    });

    await page
      .locator('input[name="guestName"]')
      .fill("Buscable García Rodríguez");
    await dialog.getByRole("button", { name: "Crear Invitación" }).click();
    await expect(dialog).not.toBeVisible({ timeout: 10_000 });

    // Verify invitation is in the table
    const table = page.getByRole("grid", { name: "Tabla de invitaciones" });
    await expect(table).toContainText("Buscable García Rodríguez");

    // Type in the search box (debounced — 300 ms)
    const searchInput = page.getByPlaceholder("Buscar por nombre o apodo...");
    await searchInput.fill("Buscable");

    // Wait for the search to debounce and apply
    await page.waitForTimeout(500);

    // The matching invitation must still be visible
    await expect(table).toContainText("Buscable García Rodríguez");

    // Clear the search
    await searchInput.clear();
    await page.waitForTimeout(500);

    // Table still shows the invitation after clearing
    await expect(table).toContainText("Buscable García Rodríguez");
  });
});
