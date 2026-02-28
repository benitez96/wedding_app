import { chromium } from "@playwright/test";
import { PrismaClient } from "../../app/generated/prisma/index.js";
import { hashPassword } from "better-auth/crypto";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { E2E_STATE_DIR, AUTH_STATE } from "../../playwright.config";

// ─── Test user definitions ─────────────────────────────────────────────────
//
// FREE:    No Subscription record → tier defaults to "FREE" in enforcement logic
//          (see lib/tier-enforcement.ts: subscription?.tier ?? "FREE")
// BASIC:   Subscription(tier: BASIC,   status: active) → unlimited guests, 1 event
// COMPANY: Subscription(tier: COMPANY, status: active) → unlimited everything + collaborators

const TEST_USERS = [
  { key: "free", email: "e2e-free@test.local", tier: null },
  { key: "basic", email: "e2e-basic@test.local", tier: "BASIC" as const },
  {
    key: "company",
    email: "e2e-company@test.local",
    tier: "COMPANY" as const,
  },
] as const;

export type TestUserKey = (typeof TEST_USERS)[number]["key"];

export interface Credentials {
  email: string;
  password: string;
  /** InvitationToken.id for the test invitation — used by public invitation flow tests */
  invitationToken: string;
  /** EventInviteLink.token — only populated for the 'company' tier */
  inviteLinkToken?: string;
}

export type CredentialsMap = Record<TestUserKey, Credentials>;

const CREDS_FILE = path.join(E2E_STATE_DIR, "credentials.json");

function generatePassword(): string {
  // Always satisfies: min 8 chars, upper, lower, digit, special
  return `${crypto.randomBytes(12).toString("base64url")}Aa1!`;
}

function generateSlug(key: string): string {
  return `e2e-${key}-${crypto.randomBytes(4).toString("hex")}`;
}

export default async function globalSetup() {
  fs.mkdirSync(E2E_STATE_DIR, { recursive: true });

  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.TEST_DATABASE_URL } },
  });

  const credentials = {} as CredentialsMap;

  try {
    // ── 1. Clean up any leftover test users from previous runs ──────────────
    await prisma.user.deleteMany({
      where: { email: { in: TEST_USERS.map((u) => u.email) } },
    });

    // ── 2. Create fresh test users ──────────────────────────────────────────
    for (const def of TEST_USERS) {
      const password = generatePassword();
      // Better Auth uses scrypt (salt:key hex format) — NOT bcrypt
      const hashedPassword = await hashPassword(password);

      credentials[def.key] = {
        email: def.email,
        password,
        invitationToken: "", // filled below
      };

      const user = await prisma.user.create({
        data: {
          name: `E2E ${def.key.toUpperCase()} User`,
          email: def.email,
          emailVerified: true,
        },
      });

      // Account record (Better Auth credential provider)
      await prisma.account.create({
        data: {
          id: `${user.id}_credential`,
          accountId: user.id,
          providerId: "credential",
          userId: user.id,
          password: hashedPassword,
        },
      });

      // Subscription record only for paid tiers
      // FREE users have no record → enforcement defaults to FREE
      if (def.tier) {
        await prisma.subscription.create({
          data: {
            userId: user.id,
            tier: def.tier,
            status: "active",
          },
        });
      }

      // Create a default event so the dashboard renders (not /backoffice/events/new)
      const event = await prisma.event.create({
        data: {
          name: `E2E ${def.key.toUpperCase()} Wedding`,
          slug: generateSlug(def.key),
          ownerId: user.id,
        },
      });

      // ── 2a. Create a test invitation + token for the public invitation flow ─
      //
      // The InvitationToken.id is a 21-char base64url string used as the URL
      // token: /r/{token}. Tests read this from credentials.json.
      const invitation = await prisma.invitation.create({
        data: {
          eventId: event.id,
          guestName: "E2E Guest",
          maxGuests: 2,
        },
      });

      // InvitationToken.id must be a 21-char base64url string (matches app convention)
      const invitationTokenId = crypto
        .randomBytes(16)
        .toString("base64url")
        .slice(0, 21);

      await prisma.invitationToken.create({
        data: {
          id: invitationTokenId,
          invitationId: invitation.id,
          isActive: true,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year
        },
      });

      credentials[def.key].invitationToken = invitationTokenId;

      // ── 2c. Seed default sections so the public invitation page renders content ─
      //
      // DynamicSectionRenderer only renders enabled SectionConfiguration records.
      // Without seeded sections the public invitation page is blank and the
      // should-display-public-invitation test cannot assert RSVP or QR content.
      await prisma.sectionConfiguration.createMany({
        data: [
          { eventId: event.id, key: "rsvp", isEnabled: true, order: 0, settings: {} },
          { eventId: event.id, key: "qr", isEnabled: true, order: 1, settings: {} },
        ],
      });

      // ── 2b. For COMPANY tier: create an invite link for collaborator join tests ─
      if (def.tier === "COMPANY") {
        const inviteLinkToken = crypto.randomBytes(16).toString("hex");

        await prisma.eventInviteLink.create({
          data: {
            eventId: event.id,
            token: inviteLinkToken,
            permissions: BigInt(0),
            createdBy: user.id,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year
            maxUses: 10,
          },
        });

        credentials[def.key].inviteLinkToken = inviteLinkToken;
      }

      console.log(
        `[E2E Setup] Created ${def.key} user (${def.tier ?? "FREE"}): ${def.email}`,
      );
    }

    fs.writeFileSync(CREDS_FILE, JSON.stringify(credentials, null, 2));
  } finally {
    await prisma.$disconnect();
  }

  // ── 3. Clear sign-in rate limits so test logins are never blocked ──────────
  //
  // Better Auth stores rate-limit counters in the DB (key = "{IP}|/path").
  // After several test runs the counter for localhost can hit the 5-per-minute
  // cap, causing subsequent logins to silently fail.  Wipe only sign-in entries
  // before each setup run — other limits are left untouched.
  {
    const cleanupPrisma = new PrismaClient({
      datasources: { db: { url: process.env.TEST_DATABASE_URL } },
    });
    try {
      await cleanupPrisma.$executeRaw`DELETE FROM rate_limit WHERE key LIKE '%/sign-in/email%'`;
      console.log("[E2E Setup] Cleared sign-in rate-limit records.");
    } finally {
      await cleanupPrisma.$disconnect();
    }
  }

  // ── 4. Login each user via browser and persist auth state ─────────────────
  const browser = await chromium.launch();

  for (const def of TEST_USERS) {
    const { email, password } = credentials[def.key];
    const context = await browser.newContext();
    const page = await context.newPage();

    // In dev mode, Next.js may be compiling on first request — allow up to 60s.
    await page.goto("http://localhost:3000/backoffice/login", {
      timeout: 60_000,
    });

    // HeroUI renders a "show password" toggle alongside the input — use name attributes
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.getByRole("button", { name: "Iniciar Sesión" }).click();

    await page.waitForURL("**/backoffice/dashboard**", { timeout: 30_000 });

    const stateFile = AUTH_STATE[def.key.toUpperCase() as keyof typeof AUTH_STATE];
    await context.storageState({ path: stateFile });
    await context.close();

    console.log(`[E2E Setup] Saved auth state → ${path.basename(stateFile)}`);
  }

  await browser.close();
  console.log("[E2E Setup] Done. All 3 tier sessions ready.");
}
