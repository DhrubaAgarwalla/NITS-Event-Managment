-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6c5ce7',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create event_tags junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS event_tags (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, tag_id)
);

-- Create trigger for updated_at on tags table
CREATE TRIGGER update_tags_updated_at
BEFORE UPDATE ON tags
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tags

-- Anyone can view tags
CREATE POLICY "Tags are viewable by everyone" 
  ON tags FOR SELECT 
  USING (true);

-- Only admins can create/update tags
CREATE POLICY "Admins can create tags" 
  ON tags FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update tags" 
  ON tags FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- RLS Policies for event_tags

-- Anyone can view event_tags
CREATE POLICY "Event tags are viewable by everyone" 
  ON event_tags FOR SELECT 
  USING (true);

-- Clubs can add tags to their own events
CREATE POLICY "Clubs can add tags to their own events" 
  ON event_tags FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_tags.event_id 
      AND events.club_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- Clubs can remove tags from their own events
CREATE POLICY "Clubs can remove tags from their own events" 
  ON event_tags FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_tags.event_id 
      AND events.club_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- Insert initial tags
INSERT INTO tags (name, color)
VALUES 
  ('Technical', '#3498db'),
  ('Cultural', '#e74c3c'),
  ('Sports', '#2ecc71'),
  ('Workshop', '#9b59b6'),
  ('Seminar', '#f39c12'),
  ('Competition', '#1abc9c'),
  ('Hackathon', '#d35400'),
  ('Conference', '#8e44ad'),
  ('Festival', '#c0392b'),
  ('Alumni', '#16a085'),
  ('Career', '#2980b9'),
  ('Research', '#27ae60'),
  ('Social', '#f1c40f'),
  ('Entertainment', '#e67e22'),
  ('Educational', '#7f8c8d')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX idx_event_tags_event_id ON event_tags(event_id);
CREATE INDEX idx_event_tags_tag_id ON event_tags(tag_id);
