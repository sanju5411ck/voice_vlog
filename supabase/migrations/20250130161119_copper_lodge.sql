/*
  # Initial Setup for Voice Vlog App

  1. New Tables
    - profiles
      - id (uuid, primary key, references auth.users)
      - username (text, unique)
      - avatar_url (text)
      - created_at (timestamp)
    - voice_posts
      - id (uuid, primary key)
      - user_id (uuid, references profiles)
      - title (text)
      - audio_url (text)
      - description (text)
      - created_at (timestamp)
      - likes_count (integer)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Create voice_posts table
CREATE TABLE voice_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  audio_url text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  likes_count integer DEFAULT 0
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_posts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Voice posts policies
CREATE POLICY "Voice posts are viewable by everyone"
  ON voice_posts FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own voice posts"
  ON voice_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own voice posts"
  ON voice_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own voice posts"
  ON voice_posts FOR DELETE
  USING (auth.uid() = user_id);