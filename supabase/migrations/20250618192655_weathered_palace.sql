/*
  # Fix Story Schema Issues

  1. Schema Changes
    - Make `cover_image` nullable in stories table (allow empty stories to be created)
    - Add `content` JSONB column to story_pages table for editor compatibility
    - Update story_pages to use modern content structure expected by editor components

  2. Data Migration
    - Migrate existing story_pages data to new content structure
    - Preserve existing data while updating schema

  3. Cleanup
    - Remove old individual columns from story_pages that are no longer needed
    - Update constraints and indexes as needed
*/

-- First, make cover_image nullable in stories table
ALTER TABLE stories ALTER COLUMN cover_image DROP NOT NULL;

-- Add content column to story_pages table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'story_pages' AND column_name = 'content'
  ) THEN
    ALTER TABLE story_pages ADD COLUMN content jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Migrate existing data to new content structure
UPDATE story_pages 
SET content = jsonb_build_object(
  'background', background,
  'text', text,
  'narration', narration,
  'interactions', COALESCE(interactions, '[]'::jsonb),
  'auto_advance', COALESCE(auto_advance, false),
  'duration', duration,
  'elements', '[]'::jsonb,
  'animations', '[]'::jsonb
)
WHERE content = '{}'::jsonb OR content IS NULL;

-- Make content non-nullable now that we have migrated data
ALTER TABLE story_pages ALTER COLUMN content SET NOT NULL;

-- Remove old columns that are now part of content
ALTER TABLE story_pages DROP COLUMN IF EXISTS background;
ALTER TABLE story_pages DROP COLUMN IF EXISTS text;
ALTER TABLE story_pages DROP COLUMN IF EXISTS narration;
ALTER TABLE story_pages DROP COLUMN IF EXISTS interactions;
ALTER TABLE story_pages DROP COLUMN IF EXISTS auto_advance;
ALTER TABLE story_pages DROP COLUMN IF EXISTS duration;

-- Add index for content queries
CREATE INDEX IF NOT EXISTS idx_story_pages_content ON story_pages USING gin (content);