/*
  # Initial Schema Setup for Small Tales Story Builder

  1. New Tables
    - `users` - User profiles and authentication data
    - `stories` - Story metadata and settings  
    - `story_pages` - Individual story pages with content
    - `media_assets` - File uploads and media management
    - `analytics_events` - User interaction tracking

  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
    - Set up storage bucket policies

  3. Performance
    - Add indexes for common queries
    - Set up automatic timestamp updates
*/

-- Drop existing policies if they exist to avoid conflicts
DO $$ 
BEGIN
  -- Users policies
  DROP POLICY IF EXISTS "Users can read own profile" ON users;
  DROP POLICY IF EXISTS "Users can update own profile" ON users;
  DROP POLICY IF EXISTS "Users can insert own profile" ON users;
  
  -- Stories policies
  DROP POLICY IF EXISTS "Stories are publicly readable" ON stories;
  DROP POLICY IF EXISTS "Authenticated users can insert stories" ON stories;
  DROP POLICY IF EXISTS "Authenticated users can update stories" ON stories;
  DROP POLICY IF EXISTS "Authenticated users can delete stories" ON stories;
  
  -- Story pages policies
  DROP POLICY IF EXISTS "Story pages are publicly readable" ON story_pages;
  DROP POLICY IF EXISTS "Authenticated users can insert story pages" ON story_pages;
  DROP POLICY IF EXISTS "Authenticated users can update story pages" ON story_pages;
  DROP POLICY IF EXISTS "Authenticated users can delete story pages" ON story_pages;
  
  -- Media assets policies
  DROP POLICY IF EXISTS "Users can read own media assets" ON media_assets;
  DROP POLICY IF EXISTS "Users can insert own media assets" ON media_assets;
  DROP POLICY IF EXISTS "Users can update own media assets" ON media_assets;
  DROP POLICY IF EXISTS "Users can delete own media assets" ON media_assets;
  
  -- Analytics events policies
  DROP POLICY IF EXISTS "Anyone can insert analytics events" ON analytics_events;
  DROP POLICY IF EXISTS "Authenticated users can read analytics events" ON analytics_events;
  
  -- Storage policies
  DROP POLICY IF EXISTS "Users can upload media files" ON storage.objects;
  DROP POLICY IF EXISTS "Users can view media files" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update own media files" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own media files" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

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

-- Create stories table (matches existing schema)
CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Untitled Story',
  description text NOT NULL DEFAULT '',
  cover_image text NOT NULL DEFAULT '',
  age_range text NOT NULL DEFAULT '3-8 years',
  settings jsonb DEFAULT '{"volume": 0.7, "autoRead": true, "showText": true, "readingSpeed": 1.0}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create story_pages table (matches existing schema)
CREATE TABLE IF NOT EXISTS story_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE,
  page_number integer NOT NULL,
  background text NOT NULL DEFAULT '',
  text text NOT NULL DEFAULT '',
  narration text,
  interactions jsonb DEFAULT '[]'::jsonb,
  auto_advance boolean DEFAULT false,
  duration integer,
  created_at timestamptz DEFAULT now()
);

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

-- Users policies - users can manage their own profiles
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

-- Stories policies - publicly readable, authenticated users can modify
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

-- Story pages policies - publicly readable, authenticated users can modify
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

-- Media assets policies - users can only manage their own assets
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

-- Analytics events policies - anyone can insert, authenticated users can read
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

-- Create indexes for optimal performance
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

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_stories_updated_at ON stories;
DROP TRIGGER IF EXISTS update_media_assets_updated_at ON media_assets;

-- Add updated_at triggers to relevant tables
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
END $$;

-- Set up storage policies for media bucket
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