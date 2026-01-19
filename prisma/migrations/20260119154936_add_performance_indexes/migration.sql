-- CreateIndex
CREATE INDEX "invitation_tokens_invitationId_idx" ON "invitation_tokens"("invitationId");

-- CreateIndex
CREATE INDEX "invitation_tokens_isActive_idx" ON "invitation_tokens"("isActive");

-- CreateIndex
CREATE INDEX "rate_limit_attempts_ip_actionType_timestamp_idx" ON "rate_limit_attempts"("ip", "actionType", "timestamp");

-- CreateIndex
CREATE INDEX "rate_limit_blocks_ip_actionType_blockedUntil_idx" ON "rate_limit_blocks"("ip", "actionType", "blockedUntil");
