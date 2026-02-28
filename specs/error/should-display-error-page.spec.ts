import { test, expect } from "@playwright/test";

// Error page is public — no auth needed
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Error Page", () => {
  test("should display correct error UI for each error message type", async ({
    page,
  }) => {
    // token-invalido
    await page.goto("/error?message=token-invalido");
    await expect(page.getByText("Token Inválido")).toBeVisible();
    await expect(
      page.getByText("El enlace de invitación no es válido o ha expirado."),
    ).toBeVisible();

    // token-ya-usado
    await page.goto("/error?message=token-ya-usado");
    await expect(page.getByText("Invitación ya utilizada")).toBeVisible();
    await expect(
      page.getByText("Esta invitación ya ha sido utilizada."),
    ).toBeVisible();

    // necesita-invitacion
    await page.goto("/error?message=necesita-invitacion");
    await expect(page.getByText("Necesitas una invitación")).toBeVisible();
    await expect(
      page.getByText("Para acceder a esta página necesitas un enlace de invitación."),
    ).toBeVisible();

    // rate-limit-exceeded
    await page.goto("/error?message=rate-limit-exceeded");
    await expect(page.getByText("Demasiados Intentos")).toBeVisible();
    await expect(
      page.getByText("Has excedido el límite de intentos."),
    ).toBeVisible();
  });
});
