-- CreateEnum
CREATE TYPE "RouteCommentStatus" AS ENUM ('PENDING', 'PUBLISHED', 'REJECTED', 'HIDDEN');
CREATE TYPE "NotificationType" AS ENUM ('ROUTE_COMMENT', 'COMMENT_REPLY', 'ROUTE_RATING', 'COMMENT_FLAGGED');

-- AlterTable
ALTER TABLE "Route"
  ADD COLUMN "commentCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable RouteRating
CREATE TABLE "RouteRating" (
  "id" TEXT NOT NULL,
  "routeId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "value" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RouteRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable RouteComment
CREATE TABLE "RouteComment" (
  "id" TEXT NOT NULL,
  "routeId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "parentId" TEXT,
  "content" TEXT NOT NULL,
  "status" "RouteCommentStatus" NOT NULL DEFAULT 'PENDING',
  "spamScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "isFlagged" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RouteComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable Notification
CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "data" JSONB NOT NULL,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RouteRating_routeId_userId_key" ON "RouteRating"("routeId", "userId");
CREATE INDEX "RouteRating_routeId_value_idx" ON "RouteRating"("routeId", "value");
CREATE INDEX "RouteComment_routeId_status_createdAt_idx" ON "RouteComment"("routeId", "status", "createdAt");
CREATE INDEX "RouteComment_authorId_createdAt_idx" ON "RouteComment"("authorId", "createdAt");
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- AddForeignKey
ALTER TABLE "RouteRating"
  ADD CONSTRAINT "RouteRating_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RouteRating"
  ADD CONSTRAINT "RouteRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RouteComment"
  ADD CONSTRAINT "RouteComment_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RouteComment"
  ADD CONSTRAINT "RouteComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RouteComment"
  ADD CONSTRAINT "RouteComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "RouteComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
