import { test, expect } from "@playwright/test";

test.describe("Estructura", () => {
  test("should add a new section from the catalog", async ({ page }) => {
    await page.goto("/backoffice/structure");

    // Find the first non-active catalog item and hover to reveal the add button
    const firstCatalogButton = page
      .getByRole("button", { name: /^Agregar / })
      .first();
    await expect(firstCatalogButton).toBeAttached({ timeout: 5_000 });

    // Get the section name from the aria-label ("Agregar <Section Name>")
    const ariaLabel = await firstCatalogButton.getAttribute("aria-label");
    const sectionName = ariaLabel?.replace("Agregar ", "") ?? "";

    // The overlay button is opacity-0 by default (only visible on group-hover).
    // Playwright deems opacity-0 elements non-visible and hover() would time out.
    // Force-click dispatches the click without actionability checks.
    await firstCatalogButton.click({ force: true });

    // After adding, the "Secciones de la Invitación" card should appear
    // (or already be present from a prior test) containing our section name
    await expect(
      page.getByRole("heading", { name: "Secciones de la Invitación" }),
    ).toBeVisible({ timeout: 10_000 });

    if (sectionName) {
      await expect(page.getByText(sectionName).first()).toBeVisible();
    }
  });
});
