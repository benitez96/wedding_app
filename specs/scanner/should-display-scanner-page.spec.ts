import { test, expect } from "@playwright/test";

test.describe("Scanner QR", () => {
  test("should display scanner page with header and instructions", async ({
    page,
  }) => {
    await page.goto("/backoffice/scanner");

    await expect(
      page.getByRole("heading", { name: "Scanner QR" }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Escanea los códigos QR de las invitaciones para registrar el ingreso al evento",
      ),
    ).toBeVisible();

    // Instructions section
    await expect(
      page.getByRole("heading", { name: "¿Cómo funciona?" }),
    ).toBeVisible();
    await expect(page.getByText(/Activar Scanner/)).toBeVisible();
    await expect(page.getByText(/Apunta la cámara/)).toBeVisible();
    await expect(page.getByText(/Verifica los datos/)).toBeVisible();
    await expect(
      page.getByText(/registra el check-in automáticamente/),
    ).toBeVisible();

    // Offline mode info box
    await expect(page.getByText(/Modo offline/)).toBeVisible();
  });
});
