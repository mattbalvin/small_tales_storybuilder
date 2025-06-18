/*
  # Add status column to stories table

  1. Changes
    - Add `status` column to `stories` table with default value 'draft'
    - Column allows values: 'draft', 'published', 'archived'
    - Add check constraint to ensure valid status values

  2. Security
    - No changes to existing RLS policies needed
*/

-- Add status column to stories table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stories' AND column_name = 'status'
  ) THEN
    ALTER TABLE stories ADD COLUMN status text DEFAULT 'draft';
  END IF;
END $$;

-- Add check constraint for valid status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'stories_status_check'
  ) THEN
    ALTER TABLE stories ADD CONSTRAINT stories_status_check 
    CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text]));
  END IF;
END $$;