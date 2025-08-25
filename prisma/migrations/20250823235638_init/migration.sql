-- CreateTable
CREATE TABLE "public"."invitations" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "guestName" TEXT NOT NULL,
    "guestNickname" TEXT,
    "guestPhone" TEXT,
    "maxGuests" INTEGER NOT NULL DEFAULT 1,
    "hasResponded" BOOLEAN NOT NULL DEFAULT false,
    "isAttending" BOOLEAN,
    "guestCount" INTEGER,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invitation_tokens" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "firstAccessAt" TIMESTAMP(3),
    "lastAccessAt" TIMESTAMP(3),
    "deviceId" TEXT,
    "userAgent" TEXT,
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "invitationId" TEXT NOT NULL,

    CONSTRAINT "invitation_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admin_users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invitation_tokens_token_key" ON "public"."invitation_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_username_key" ON "public"."admin_users"("username");

-- AddForeignKey
ALTER TABLE "public"."invitation_tokens" ADD CONSTRAINT "invitation_tokens_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "public"."invitations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
