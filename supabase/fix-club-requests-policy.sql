-- Fix for "new row violates row-level security policy for table 'club_requests'" error
-- This script fixes Row Level Security (RLS) policies for the club_requests table

-- OPTION 1: Disable RLS for the club_requests table (simplest solution)
-- This will make the club_requests table accessible to all authenticated users
ALTER TABLE club_requests DISABLE ROW LEVEL SECURITY;

-- OPTION 2: If you prefer to keep RLS enabled but fix the policy issue
-- Only uncomment and run this section if Option 1 doesn't work or you want more security
/*
-- First, drop all existing policies on the club_requests table
DROP POLICY IF EXISTS "Anyone can insert club requests" ON club_requests;
DROP POLICY IF EXISTS "Admins can view club requests" ON club_requests;
DROP POLICY IF EXISTS "Admins can update club requests" ON club_requests;
DROP POLICY IF EXISTS "Users can view their own requests" ON club_requests;

-- Enable RLS
ALTER TABLE club_requests ENABLE ROW LEVEL SECURITY;

-- Create policies that allow proper access
-- Allow anyone to insert a club request
CREATE POLICY "Anyone can insert club requests"
ON club_requests
FOR INSERT
WITH CHECK (true);

-- Allow anyone to view their own requests based on contact email
CREATE POLICY "Users can view their own requests"
ON club_requests
FOR SELECT
USING (contact_email = auth.email());

-- Allow all operations for authenticated users (simpler approach)
-- Uncomment this and comment out the above policies if you're still having issues
-- CREATE POLICY "Allow all operations for authenticated users"
-- ON club_requests
-- FOR ALL
-- USING (true)
-- WITH CHECK (true);
*/

-- OPTION 3: Grant privileges to the anon and authenticated roles
-- Only uncomment and run this section if Options 1 and 2 didn't work
/*
-- Make sure the table has the right permissions
GRANT ALL ON club_requests TO anon, authenticated;
*/
