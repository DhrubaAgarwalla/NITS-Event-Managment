-- Verify Supabase Setup
-- Run these queries to verify that your setup is working correctly

-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check if admin user exists
SELECT id, email, raw_user_meta_data->>'name' as name
FROM auth.users
WHERE email LIKE '%admin%';

-- Check if admin profile exists
SELECT * FROM admins;

-- Check if any club accounts exist
SELECT COUNT(*) as club_count
FROM clubs;

-- Check if club profile exists
SELECT * FROM clubs;

-- Check if categories were created
SELECT * FROM categories;

-- Check if storage bucket exists
SELECT * FROM storage.buckets
WHERE id = 'event-images';

-- Check if RLS policies are enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check RLS policies for events table
SELECT * FROM pg_policies
WHERE tablename = 'events';

-- Check counts of various entities
SELECT 'events' as entity, COUNT(*) as count FROM events
UNION ALL
SELECT 'registrations' as entity, COUNT(*) as count FROM registrations
UNION ALL
SELECT 'club_requests' as entity, COUNT(*) as count FROM club_requests
UNION ALL
SELECT 'clubs' as entity, COUNT(*) as count FROM clubs
UNION ALL
SELECT 'admins' as entity, COUNT(*) as count FROM admins;
