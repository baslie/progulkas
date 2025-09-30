-- AlterTable
ALTER TABLE "Route"
  ADD COLUMN "descriptionMarkdown" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "howToGet" TEXT,
  ADD COLUMN "howToReturn" TEXT,
  ADD COLUMN "safetyNotes" TEXT,
  ADD COLUMN "interestingFacts" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "trackGeoJson" JSONB,
  ADD COLUMN "pointsOfInterest" JSONB;

-- Remove the default after migrating existing rows
ALTER TABLE "Route" ALTER COLUMN "descriptionMarkdown" DROP DEFAULT;
