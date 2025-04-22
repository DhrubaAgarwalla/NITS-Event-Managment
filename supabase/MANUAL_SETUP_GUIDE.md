# Manual Supabase Setup Guide

This guide will help you set up Supabase manually using the SQL files provided in this directory.

## Prerequisites

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new Supabase project
3. Get your Supabase credentials (URL, anon key, service role key)

## Step 1: Set Up Environment Variables

1. Create a `.env` file in the root of your project (if it doesn't exist already)
2. Add the following variables:

```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_KEY=your-service-role-key
```

Replace the placeholders with your actual Supabase credentials.

## Step 2: Create Database Schema

1. Go to your Supabase dashboard
2. Click on "SQL Editor" in the sidebar
3. Click "New Query" to create a new SQL query
4. Copy and paste the contents of `schema.sql` into the editor
5. Click "Run" to execute the SQL code
6. This will create all the necessary tables, indexes, policies, and triggers

## Step 3: Set Up Row Level Security (RLS) Policies

1. Create another new query in the SQL Editor
2. Copy and paste the contents of `rls-policies.sql` into the editor
3. Click "Run" to execute the SQL code
4. This will set up the necessary security policies for your tables

## Step 4: Set Up Storage Bucket

You need to set up a storage bucket for event images:

1. Go to "Storage" in the Supabase dashboard sidebar
2. Click "Create a new bucket"
3. Name it "event-images"
4. Check "Public bucket" to make it publicly accessible
5. Set file size limit to 50MB
6. Set allowed MIME types to image/png, image/jpeg, image/gif, image/webp

## Step 5: Create Admin Account

After setting up the database schema, you need to create an admin account:

1. Create another new query in the SQL Editor
2. Copy and paste the contents of `create-admin-user.sql` into the editor
3. Before running, modify the email and password in the script to your preferred values
   (default is `admin@nitsilchar.ac.in` with password `AdminSecurePassword123`)
4. Click "Run" to execute the SQL code
5. This will create an admin user with the specified credentials

## Step 6: Start Your Application

Now that your Supabase project is set up, you can start your application:

```bash
npm run dev
```

You should be able to log in with the admin account you created in Step 5.

As an admin, you can then create club accounts through the admin dashboard.

## Database Schema Overview

The application uses the following tables:

- **clubs**: Club profiles linked to auth.users
- **admins**: Admin users linked to auth.users
- **club_requests**: Requests from clubs to create profiles
- **events**: Events created by clubs
- **registrations**: Event registrations
- **categories**: Event categories

## Row Level Security (RLS) Policies

The database uses Row Level Security to control access to data:

- Anyone can view clubs, events, and categories
- Clubs can only manage their own events and registrations
- Only admins can create club accounts and manage club requests
- Anyone can submit a club request or register for an event

## Storage

The application uses Supabase Storage for event images:

- Bucket: `event-images`
- Public access: Yes
- File size limit: 50MB
- Allowed MIME types: image/png, image/jpeg, image/gif, image/webp

## Troubleshooting

If you encounter any issues:

1. Check the browser console for any errors
2. Verify your Supabase credentials in the .env file
3. Check the Supabase dashboard for any errors in the SQL queries
4. Look at the Supabase logs in the dashboard under "Database" > "Logs"
5. Verify the tables were created by going to "Table Editor" in the Supabase dashboard
