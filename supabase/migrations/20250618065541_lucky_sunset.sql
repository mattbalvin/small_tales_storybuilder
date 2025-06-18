/*
  # Database Schema Migration for Small Tales Story Builder

  1. New Tables
    - `users` - User profiles and authentication data
    - `media_assets` - File storage metadata and management
    - `analytics_events` - User interaction tracking

  2. Table Updates
    - Ensure existing `stories` and `story_pages` tables have proper structure
    - Add missing indexes and constraints

  3. Security
    - Enable RLS on all tables
    - Create comprehensive policies for data access control
    - Set up storage bucket policies for media files

  4. Performance
    - Add indexes for frequently queried columns
    - Set up automatic timestamp triggers
*/

-- Create users table for authentication and profiles
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  role text DEFAULT 'author' CHECK (role IN ('admin', 'author', 'reader')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure stories table has all required columns (add missing ones if needed)
DO $$
BEGIN
  -- Check and add missing columns to stories table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stories' AND column_name = 'title'
  ) THEN
    ALTER TABLE stories ADD COLUMN title text NOT NULL DEFAULT 'Untitled Story';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stories' AND column_name = 'description'
  ) THEN
    ALTER TABLE stories ADD COLUMN description text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stories' AND column_name = 'cover_image'
  ) THEN
    ALTER TABLE stories ADD COLUMN cover_image text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stories' AND column_name = 'age_range'
  ) THEN
    ALTER TABLE stories ADD COLUMN age_range text NOT NULL DEFAULT '3-8 years';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stories' AND column_name = 'settings'
  ) THEN
    ALTER TABLE stories ADD COLUMN settings jsonb DEFAULT '{"volume": 0.7, "autoRead": true, "showText": true, "readingSpeed": 1.0}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stories' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE stories ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stories' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE stories ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Ensure story_pages table has all required columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'story_pages' AND column_name = 'background'
  ) THEN
    ALTER TABLE story_pages ADD COLUMN background text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'story_pages' AND column_name = 'text'
  ) THEN
    ALTER TABLE story_pages ADD COLUMN text text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'story_pages' AND column_name = 'narration'
  ) THEN
    ALTER TABLE story_pages ADD COLUMN narration text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'story_pages' AND column_name = 'interactions'
  ) THEN
    ALTER TABLE story_pages ADD COLUMN interactions jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'story_pages' AND column_name = 'auto_advance'
  ) THEN
    ALTER TABLE story_pages ADD COLUMN auto_advance boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'story_pages' AND column_name = 'duration'
  ) THEN
    ALTER TABLE story_pages ADD COLUMN duration integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'story_pages' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE story_pages ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create media_assets table for file management
CREATE TABLE IF NOT EXISTS media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  filename text NOT NULL,
  url text NOT NULL,
  type text NOT NULL CHECK (type IN ('image', 'audio', 'video')),
  size bigint NOT NULL DEFAULT 0,
  tags text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create analytics_events table for tracking
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  user_session text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts, then recreate them
DO $$
BEGIN
  -- Drop existing policies for users table
  DROP POLICY IF EXISTS "Users can read own profile" ON users;
  DROP POLICY IF EXISTS "Users can update own profile" ON users;
  DROP POLICY IF EXISTS "Users can insert own profile" ON users;

  -- Drop existing policies for stories table
  DROP POLICY IF EXISTS "Stories are publicly readable" ON stories;
  DROP POLICY IF EXISTS "Authenticated users can insert stories" ON stories;
  DROP POLICY IF EXISTS "Authenticated users can update stories" ON stories;
  DROP POLICY IF EXISTS "Authenticated users can delete stories" ON stories;

  -- Drop existing policies for story_pages table
  DROP POLICY IF EXISTS "Story pages are publicly readable" ON story_pages;
  DROP POLICY IF EXISTS "Authenticated users can insert story pages" ON story_pages;
  DROP POLICY IF EXISTS "Authenticated users can update story pages" ON story_pages;
  DROP POLICY IF EXISTS "Authenticated users can delete story pages" ON story_pages;

  -- Drop existing policies for media_assets table
  DROP POLICY IF EXISTS "Users can read own media assets" ON media_assets;
  DROP POLICY IF EXISTS "Users can insert own media assets" ON media_assets;
  DROP POLICY IF EXISTS "Users can update own media assets" ON media_assets;
  DROP POLICY IF EXISTS "Users can delete own media assets" ON media_assets;

  -- Drop existing policies for analytics_events table
  DROP POLICY IF EXISTS "Anyone can insert analytics events" ON analytics_events;
  DROP POLICY IF EXISTS "Authenticated users can read analytics events" ON analytics_events;
END $$;

-- Create users policies
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create stories policies (matching existing schema)
CREATE POLICY "Stories are publicly readable"
  ON stories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert stories"
  ON stories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update stories"
  ON stories
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete stories"
  ON stories
  FOR DELETE
  TO authenticated
  USING (true);

-- Create story pages policies (matching existing schema)
CREATE POLICY "Story pages are publicly readable"
  ON story_pages
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert story pages"
  ON story_pages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update story pages"
  ON story_pages
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete story pages"
  ON story_pages
  FOR DELETE
  TO authenticated
  USING (true);

-- Create media assets policies
CREATE POLICY "Users can read own media assets"
  ON media_assets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own media assets"
  ON media_assets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own media assets"
  ON media_assets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own media assets"
  ON media_assets
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create analytics events policies
CREATE POLICY "Anyone can insert analytics events"
  ON analytics_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read analytics events"
  ON analytics_events
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for optimal performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_title ON stories(title);

CREATE INDEX IF NOT EXISTS idx_story_pages_story_id ON story_pages(story_id);
CREATE INDEX IF NOT EXISTS idx_story_pages_page_number ON story_pages(story_id, page_number);

CREATE INDEX IF NOT EXISTS idx_media_assets_user_id ON media_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_type ON media_assets(type);
CREATE INDEX IF NOT EXISTS idx_media_assets_created_at ON media_assets(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_story_id ON analytics_events(story_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);

-- Create function for automatic updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers (drop existing ones first to avoid conflicts)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_stories_updated_at ON stories;
DROP TRIGGER IF EXISTS update_media_assets_updated_at ON media_assets;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON stories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_assets_updated_at
  BEFORE UPDATE ON media_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for media files (if not exists)
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('media', 'media', true)
  ON CONFLICT (id) DO NOTHING;
EXCEPTION
  WHEN others THEN
    -- Ignore errors if storage schema doesn't exist yet
    NULL;
END $$;

-- Set up storage policies for media bucket (with error handling)
DO $$
BEGIN
  -- Drop existing storage policies to avoid conflicts
  DROP POLICY IF EXISTS "Users can upload media files" ON storage.objects;
  DROP POLICY IF EXISTS "Users can view media files" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update own media files" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own media files" ON storage.objects;

  -- Create new storage policies
  CREATE POLICY "Users can upload media files"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'media');

  CREATE POLICY "Users can view media files"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'media');

  CREATE POLICY "Users can update own media files"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

  CREATE POLICY "Users can delete own media files"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

EXCEPTION
  WHEN others THEN
    -- Ignore errors if storage schema doesn't exist yet
    NULL;
END $$;