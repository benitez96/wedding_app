import { test, expect } from "@playwright/test";
import { PrismaClient } from "../../app/generated/prisma/index.js";
import { hashPassword } from "better-auth/crypto";
import crypto from "node:crypto";

const COLLABORATOR_NAME = "E2E Collaborator To Remove";

test.beforeAll(async () => {
  // Only meaningful for the COMPANY project but harmless to run for all.
  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.TEST_DATABASE_URL } },
  });

  try {
    // Find the COMPANY test user and their first event
    const companyUser = await prisma.user.findUnique({
      where: { email: "e2e-company@test.local" },
      include: { ownedEvents: { take: 1 } },
    });

    if (!companyUser || companyUser.ownedEvents.length === 0) return;

    const event = companyUser.ownedEvents[0];

    // Create a disposable user to be added as a collaborator
    const email = `e2e-collab-rm-${crypto.randomBytes(4).toString("hex")}@test.local`;
    const hashedPassword = await hashPassword(
      `${crypto.randomBytes(12).toString("base64url")}Aa1!`,
    );

    const collab = await prisma.user.create({
      data: {
        name: COLLABORATOR_NAME,
        email,
        emailVerified: true,
      },
    });

    await prisma.account.create({
      data: {
        id: `${collab.id}_credential`,
        accountId: collab.id,
        providerId: "credential",
        userId: collab.id,
        password: hashedPassword,
      },
    });

    // Insert as an active EventMember (revokedAt = null means active)
    await prisma.eventMember.create({
      data: {
        eventId: event.id,
        userId: collab.id,
        permissions: BigInt(0),
        invitedBy: companyUser.id,
      },
    });
  } finally {
    await prisma.$disconnect();
  }
});

test.describe("Collaborators Management", () => {
  test("should remove a collaborator", async ({ page }) => {
    const tier = test.info().project.name;
    if (tier !== "company") {
      test.skip(true, "Collaborator management is only available for COMPANY tier");
      return;
    }

    await page.goto("/backoffice/collaborators");

    // "Miembros Actuales" section is visible
    await expect(
      page.getByRole("heading", { name: "Miembros Actuales" }),
    ).toBeVisible();

    // The collaborator we seeded in beforeAll should appear in the table
    await expect(page.getByText(COLLABORATOR_NAME)).toBeVisible({
      timeout: 10_000,
    });

    // Register the dialog handler BEFORE the click that triggers it
    page.once("dialog", (dialog) => dialog.accept());

    // Click "Revocar acceso" for the target collaborator row
    const collabRow = page
      .locator("tr")
      .filter({ hasText: COLLABORATOR_NAME })
      .first();
    await collabRow.getByRole("button", { name: "Revocar acceso" }).click();

    // After the confirmation, the collaborator row should disappear
    await expect(page.getByText(COLLABORATOR_NAME)).not.toBeVisible({
      timeout: 10_000,
    });
  });
});
