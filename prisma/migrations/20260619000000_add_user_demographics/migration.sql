-- Add demographic fields to User
ALTER TABLE "User" ADD COLUMN "ageRange" TEXT;
ALTER TABLE "User" ADD COLUMN "country" TEXT;
ALTER TABLE "User" ADD COLUMN "region" TEXT;
