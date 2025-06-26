/*
  # Create Media Storage Bucket

  1. Storage Setup
    - Create 'media' storage bucket for user uploads
    - Set up proper RLS policies for secure access
    - Configure public access for media files

  2. Security
    - Users can only upload to their own folder
    - Users can only delete their own files
    - All users can read media files (for sharing stories)
*/

-- Create the media storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

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