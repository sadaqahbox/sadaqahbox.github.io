-- Migration 0015: Remove sadaqahsCollected, add totalValueExtra to Collection table
-- Remove sadaqahsCollected column
ALTER TABLE "Collection" DROP COLUMN "sadaqahsCollected";
-- Add totalValueExtra column for non-calculated amounts
ALTER TABLE "Collection" ADD COLUMN "totalValueExtra" text;
