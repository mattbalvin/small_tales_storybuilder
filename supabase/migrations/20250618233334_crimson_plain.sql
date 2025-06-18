/*
  # Fix Stories Insert RLS Policy

  1. Security Changes
    - Drop the existing insert policy that uses `get_current_user_id()`
    - Create a new insert policy that uses `auth.uid()` for proper authentication
    - Ensure users can create stories where they are the author

  The issue is that the current policy uses `get_current_user_id()` function which may not be properly defined,
  while `auth.uid()` is the standard Supabase function for getting the current authenticated user's ID.
*/

-- Drop the existing problematic insert policy
DROP POLICY IF EXISTS "Users can create stories" ON stories;

-- Create a new insert policy using the correct auth function
CREATE POLICY "Users can create stories"
  ON stories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);