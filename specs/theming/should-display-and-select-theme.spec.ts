import { test, expect } from "@playwright/test";

test.describe("Theming", () => {
  test("should display themes and enable save on selection change", async ({
    page,
  }) => {
    await page.goto("/backoffice/theming");

    await expect(
      page.getByRole("heading", { name: "Theming", level: 1 }),
    ).toBeVisible();

    // Radio group with all available themes
    await expect(page.getByText("Selecciona un tema")).toBeVisible();

    // All predefined themes and the custom option must be listed
    await expect(page.getByText("Clásico")).toBeVisible();
    await expect(page.getByText("Cálido")).toBeVisible();
    await expect(page.getByText("Verde Pastel")).toBeVisible();
    await expect(page.getByText("Mocha")).toBeVisible();
    await expect(page.getByText("Personalizado")).toBeVisible();

    // "Guardar Cambios" is disabled when no change has been made
    const saveButton = page.getByRole("button", { name: "Guardar Cambios" });
    await expect(saveButton).toBeVisible();

    // Click a different theme to guarantee a change ("Cálido" is not the default)
    // Use force:true because HeroUI's radio input overlays the label text
    await page.getByText("Cálido").click({ force: true });

    // After changing the selection the save button must become enabled
    await expect(saveButton).toBeEnabled();
  });
});
