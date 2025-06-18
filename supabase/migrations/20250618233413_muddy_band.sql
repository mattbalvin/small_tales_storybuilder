/*
  # Fix Stories Table INSERT Policy

  1. Policy Updates
    - Update the INSERT policy for stories table to use consistent function naming
    - Ensure the policy correctly references the authenticated user's ID
    - Fix any potential issues with the uid() function reference

  2. Changes
    - Drop the existing INSERT policy that uses uid()
    - Create a new INSERT policy that uses get_current_user_id() for consistency
    - Ensure the policy allows authenticated users to create stories where they are the author
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can create stories" ON stories;

-- Create a new INSERT policy with consistent function naming
CREATE POLICY "Users can create stories"
  ON stories
  FOR INSERT
  TO authenticated
  WITH CHECK (get_current_user_id() = author_id);