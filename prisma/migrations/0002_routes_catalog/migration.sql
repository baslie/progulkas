-- CreateEnum
CREATE TYPE "RouteDifficulty" AS ENUM ('EASY', 'MODERATE', 'CHALLENGING');

-- CreateEnum
CREATE TYPE "RouteAudience" AS ENUM ('WALK', 'RUN', 'FAMILY', 'BIKE', 'STROLLER');

-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "difficulty" "RouteDifficulty" NOT NULL,
    "distanceKm" DECIMAL(6, 2) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "suitableFor" "RouteAudience"[] NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "coverImageUrl" TEXT,
    "ratingAverage" DECIMAL(3, 2),
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Route_slug_key" ON "Route"("slug");

-- CreateIndex
CREATE INDEX "Route_isPublished_createdAt_idx" ON "Route"("isPublished", "createdAt");

-- CreateIndex
CREATE INDEX "Route_region_city_idx" ON "Route"("region", "city");
