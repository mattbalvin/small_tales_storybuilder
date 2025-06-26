/*
  # Create media storage bucket and policies

  1. Storage Setup
    - Creates the media storage bucket if it doesn't exist
    - Sets up RLS policies for secure file access
    
  2. Security Policies
    - Users can only upload/modify/delete files in their own folder
    - Everyone can read media files for public story sharing
    - Handles existing policies gracefully
*/

-- Create the media storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can upload media to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own media files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own media files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view media files" ON storage.objects;

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload media to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update own media files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own media files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'media' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow everyone to read media files (for public story sharing)
CREATE POLICY "Anyone can view media files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'media');