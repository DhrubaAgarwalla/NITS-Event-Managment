# Supabase Setup Guide

This guide will help you set up Supabase for the Event Manager application.

## Prerequisites

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new Supabase project
3. Install Node.js and npm on your machine

## Step 1: Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Click on the "Settings" icon in the sidebar
3. Click on "API" in the settings menu
4. You'll need two values:
   - **Project URL**: This is your `VITE_SUPABASE_URL`
   - **anon/public** key: This is your `VITE_SUPABASE_ANON_KEY`
   - **service_role** key: This is your `VITE_SUPABASE_SERVICE_KEY` (needed for admin operations)

## Step 2: Set Up Environment Variables

1. Create a `.env` file in the root of your project (if it doesn't exist already)
2. Add the following variables:

```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_KEY=your-service-role-key
```

Replace the placeholders with your actual Supabase credentials.

## Step 3: Run the Setup Script

We've created a script to set up your Supabase project with the required schema and sample data.

```bash
npm run setup:supabase
```

This script will:
1. Create the database schema (tables, relationships, etc.)
2. Create an admin user
3. Create a demo club account
4. Insert sample data (events, registrations, etc.)

If the script fails, you can manually run the SQL files in the Supabase SQL Editor:
1. Go to your Supabase dashboard
2. Click on "SQL Editor" in the sidebar
3. Create a new query
4. Copy and paste the contents of `supabase/schema.sql`
5. Run the query
6. Repeat for `supabase/sample-data.sql`

## Step 4: Test the Setup

After running the setup script, you should have:

1. **Admin Account**:
   - Email: admin@example.com
   - Password: admin123

2. **Demo Club Account**:
   - Email: demo@example.com
   - Password: password123

You can use these accounts to test the application.

## Database Schema

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

1. Check that your environment variables are set correctly
2. Make sure your Supabase project is on the latest version
3. Try running the SQL files manually in the SQL Editor
4. Check the Supabase logs for any errors

For more help, refer to the [Supabase documentation](https://supabase.com/docs).
