/*
  # Add story collaborators system

  1. New Tables
    - `story_collaborators`
      - `id` (uuid, primary key)
      - `story_id` (uuid, foreign key to stories)
      - `user_id` (uuid, foreign key to users)
      - `permission_level` (text: 'owner', 'editor', 'viewer')
      - `invited_by` (uuid, foreign key to users)
      - `invited_at` (timestamp)
      - `accepted_at` (timestamp, nullable)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `story_collaborators` table
    - Add policies for managing collaborators
    - Update story access policies to include collaborators

  3. Functions
    - Function to check if user has access to story
    - Function to get user's permission level for a story
*/

-- Create story_collaborators table
CREATE TABLE IF NOT EXISTS story_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_level text NOT NULL DEFAULT 'viewer',
  invited_by uuid REFERENCES users(id) ON DELETE SET NULL,
  invited_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  
  -- Ensure unique collaborator per story
  UNIQUE(story_id, user_id),
  
  -- Ensure valid permission levels
  CONSTRAINT story_collaborators_permission_check 
    CHECK (permission_level = ANY (ARRAY['owner'::text, 'editor'::text, 'viewer'::text]))
);

-- Enable RLS
ALTER TABLE story_collaborators ENABLE ROW LEVEL SECURITY;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_story_collaborators_story_id ON story_collaborators(story_id);
CREATE INDEX IF NOT EXISTS idx_story_collaborators_user_id ON story_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_story_collaborators_permission ON story_collaborators(story_id, permission_level);

-- Automatically add story author as owner when story is created
CREATE OR REPLACE FUNCTION add_story_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO story_collaborators (story_id, user_id, permission_level, invited_by, accepted_at)
  VALUES (NEW.id, NEW.author_id, 'owner', NEW.author_id, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically add owner
DROP TRIGGER IF EXISTS trigger_add_story_owner ON stories;
CREATE TRIGGER trigger_add_story_owner
  AFTER INSERT ON stories
  FOR EACH ROW
  EXECUTE FUNCTION add_story_owner();

-- Function to check if user has access to story with specific permission
CREATE OR REPLACE FUNCTION user_has_story_access(story_uuid uuid, user_uuid uuid, required_permission text DEFAULT 'viewer')
RETURNS boolean AS $$
DECLARE
  user_permission text;
  permission_hierarchy int;
  required_hierarchy int;
BEGIN
  -- Get user's permission level for this story
  SELECT permission_level INTO user_permission
  FROM story_collaborators
  WHERE story_id = story_uuid 
    AND user_id = user_uuid 
    AND accepted_at IS NOT NULL;
  
  -- If no permission found, check if user is the original author (fallback)
  IF user_permission IS NULL THEN
    SELECT CASE WHEN author_id = user_uuid THEN 'owner' ELSE NULL END
    INTO user_permission
    FROM stories
    WHERE id = story_uuid;
  END IF;
  
  -- Return false if no permission found
  IF user_permission IS NULL THEN
    RETURN false;
  END IF;
  
  -- Define permission hierarchy (higher number = more permissions)
  permission_hierarchy := CASE user_permission
    WHEN 'viewer' THEN 1
    WHEN 'editor' THEN 2
    WHEN 'owner' THEN 3
    ELSE 0
  END;
  
  required_hierarchy := CASE required_permission
    WHEN 'viewer' THEN 1
    WHEN 'editor' THEN 2
    WHEN 'owner' THEN 3
    ELSE 0
  END;
  
  RETURN permission_hierarchy >= required_hierarchy;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for story_collaborators
CREATE POLICY "Users can view collaborators for stories they have access to"
  ON story_collaborators
  FOR SELECT
  TO authenticated
  USING (user_has_story_access(story_id, auth.uid(), 'viewer'));

CREATE POLICY "Story owners can manage collaborators"
  ON story_collaborators
  FOR ALL
  TO authenticated
  USING (user_has_story_access(story_id, auth.uid(), 'owner'))
  WITH CHECK (user_has_story_access(story_id, auth.uid(), 'owner'));

CREATE POLICY "Users can accept their own invitations"
  ON story_collaborators
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND accepted_at IS NULL)
  WITH CHECK (user_id = auth.uid());

-- Update stories policies to use the new access system
DROP POLICY IF EXISTS "Authors can delete own stories" ON stories;
DROP POLICY IF EXISTS "Authors can insert own stories" ON stories;
DROP POLICY IF EXISTS "Authors can update own stories" ON stories;
DROP POLICY IF EXISTS "Stories are publicly readable" ON stories;

-- New policies using the access function
CREATE POLICY "Users can view stories they have access to"
  ON stories
  FOR SELECT
  TO authenticated
  USING (user_has_story_access(id, auth.uid(), 'viewer'));

CREATE POLICY "Users can create stories"
  ON stories
  FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can edit stories they have editor access to"
  ON stories
  FOR UPDATE
  TO authenticated
  USING (user_has_story_access(id, auth.uid(), 'editor'))
  WITH CHECK (user_has_story_access(id, auth.uid(), 'editor'));

CREATE POLICY "Users can delete stories they own"
  ON stories
  FOR DELETE
  TO authenticated
  USING (user_has_story_access(id, auth.uid(), 'owner'));

-- Update story_pages policies to use the new access system
DROP POLICY IF EXISTS "Authenticated users can delete story pages" ON story_pages;
DROP POLICY IF EXISTS "Authenticated users can insert story pages" ON story_pages;
DROP POLICY IF EXISTS "Authenticated users can update story pages" ON story_pages;
DROP POLICY IF EXISTS "Story pages are publicly readable" ON story_pages;

CREATE POLICY "Users can view story pages for stories they have access to"
  ON story_pages
  FOR SELECT
  TO authenticated
  USING (user_has_story_access(story_id, auth.uid(), 'viewer'));

CREATE POLICY "Users can edit story pages for stories they have editor access to"
  ON story_pages
  FOR ALL
  TO authenticated
  USING (user_has_story_access(story_id, auth.uid(), 'editor'))
  WITH CHECK (user_has_story_access(story_id, auth.uid(), 'editor'));

-- Backfill existing stories with owner collaborator records
INSERT INTO story_collaborators (story_id, user_id, permission_level, invited_by, accepted_at)
SELECT id, author_id, 'owner', author_id, now()
FROM stories
WHERE NOT EXISTS (
  SELECT 1 FROM story_collaborators 
  WHERE story_id = stories.id AND user_id = stories.author_id
);