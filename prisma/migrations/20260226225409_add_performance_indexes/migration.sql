-- AlterEnum
ALTER TYPE "SecurityLogType" ADD VALUE 'user_setup_failed';

-- CreateIndex
CREATE INDEX "check_ins_invitationId_deletedAt_idx" ON "check_ins"("invitationId", "deletedAt");

-- CreateIndex
CREATE INDEX "check_ins_checkedInBy_createdAt_idx" ON "check_ins"("checkedInBy", "createdAt");

-- CreateIndex
CREATE INDEX "event_invite_links_eventId_isActive_idx" ON "event_invite_links"("eventId", "isActive");

-- CreateIndex
CREATE INDEX "event_invite_links_expiresAt_idx" ON "event_invite_links"("expiresAt");

-- CreateIndex
CREATE INDEX "event_members_userId_revokedAt_idx" ON "event_members"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "event_members_eventId_revokedAt_idx" ON "event_members"("eventId", "revokedAt");

-- CreateIndex
CREATE INDEX "invitation_tokens_invitationId_isActive_isUsed_idx" ON "invitation_tokens"("invitationId", "isActive", "isUsed");

-- CreateIndex
CREATE INDEX "invitation_tokens_expiresAt_idx" ON "invitation_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "invitations_eventId_hasResponded_idx" ON "invitations"("eventId", "hasResponded");

-- CreateIndex
CREATE INDEX "invitations_eventId_isAttending_idx" ON "invitations"("eventId", "isAttending");

-- CreateIndex
CREATE INDEX "invitations_createdAt_idx" ON "invitations"("createdAt");

-- CreateIndex
CREATE INDEX "security_logs_type_createdAt_idx" ON "security_logs"("type", "createdAt");

-- CreateIndex
CREATE INDEX "security_logs_createdAt_idx" ON "security_logs"("createdAt");
