import { test, expect } from "@playwright/test";
import { PrismaClient } from "../../app/generated/prisma/index.js";
import { hashPassword } from "better-auth/crypto";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// Use empty storage state — this test performs its own fresh login as a
// second user so it does not touch the shared project auth state.
test.use({ storageState: { cookies: [], origins: [] } });

let collaboratorEmail: string;
let collaboratorPassword: string;

test.beforeAll(async () => {
  // Create a disposable "joiner" user for every project run.
  // The test body skips for non-company tiers, but the user creation is cheap.
  collaboratorEmail = `e2e-joiner-${crypto.randomBytes(4).toString("hex")}@test.local`;
  collaboratorPassword = `${crypto.randomBytes(12).toString("base64url")}Aa1!`;
  const hashedPassword = await hashPassword(collaboratorPassword);

  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.TEST_DATABASE_URL } },
  });

  try {
    const user = await prisma.user.create({
      data: {
        name: "E2E Joiner User",
        email: collaboratorEmail,
        emailVerified: true,
      },
    });

    await prisma.account.create({
      data: {
        id: `${user.id}_credential`,
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: hashedPassword,
      },
    });

    // Clear sign-in rate limits so the fresh login is not blocked
    await prisma.$executeRaw`DELETE FROM rate_limit WHERE key LIKE '%/sign-in/email%'`;
  } finally {
    await prisma.$disconnect();
  }
});

test.describe("Collaborator Join Flow", () => {
  test("should auto-accept invite and redirect to dashboard for an authenticated user", async ({
    page,
  }) => {
    const tier = test.info().project.name;
    if (tier !== "company") {
      test.skip(true, "Invite links are only available for the COMPANY tier");
      return;
    }

    const credentialsPath = path.join(
      process.cwd(),
      ".e2e-state",
      "credentials.json",
    );
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));
    const { inviteLinkToken } = credentials.company;

    // Login as the disposable joiner user
    await page.goto("/backoffice/login");
    await page.locator('input[name="email"]').fill(collaboratorEmail);
    await page.locator('input[name="password"]').fill(collaboratorPassword);
    await page.getByRole("button", { name: "Iniciar Sesión" }).click();

    // After login the joiner user has no events — wait for any backoffice URL
    await page.waitForURL((url) => url.pathname.startsWith("/backoffice"), {
      timeout: 30_000,
    });

    // Navigate to the COMPANY invite link while authenticated
    await page.goto(`/join/${inviteLinkToken}`);

    // The JoinPage server component detects the session, calls acceptInviteLink,
    // and redirects to /backoffice/dashboard on success
    await page.waitForURL("**/backoffice/dashboard**", { timeout: 15_000 });

    await expect(
      page.getByRole("heading", { name: "Dashboard", level: 1 }),
    ).toBeVisible();
  });
});
