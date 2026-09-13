-- AlterTable
ALTER TABLE "container_sessions" ADD COLUMN "guestToken" TEXT;

-- CreateIndex
CREATE INDEX "container_sessions_guestToken_idx" ON "container_sessions"("guestToken");
