-- Add wallet simulator toggle to Chapter
ALTER TABLE "Chapter" ADD COLUMN "hasWalletSimulator" BOOLEAN NOT NULL DEFAULT false;
