-- Event Manager Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clubs table (linked to auth.users)
CREATE TABLE clubs (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  social_links JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admins table (linked to auth.users)
CREATE TABLE admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Club requests table
CREATE TABLE club_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  description TEXT,
  additional_info TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  max_participants INTEGER,
  registration_deadline TIMESTAMPTZ,
  status TEXT DEFAULT 'upcoming', -- 'upcoming', 'ongoing', 'completed', 'cancelled'
  is_featured BOOLEAN DEFAULT FALSE,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  
  -- Registration method fields
  registration_method TEXT DEFAULT 'internal', -- 'internal', 'external', 'both'
  external_form_url TEXT, -- URL to Google Form (if using external method)
  
  additional_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registrations table
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  participant_name TEXT NOT NULL,
  participant_email TEXT NOT NULL,
  participant_phone TEXT,
  participant_id TEXT, -- Student ID
  registration_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'registered', -- 'registered', 'attended', 'cancelled'
  additional_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_events_club_id ON events(club_id);
CREATE INDEX idx_events_category_id ON events(category_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_registrations_event_id ON registrations(event_id);
CREATE INDEX idx_registrations_email ON registrations(participant_email);

-- Create a storage bucket for event images
INSERT INTO storage.buckets (id, name, public)
VALUES (
  'event-images',
  'event-images',
  true  -- public bucket
)
ON CONFLICT (id) DO NOTHING;

-- Set file size limit and allowed mime types
UPDATE storage.buckets
SET file_size_limit = 52428800, -- 50MB
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']::text[]
WHERE id = 'event-images';

-- Enable Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Categories policies
-- Anyone can view categories
CREATE POLICY "Categories are viewable by everyone" 
  ON categories FOR SELECT 
  USING (true);

-- Only admins can create/update categories
CREATE POLICY "Admins can create categories" 
  ON categories FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update categories" 
  ON categories FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- Clubs policies
-- Anyone can view club profiles
CREATE POLICY "Club profiles are viewable by everyone" 
  ON clubs FOR SELECT 
  USING (true);

-- Users can only update their own club profile
CREATE POLICY "Users can update their own club profile" 
  ON clubs FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id);

-- Only admins can create club profiles
CREATE POLICY "Admins can create club profiles" 
  ON clubs FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- Admins policies
-- Only admins can view admin list
CREATE POLICY "Admins can view admin list" 
  ON admins FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- Club requests policies
-- Anyone can create a club request
CREATE POLICY "Anyone can create a club request" 
  ON club_requests FOR INSERT 
  WITH CHECK (true);

-- Only admins can view and update club requests
CREATE POLICY "Admins can view club requests" 
  ON club_requests FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update club requests" 
  ON club_requests FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- Events policies
-- Anyone can view events
CREATE POLICY "Events are viewable by everyone" 
  ON events FOR SELECT 
  USING (true);

-- Clubs can create their own events
CREATE POLICY "Clubs can create their own events" 
  ON events FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = club_id);

-- Clubs can update their own events
CREATE POLICY "Clubs can update their own events" 
  ON events FOR UPDATE 
  TO authenticated 
  USING (
    auth.uid() = club_id OR 
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- Clubs can delete their own events
CREATE POLICY "Clubs can delete their own events" 
  ON events FOR DELETE 
  TO authenticated 
  USING (
    auth.uid() = club_id OR 
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- Registrations policies
-- Clubs can view registrations for their events
CREATE POLICY "Clubs can view registrations for their events" 
  ON registrations FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = registrations.event_id 
      AND events.club_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- Anyone can register for events
CREATE POLICY "Anyone can register for events" 
  ON registrations FOR INSERT 
  WITH CHECK (true);

-- Clubs can update registrations for their events
CREATE POLICY "Clubs can update registrations for their events" 
  ON registrations FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = registrations.event_id 
      AND events.club_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- Storage policies
-- Anyone can view event images
CREATE POLICY "Anyone can view event images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-images');

-- Authenticated users can upload event images
CREATE POLICY "Authenticated users can upload event images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'event-images');

-- Only club owners can update their event images
CREATE POLICY "Club owners can update their event images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'event-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Only club owners can delete their event images
CREATE POLICY "Club owners can delete their event images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'event-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Insert initial categories
INSERT INTO categories (name, color)
VALUES 
  ('Technical', '#3498db'),
  ('Cultural', '#e74c3c'),
  ('Sports', '#2ecc71'),
  ('Academic', '#f39c12'),
  ('Workshop', '#9b59b6')
ON CONFLICT (id) DO NOTHING;

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clubs_updated_at
BEFORE UPDATE ON clubs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at
BEFORE UPDATE ON admins
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_club_requests_updated_at
BEFORE UPDATE ON club_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registrations_updated_at
BEFORE UPDATE ON registrations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
