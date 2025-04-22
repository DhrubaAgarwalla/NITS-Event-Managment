# Supabase Setup Troubleshooting Guide

This guide addresses common issues you might encounter when setting up Supabase for the Event Manager application.

## Common Issues and Solutions

### 1. Error: "null value in column 'id' violates not-null constraint"

**Problem**: When creating users in Supabase, you might get an error about null values in the id column.

**Solution**:
- Make sure to explicitly generate a UUID for the user id
- Include all required fields in the INSERT statement
- The current scripts already handle this correctly

### 2. Error: "relation 'auth.users' does not exist"

**Problem**: The auth schema might not be properly set up in your Supabase instance.

**Solution**:
- Make sure you're using a Supabase project, not just a PostgreSQL database
- Verify that you have the latest version of Supabase
- Try using the Supabase dashboard to create users instead of SQL

### 3. Error: "permission denied for schema auth"

**Problem**: Your database user doesn't have permission to access the auth schema.

**Solution**:
- Make sure you're using the service role key in your application, not the anon key
- In the SQL editor, make sure you're using the "service_role" connection

### 4. Storage Bucket Issues

**Problem**: Unable to create or access the storage bucket for event images.

**Solution**:
- Create the bucket manually through the Supabase dashboard:
  1. Go to "Storage" in the sidebar
  2. Click "Create a new bucket"
  3. Name it "event-images"
  4. Check "Public bucket" to make it publicly accessible
  5. Set file size limit to 50MB
  6. Set allowed MIME types to image/png, image/jpeg, image/gif, image/webp

### 5. RLS Policy Issues

**Problem**: Row Level Security policies are not working as expected.

**Solution**:
- Verify that RLS is enabled for all tables:
  ```sql
  SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
  ```
- Check the policies for a specific table:
  ```sql
  SELECT * FROM pg_policies WHERE tablename = 'events';
  ```
- Make sure you're using the correct authentication in your application

### 6. Sample Data Not Appearing

**Problem**: After running `sample-data.sql`, no data appears in the application.

**Solution**:
- The sample data depends on having at least one club account
- Make sure you've successfully created a club account first
- Check if the data was inserted:
  ```sql
  SELECT COUNT(*) FROM events;
  SELECT COUNT(*) FROM registrations;
  ```
- Verify that your application is correctly connected to Supabase

### 7. Authentication Issues

**Problem**: Unable to log in with created accounts.

**Solution**:
- Make sure the accounts were created successfully:
  ```sql
  SELECT * FROM auth.users WHERE email = 'admin@example.com';
  SELECT * FROM auth.users WHERE email = 'club@nitsilchar.ac.in';
  ```
- Verify that your application is using the correct Supabase URL and anon key
- Try resetting the password through the Supabase dashboard

## Advanced Troubleshooting

### Checking Supabase Logs

1. Go to your Supabase dashboard
2. Click on "Database" in the sidebar
3. Click on "Logs" in the submenu
4. Check for any errors related to your queries

### Manually Creating Users

If you're having trouble creating users with SQL, you can create them through the Supabase dashboard:

1. Go to "Authentication" in the sidebar
2. Click on "Users" tab
3. Click "Invite user" button
4. Enter the email and password
5. After creating the user, get their UUID from the users list
6. Manually insert the profile record:
   ```sql
   INSERT INTO admins (id, name) VALUES ('user-uuid-here', 'System Administrator');
   ```
   or
   ```sql
   INSERT INTO clubs (id, name, description)
   VALUES ('user-uuid-here', 'Computer Science Club', 'The official Computer Science club of NIT Silchar');
   ```

### Resetting Your Setup

If you want to start over, you can manually drop the tables and recreate them:

```sql
-- Drop all tables (in the correct order to respect foreign key constraints)
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS club_requests;
DROP TABLE IF EXISTS clubs;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS categories;
```

Then run the schema.sql script again to recreate the tables.
