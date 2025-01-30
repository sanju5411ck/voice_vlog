/*
  # Create storage bucket for voice recordings

  1. Storage
    - Creates a new storage bucket 'voice-recordings' for storing audio files
    - Sets up public access policies for the bucket
*/

-- Create the storage bucket for voice recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-recordings', 'voice-recordings', true);

-- Allow authenticated users to upload files to the bucket
CREATE POLICY "Users can upload voice recordings"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'voice-recordings' AND
  auth.uid() = owner
);

-- Allow public access to voice recordings
CREATE POLICY "Voice recordings are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'voice-recordings');