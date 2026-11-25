ALTER TABLE "ClubCoordinator"
  ADD COLUMN IF NOT EXISTS "facultyId" TEXT,
  ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'ACTIVE';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ClubCoordinator_facultyId_fkey'
  ) THEN
    ALTER TABLE "ClubCoordinator"
      ADD CONSTRAINT "ClubCoordinator_facultyId_fkey"
      FOREIGN KEY ("facultyId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
