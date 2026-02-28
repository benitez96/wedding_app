import { test, expect } from "@playwright/test";

test.describe("Estructura", () => {
  test("should save section settings in the section editor", async ({
    page,
  }) => {
    const tier = test.info().project.name;
    if (tier === "free") {
      test.skip(true, "FREE tier cannot customize sections");
      return;
    }

    await page.goto("/backoffice/structure");

    // Ensure at least one active section exists
    const sectionsHeading = page.getByRole("heading", {
      name: "Secciones de la Invitación",
    });
    const hasSections = await sectionsHeading.isVisible().catch(() => false);

    if (!hasSections) {
      const addButton = page
        .getByRole("button", { name: /^Agregar / })
        .first();
      await addButton.click({ force: true });
      await expect(sectionsHeading).toBeVisible({ timeout: 10_000 });
    }

    // Navigate into the first section editor
    const configurarButton = page
      .getByRole("button", { name: "Configurar" })
      .first();
    await expect(configurarButton).toBeVisible();
    await configurarButton.click();

    await page.waitForURL("**/backoffice/structure/**", { timeout: 10_000 });

    // Find the first textbox in the settings form and update its value
    const firstTextbox = page.getByRole("textbox").first();
    await expect(firstTextbox).toBeVisible({ timeout: 10_000 });

    const uniqueValue = `E2E Saved ${Date.now()}`;
    await firstTextbox.fill(uniqueValue);

    // Click "Guardar Cambios"
    const saveButton = page.getByRole("button", { name: "Guardar Cambios" });
    await saveButton.click();

    // Wait for the save to complete (button stops loading)
    await expect(saveButton).not.toBeDisabled({ timeout: 10_000 });

    // Reload and verify the value was persisted
    await page.reload();
    const persistedTextbox = page.getByRole("textbox").first();
    await expect(persistedTextbox).toBeVisible({ timeout: 10_000 });
    await expect(persistedTextbox).toHaveValue(uniqueValue);
  });
});
