/*
  # Fix Story RLS Policies and Add Debugging

  1. Security Policy Updates
    - Drop existing problematic policies on stories table
    - Create new, more robust RLS policies using auth.uid() directly
    - Ensure proper INSERT policy for authenticated users

  2. Debugging Functions
    - Add function to check current user authentication status
    - Add function to get current user role information

  3. Policy Changes
    - Use auth.uid() instead of custom get_current_user_id() function
    - Simplify INSERT policy to be more reliable
    - Maintain security while fixing the creation issue
*/

-- First, let's create a debugging function to check auth status
CREATE OR REPLACE FUNCTION debug_auth_status()
RETURNS TABLE (
  user_id uuid,
  user_role text,
  is_authenticated boolean,
  session_info jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as user_id,
    auth.jwt() ->> 'role' as user_role,
    auth.uid() IS NOT NULL as is_authenticated,
    auth.jwt() as session_info;
END;
$$;

-- Drop existing problematic policies on stories table
DROP POLICY IF EXISTS "Users can create stories" ON stories;
DROP POLICY IF EXISTS "Users can view stories they have access to" ON stories;
DROP POLICY IF EXISTS "Users can edit stories they have editor access to" ON stories;
DROP POLICY IF EXISTS "Users can delete stories they own" ON stories;

-- Create new, more robust INSERT policy
CREATE POLICY "authenticated_users_can_create_stories"
  ON stories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- Create SELECT policy that works with the collaboration system
CREATE POLICY "users_can_view_accessible_stories"
  ON stories
  FOR SELECT
  TO authenticated
  USING (
    -- User is the author
    auth.uid() = author_id
    OR
    -- User has collaboration access
    EXISTS (
      SELECT 1 FROM story_collaborators sc
      WHERE sc.story_id = stories.id
      AND sc.user_id = auth.uid()
      AND sc.accepted_at IS NOT NULL
    )
  );

-- Create UPDATE policy
CREATE POLICY "users_can_edit_accessible_stories"
  ON stories
  FOR UPDATE
  TO authenticated
  USING (
    -- User is the author (owner)
    auth.uid() = author_id
    OR
    -- User has editor or owner collaboration access
    EXISTS (
      SELECT 1 FROM story_collaborators sc
      WHERE sc.story_id = stories.id
      AND sc.user_id = auth.uid()
      AND sc.accepted_at IS NOT NULL
      AND sc.permission_level IN ('owner', 'editor')
    )
  )
  WITH CHECK (
    -- Same conditions for WITH CHECK
    auth.uid() = author_id
    OR
    EXISTS (
      SELECT 1 FROM story_collaborators sc
      WHERE sc.story_id = stories.id
      AND sc.user_id = auth.uid()
      AND sc.accepted_at IS NOT NULL
      AND sc.permission_level IN ('owner', 'editor')
    )
  );

-- Create DELETE policy
CREATE POLICY "users_can_delete_owned_stories"
  ON stories
  FOR DELETE
  TO authenticated
  USING (
    -- Only the author can delete
    auth.uid() = author_id
    OR
    -- Or users with owner collaboration access
    EXISTS (
      SELECT 1 FROM story_collaborators sc
      WHERE sc.story_id = stories.id
      AND sc.user_id = auth.uid()
      AND sc.accepted_at IS NOT NULL
      AND sc.permission_level = 'owner'
    )
  );

-- Update the get_current_user_id function to be more reliable
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT auth.uid();
$$;

-- Create a function to check if user has story access (for backward compatibility)
CREATE OR REPLACE FUNCTION user_has_story_access(
  story_uuid uuid,
  user_uuid uuid,
  required_permission text DEFAULT 'viewer'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  has_access boolean := false;
BEGIN
  -- Check if user is the author
  SELECT EXISTS (
    SELECT 1 FROM stories 
    WHERE id = story_uuid AND author_id = user_uuid
  ) INTO has_access;
  
  IF has_access THEN
    RETURN true;
  END IF;
  
  -- Check collaboration access
  SELECT EXISTS (
    SELECT 1 FROM story_collaborators sc
    WHERE sc.story_id = story_uuid
    AND sc.user_id = user_uuid
    AND sc.accepted_at IS NOT NULL
    AND (
      required_permission = 'viewer' OR
      (required_permission = 'editor' AND sc.permission_level IN ('editor', 'owner')) OR
      (required_permission = 'owner' AND sc.permission_level = 'owner')
    )
  ) INTO has_access;
  
  RETURN has_access;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION debug_auth_status() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_story_access(uuid, uuid, text) TO authenticated;