/*
  # Add author_id column to stories table

  1. Changes
    - Add `author_id` column to `stories` table as a foreign key to `users` table
    - Add foreign key constraint to ensure data integrity
    - Add index for better query performance
    - Update RLS policies to use author_id for access control

  2. Security
    - Update existing RLS policies to properly restrict access based on author_id
    - Ensure only story authors can modify their stories
*/

-- Add author_id column to stories table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stories' AND column_name = 'author_id'
  ) THEN
    ALTER TABLE stories ADD COLUMN author_id uuid REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_stories_author_id ON stories(author_id);

-- Update RLS policies to use author_id
DROP POLICY IF EXISTS "Authenticated users can insert stories" ON stories;
DROP POLICY IF EXISTS "Authenticated users can update stories" ON stories;
DROP POLICY IF EXISTS "Authenticated users can delete stories" ON stories;

-- Create new RLS policies that use author_id
CREATE POLICY "Authors can insert own stories"
  ON stories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own stories"
  ON stories
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete own stories"
  ON stories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Keep the existing public read policy
-- Stories are publicly readable policy already exists