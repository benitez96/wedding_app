import { test, expect } from "@playwright/test";

test.describe("Estructura", () => {
  test("should delete an active section", async ({ page }) => {
    const tier = test.info().project.name;
    if (tier === "free") {
      test.skip(true, "FREE tier cannot manage sections");
      return;
    }

    await page.goto("/backoffice/structure");

    // Add a section via the catalog so we have a known section to delete.
    // The "Agregar" overlay buttons are opacity-0 by default — force-click.
    const addButton = page.getByRole("button", { name: /^Agregar / }).first();
    await expect(addButton).toBeAttached({ timeout: 5_000 });
    await addButton.click({ force: true });

    // Wait for the sections list to appear
    const sectionsHeading = page.getByRole("heading", {
      name: "Secciones de la Invitación",
    });
    await expect(sectionsHeading).toBeVisible({ timeout: 10_000 });

    // Count current "Eliminar" buttons (one per active section)
    const deleteButtons = page.getByRole("button", { name: "Eliminar" });
    const countBefore = await deleteButtons.count();
    expect(countBefore).toBeGreaterThan(0);

    // Click the first delete button — SectionsList removes optimistically (no confirm dialog)
    await deleteButtons.first().click();

    // One fewer section should be visible after deletion
    await expect(page.getByRole("button", { name: "Eliminar" })).toHaveCount(
      countBefore - 1,
      { timeout: 10_000 },
    );
  });
});
