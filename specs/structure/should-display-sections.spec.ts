import { test, expect } from "@playwright/test";

test.describe("Estructura", () => {
  test("should display the structure page with section catalog", async ({
    page,
  }) => {
    await page.goto("/backoffice/estructura");

    // Page heading
    await expect(
      page.getByRole("heading", { name: "Estructura", level: 1 }),
    ).toBeVisible();

    // The catalog card is always present
    await expect(
      page.getByRole("heading", { name: "Componentes Disponibles" }),
    ).toBeVisible();

    // At least one catalog item with an add overlay button must exist
    const catalogButtons = page.getByRole("button", { name: /^Agregar / });
    const count = await catalogButtons.count();
    expect(count).toBeGreaterThan(0);
  });
});
