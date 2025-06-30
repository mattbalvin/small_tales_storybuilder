/*
  # Storage Bucket and Policies Setup

  1. New Storage Bucket
    - Creates 'media' storage bucket if it doesn't exist
    - Sets bucket to public for easy access

  2. Storage Policies
    - Upload policy: Users can only upload to their own folder
    - Update policy: Users can only update their own files
    - Delete policy: Users can only delete their own files
    - Select policy: Anyone can view media files (for public sharing)
*/

-- Create the media storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to their own folder
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Users can upload media to own folder'
  ) THEN
    CREATE POLICY "Users can upload media to own folder"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'media' AND 
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- Allow authenticated users to update their own files
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Users can update own media files'
  ) THEN
    CREATE POLICY "Users can update own media files"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'media' AND 
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- Allow authenticated users to delete their own files
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Users can delete own media files'
  ) THEN
    CREATE POLICY "Users can delete own media files"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'media' AND 
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- Allow everyone to read media files (for public story sharing)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Anyone can view media files'
  ) THEN
    CREATE POLICY "Anyone can view media files"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'media');
  END IF;
END $$;