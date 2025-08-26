/*
  Warnings:

  - You are about to drop the column `token` on the `invitation_tokens` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."invitation_tokens_token_key";

-- AlterTable
ALTER TABLE "public"."invitation_tokens" DROP COLUMN "token",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
