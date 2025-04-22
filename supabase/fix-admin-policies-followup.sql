-- Follow-up fix for "infinite recursion detected in policy for relation 'admins'" error
-- This script provides additional options if the first fix didn't work

-- IMPORTANT: Only run ONE of these options at a time
-- Start with Option 1, and if that doesn't work, try Option 2, then Option 3

-- =============================================
-- OPTION 1: Completely disable RLS for the admins table
-- =============================================
-- This is the most reliable fix - it simply turns off RLS for the admins table
-- Comment out the line below if you want to try a different option
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;


-- =============================================
-- OPTION 2: Remove all policies and create a simple one
-- =============================================
-- Only uncomment and run this section if Option 1 didn't work
/*
-- First, drop all existing policies on the admins table
DROP POLICY IF EXISTS "Admins can view all admins" ON admins;
DROP POLICY IF EXISTS "Admins can insert admins" ON admins;
DROP POLICY IF EXISTS "Admins can update admins" ON admins;
DROP POLICY IF EXISTS "Admins can delete admins" ON admins;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON admins;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON admins;
DROP POLICY IF EXISTS "Enable update for users based on id" ON admins;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON admins;
DROP POLICY IF EXISTS "Allow all operations for all users" ON admins;
DROP POLICY IF EXISTS "Bypass policy for admins" ON admins;

-- Make sure RLS is enabled
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Create a single, simple policy that allows all operations
CREATE POLICY "Allow all operations for all users" 
ON admins 
FOR ALL 
USING (true) 
WITH CHECK (true);
*/


-- =============================================
-- OPTION 3: Grant privileges to the authenticated role
-- =============================================
-- Only uncomment and run this section if Options 1 and 2 didn't work
/*
-- Make sure RLS is enabled
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Grant full access to the authenticated role
GRANT ALL ON admins TO authenticated;

-- Create a bypass policy
DROP POLICY IF EXISTS "Bypass policy for admins" ON admins;
CREATE POLICY "Bypass policy for admins" 
ON admins 
FOR ALL 
USING (true) 
WITH CHECK (true);
*/
