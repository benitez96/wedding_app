import { test, expect } from "@playwright/test";

test.describe("Estructura", () => {
  test("should toggle section visibility", async ({ page }) => {
    await page.goto("/backoffice/estructura");

    // Ensure there is at least one section in the list
    // (runs after should-add-new-section which adds one)
    const sectionsHeading = page.getByRole("heading", {
      name: "Secciones de la Invitación",
    });

    const hasSections = await sectionsHeading.isVisible().catch(() => false);

    if (!hasSections) {
      // Add a section first if none exist
      const addButton = page.getByRole("button", { name: /^Agregar / }).first();
      // Force-click: overlay button is opacity-0 until group-hover, so hover()
      // would time out waiting for the element to be visible.
      await addButton.click({ force: true });
      await expect(sectionsHeading).toBeVisible({ timeout: 10_000 });
    }

    // Find the first visibility toggle button ("Ocultar" = currently enabled)
    const hideButton = page.getByRole("button", { name: "Ocultar" }).first();
    const showButton = page.getByRole("button", { name: "Mostrar" }).first();

    const isVisible = await hideButton.isVisible().catch(() => false);

    if (isVisible) {
      // Currently enabled → toggle off
      await hideButton.click();
      await expect(
        page.getByRole("button", { name: "Mostrar" }).first(),
      ).toBeVisible({ timeout: 5_000 });
    } else {
      // Currently disabled → toggle on
      await showButton.click();
      await expect(
        page.getByRole("button", { name: "Ocultar" }).first(),
      ).toBeVisible({ timeout: 5_000 });
    }
  });
});
