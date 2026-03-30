import { test, expect } from "@playwright/test";

test.describe("Theming", () => {
  test("should show the custom color picker when Personalizado theme is selected", async ({
    page,
  }) => {
    await page.goto("/backoffice/theming");

    await expect(
      page.getByRole("heading", { name: "Theming", level: 1 }),
    ).toBeVisible();

    // Select the "Personalizado" theme option
    // HeroUI radio inputs require force-click to bypass pointer interception
    await page.getByText("Personalizado").click({ force: true });

    // The CustomThemePicker section should appear below the radio group
    await expect(
      page.getByText("Personalizá los colores de tu tema"),
    ).toBeVisible({ timeout: 5_000 });

    // Five color swatches are rendered — one per COLOR_SLOT
    const swatches = page.getByRole("button", { name: /^Cambiar / });
    await expect(swatches).toHaveCount(5);

    // Click the "Fondo de página" swatch to open the floating color picker
    await page
      .getByRole("button", { name: "Cambiar Fondo de página" })
      .click();

    // A floating HexColorPicker + hex text input should appear
    const hexInput = page.getByRole("textbox", {
      name: /Valor hex de Fondo de página/,
    });
    await expect(hexInput).toBeVisible({ timeout: 3_000 });

    // The hex input contains a valid 7-char hex value (#rrggbb)
    const currentHex = await hexInput.inputValue();
    expect(currentHex).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});
