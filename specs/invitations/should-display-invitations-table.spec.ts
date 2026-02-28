import { test, expect } from "@playwright/test";

test.describe("Invitations Management", () => {
  test("should display the invitations table", async ({ page }) => {
    await page.goto("/backoffice/invitations");

    await expect(
      page.getByRole("heading", { name: "Gestión de Invitaciones" }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Crear Invitación" }),
    ).toBeVisible();

    await expect(page.getByRole("grid")).toBeVisible();

    await expect(
      page.getByRole("columnheader", { name: "INVITADO", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "TELÉFONO" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "ESTADO" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "MÁX. INVITADOS" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "CONFIRMADOS" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "FECHA RESPUESTA" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "ACCIONES" }),
    ).toBeVisible();
  });
});
