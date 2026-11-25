CREATE TABLE "CertificateRecord" (
  "id" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "submittedById" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "clubId" TEXT NOT NULL,
  "department" TEXT NOT NULL,
  "position" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CertificateRecord_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CertificateRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CertificateRecord_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CertificateRecord_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CertificateRecord_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "CertificateRecord_studentId_idx" ON "CertificateRecord"("studentId");
CREATE INDEX "CertificateRecord_submittedById_idx" ON "CertificateRecord"("submittedById");
CREATE INDEX "CertificateRecord_clubId_status_idx" ON "CertificateRecord"("clubId", "status");
CREATE INDEX "CertificateRecord_department_status_idx" ON "CertificateRecord"("department", "status");
