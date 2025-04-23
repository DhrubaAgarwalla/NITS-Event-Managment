-- Add logo_url column to club_requests table
ALTER TABLE club_requests ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Create a storage bucket for club logos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES (
  'public',
  'public',
  true  -- public bucket
)
ON CONFLICT (id) DO NOTHING;

-- Set file size limit and allowed mime types for club logos
UPDATE storage.buckets
SET file_size_limit = 2097152, -- 2MB
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg']::text[]
WHERE id = 'public';

-- Create storage policy for club logos
DO $$
BEGIN
  -- Check if the policy already exists before creating it
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view public files') THEN
    CREATE POLICY "Anyone can view public files"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'public');
  END IF;

  -- Check if the policy already exists before creating it
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can upload public files') THEN
    CREATE POLICY "Anyone can upload public files"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'public');
  END IF;
END
$$;
