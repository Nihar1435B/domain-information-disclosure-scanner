/*
  # Fix: Add user_id to Scan Results & Create Insert Policy

  This migration corrects a critical schema error in the `scan_results` table
  where the `user_id` column was missing. It then adds the necessary RLS
  policy to allow users to insert their own scan findings.

  This file replaces the previous version which failed because the column did not exist.

  1.  **Schema Correction**:
      - Adds the `user_id` column to `public.scan_results`.
      - Sets it as a foreign key to `auth.users(id)`.
      - Backfills the `user_id` from the parent `scans` table for data integrity.
      - Makes the column `NOT NULL`.
      - Adds a performance index on the new column.

  2.  **RLS Policy**:
      - Creates the `INSERT` policy for `scan_results`. This policy
        previously failed because the `user_id` column did not exist.
*/

-- Step 1: Add the user_id column to the scan_results table if it doesn't exist.
ALTER TABLE public.scan_results
ADD COLUMN IF NOT EXISTS user_id uuid;

-- Step 2: Add the foreign key constraint to link to the auth.users table.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'scan_results_user_id_fkey' AND conrelid = 'public.scan_results'::regclass
  ) THEN
    ALTER TABLE public.scan_results
    ADD CONSTRAINT scan_results_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END;
$$;

-- Step 3: Backfill user_id for any existing rows from the parent scan.
UPDATE public.scan_results sr
SET user_id = s.user_id
FROM public.scans s
WHERE sr.scan_id = s.id AND sr.user_id IS NULL;

-- Step 4: Now that the column is populated, set it to NOT NULL.
ALTER TABLE public.scan_results
ALTER COLUMN user_id SET NOT NULL;

-- Step 5: Add an index for performance.
CREATE INDEX IF NOT EXISTS scan_results_user_id_idx ON public.scan_results(user_id);

-- Step 6: Create the RLS policy that was previously failing.
DROP POLICY IF EXISTS "Users can create scan results for themselves" ON public.scan_results;
CREATE POLICY "Users can create scan results for themselves"
    ON public.scan_results FOR INSERT
    WITH CHECK (auth.uid() = user_id);
