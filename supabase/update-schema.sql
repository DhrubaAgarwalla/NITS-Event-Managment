-- Update events table to add participation_type and min_participants fields
ALTER TABLE events
ADD COLUMN IF NOT EXISTS participation_type TEXT DEFAULT 'individual',
ADD COLUMN IF NOT EXISTS min_participants INTEGER;

-- Update comments for clarity
COMMENT ON COLUMN events.participation_type IS 'Type of participation: individual, team, or both';
COMMENT ON COLUMN events.min_participants IS 'Minimum number of participants per team';
COMMENT ON COLUMN events.max_participants IS 'Maximum number of participants per team';

-- We no longer need to update existing events since the participation_type is set during event creation
-- UPDATE events SET participation_type = 'individual' WHERE participation_type IS NULL;
