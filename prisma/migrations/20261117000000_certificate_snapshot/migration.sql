-- Snapshot what a certificate attested at issuance; allow explicit revocation.
ALTER TABLE "Certificate"
  ADD COLUMN "finalQuizId" TEXT,
  ADD COLUMN "finalQuizScorePercent" DOUBLE PRECISION,
  ADD COLUMN "revokedAt" TIMESTAMP(3),
  ADD COLUMN "revokedReason" TEXT;
