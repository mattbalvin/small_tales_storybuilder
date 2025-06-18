/*
  # Initial Small Tales Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `full_name` (text)
      - `avatar_url` (text)
      - `role` (enum: admin, author, reader)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `stories`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `author_id` (uuid, foreign key)
      - `cover_image_url` (text)
      - `status` (enum: draft, published, archived)
      - `orientation` (enum: landscape, portrait, adaptive)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `published_at` (timestamp)
    
    - `story_pages`
      - `id` (uuid, primary key)
      - `story_id` (uuid, foreign key)
      - `page_number` (integer)
      - `content` (jsonb)
      - `audio_url` (text)
      - `duration` (numeric)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `media_assets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `filename` (text)
      - `url` (text)
      - `type` (enum: image, audio, video)
      - `size` (bigint)
      - `tags` (text array)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `analytics_events`
      - `id` (uuid, primary key)
      - `story_id` (uuid, foreign key)
      - `event_type` (text)
      - `event_data` (jsonb)
      - `user_session` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for public story viewing
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  role text DEFAULT 'author' CHECK (role IN ('admin', 'author', 'reader')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create stories table
CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Untitled Story',
  description text,
  author_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  cover_image_url text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  orientation text DEFAULT 'landscape' CHECK (orientation IN ('landscape', 'portrait', 'adaptive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  published_at timestamptz
);

-- Create story_pages table
CREATE TABLE IF NOT EXISTS story_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  page_number integer NOT NULL,
  content jsonb DEFAULT '{}'::jsonb,
  audio_url text,
  duration numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(story_id, page_number)
);

-- Create media_assets table
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

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  user_session text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Users policies
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

-- Stories policies
CREATE POLICY "Authors can manage own stories"
  ON stories
  FOR ALL
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Published stories are publicly readable"
  ON stories
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- Story pages policies
CREATE POLICY "Authors can manage pages of own stories"
  ON story_pages
  FOR ALL
  TO authenticated
  USING (
    story_id IN (
      SELECT id FROM stories WHERE author_id = auth.uid()
    )
  );

CREATE POLICY "Published story pages are publicly readable"
  ON story_pages
  FOR SELECT
  TO anon, authenticated
  USING (
    story_id IN (
      SELECT id FROM stories WHERE status = 'published'
    )
  );

-- Media assets policies
CREATE POLICY "Users can manage own media assets"
  ON media_assets
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Analytics events policies
CREATE POLICY "Anyone can insert analytics events"
  ON analytics_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authors can read analytics for own stories"
  ON analytics_events
  FOR SELECT
  TO authenticated
  USING (
    story_id IN (
      SELECT id FROM stories WHERE author_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stories_author_id ON stories(author_id);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);
CREATE INDEX IF NOT EXISTS idx_story_pages_story_id ON story_pages(story_id);
CREATE INDEX IF NOT EXISTS idx_story_pages_page_number ON story_pages(story_id, page_number);
CREATE INDEX IF NOT EXISTS idx_media_assets_user_id ON media_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_type ON media_assets(type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_story_id ON analytics_events(story_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON stories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_story_pages_updated_at
  BEFORE UPDATE ON story_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_assets_updated_at
  BEFORE UPDATE ON media_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();