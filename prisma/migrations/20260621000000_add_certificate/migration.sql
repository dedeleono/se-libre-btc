-- Certificate of completion
CREATE TYPE "CertificateDesign" AS ENUM ('STANDARD', 'PUNK');

CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "serial" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "design" "CertificateDesign" NOT NULL DEFAULT 'STANDARD',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Certificate_serial_key" ON "Certificate"("serial");
CREATE UNIQUE INDEX "Certificate_userId_courseId_key" ON "Certificate"("userId", "courseId");
CREATE INDEX "Certificate_userId_idx" ON "Certificate"("userId");
CREATE INDEX "Certificate_courseId_idx" ON "Certificate"("courseId");

ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
