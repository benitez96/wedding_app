import { test, expect } from "@playwright/test";

test.describe("Settings", () => {
  test("should display and save configuration settings", async ({ page }) => {
    await page.goto("/backoffice/settings");

    await expect(
      page.getByRole("heading", { name: "Configuraciones", level: 1 }),
    ).toBeVisible();

    // "Variables de Configuración" card heading
    await expect(
      page.getByRole("heading", { name: "Variables de Configuración" }),
    ).toBeVisible();

    // Photo upload URL input
    await expect(
      page.getByRole("textbox", { name: /URL de Subida de Fotos/ }),
    ).toBeVisible();

    // Wedding date input (plain <input type="datetime-local">)
    await expect(page.getByText("Fecha y Hora de la Boda")).toBeVisible();
    await expect(page.locator('input[name="weddingDateTime"]')).toBeVisible();

    // Reminder days input
    await expect(
      page.getByRole("spinbutton", { name: /Días de Recordatorio RSVP/ }),
    ).toBeVisible();

    // Check-In strategy heading and selector
    await expect(page.getByText("Estrategia de Check-In").first()).toBeVisible();

    // Save button is present
    const saveButton = page.getByRole("button", { name: "Guardar Cambios" });
    await expect(saveButton).toBeVisible();

    // Update the reminder days value and save
    const remindInput = page.getByRole("spinbutton", {
      name: /Días de Recordatorio RSVP/,
    });
    await remindInput.fill("35");
    await saveButton.click();

    // No fatal error should appear after saving
    await expect(page.locator(".text-red-600")).not.toBeVisible({
      timeout: 10_000,
    });

    // Settings are persisted: reload the page and verify the value is still 35
    await page.reload();
    await expect(
      page.getByRole("spinbutton", { name: /Días de Recordatorio RSVP/ }),
    ).toHaveValue("35", { timeout: 10_000 });
  });
});
