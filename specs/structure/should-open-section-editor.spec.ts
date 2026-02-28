import { test, expect } from "@playwright/test";

test.describe("Estructura", () => {
  test("should open section editor when clicking the settings button", async ({
    page,
  }) => {
    await page.goto("/backoffice/structure");

    const sectionsHeading = page.getByRole("heading", {
      name: "Secciones de la Invitación",
    });

    const hasSections = await sectionsHeading.isVisible().catch(() => false);

    if (!hasSections) {
      // No sections yet — add one via the catalog first.
      // Overlay buttons are opacity-0, requires force-click.
      const addButton = page.getByRole("button", { name: /^Agregar / }).first();
      await addButton.click({ force: true });
      await expect(sectionsHeading).toBeVisible({ timeout: 10_000 });
    }

    // Click the settings button on the first active section
    const configurarButton = page
      .getByRole("button", { name: "Configurar" })
      .first();
    await expect(configurarButton).toBeVisible();
    await configurarButton.click();

    // Should navigate to /backoffice/structure/{key}
    await page.waitForURL("**/backoffice/structure/**", { timeout: 10_000 });

    // Section editor page loads with a visible h1 heading matching the section name
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Section editor page has a back link and a save button
    await expect(page.getByText("Volver")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Guardar Cambios" }),
    ).toBeVisible();
  });
});
