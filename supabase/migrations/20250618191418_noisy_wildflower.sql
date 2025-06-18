/*
  # Add orientation column to stories table

  1. Changes
    - Add `orientation` column to `stories` table with default value 'landscape'
    - Column accepts 'landscape' or 'portrait' values
    - Includes constraint to ensure only valid values are accepted

  2. Security
    - No changes to existing RLS policies needed
*/

-- Add orientation column to stories table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stories' AND column_name = 'orientation'
  ) THEN
    ALTER TABLE stories ADD COLUMN orientation text DEFAULT 'landscape';
    
    -- Add constraint to ensure only valid orientation values
    ALTER TABLE stories ADD CONSTRAINT stories_orientation_check 
      CHECK (orientation = ANY (ARRAY['landscape'::text, 'portrait'::text]));
  END IF;
END $$;