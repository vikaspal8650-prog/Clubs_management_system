-- Preserve existing rows. Abort with actionable details if legacy duplicates
-- must be reviewed before enforcing case-insensitive roll-number uniqueness.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "User"
    WHERE "rollNumber" IS NOT NULL
    GROUP BY lower("rollNumber")
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate non-null User.rollNumber values exist (case-insensitive); resolve them before applying 20261115000000_unique_user_roll_number.';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "User_rollNumber_lower_key"
  ON "User" (lower("rollNumber"))
  WHERE "rollNumber" IS NOT NULL;
