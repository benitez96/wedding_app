-- AlterTable
ALTER TABLE "invitations" ADD COLUMN     "checkInCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastCheckInAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "check_ins" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitationId" TEXT NOT NULL,
    "checkedInBy" TEXT NOT NULL,
    "guestsCount" INTEGER NOT NULL DEFAULT 1,
    "clientId" TEXT NOT NULL,
    "deviceId" TEXT,
    "syncedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "exceededCapacity" BOOLEAN NOT NULL DEFAULT false,
    "capacityNote" TEXT,

    CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "check_ins_clientId_key" ON "check_ins"("clientId");

-- CreateIndex
CREATE INDEX "check_ins_invitationId_idx" ON "check_ins"("invitationId");

-- CreateIndex
CREATE INDEX "check_ins_syncedAt_idx" ON "check_ins"("syncedAt");

-- CreateIndex
CREATE INDEX "check_ins_clientId_idx" ON "check_ins"("clientId");

-- CreateIndex
CREATE INDEX "check_ins_deletedAt_idx" ON "check_ins"("deletedAt");

-- CreateIndex
CREATE INDEX "check_ins_exceededCapacity_idx" ON "check_ins"("exceededCapacity");

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "invitations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_checkedInBy_fkey" FOREIGN KEY ("checkedInBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
