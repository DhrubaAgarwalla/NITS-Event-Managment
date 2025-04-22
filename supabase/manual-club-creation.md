# Manual Club Account Creation Guide

This guide explains how to manually create club accounts for the NIT Silchar Event Manager application.

## Using the Admin Dashboard (Recommended)

The recommended way to create club accounts is through the admin dashboard in the application:

1. Log in to the application using your admin credentials.
2. Navigate to the Admin Dashboard.
3. Go to the "Create Club" tab.
4. Fill in the club details:
   - Email: The email address for the club's login
   - Password: A secure password for the club
   - Name: The name of the club
   - Description: A brief description of the club
   - Contact Email: The contact email for the club
   - Contact Phone: The contact phone number for the club
   - Website: The club's website (if any)
   - Logo URL: A URL to the club's logo image (if any)
5. Click "Create Club Account" to create the account.

## Approving Club Requests

Clubs can request accounts through the application:

1. Clubs submit requests through the "Request Club" page.
2. As an admin, you can view these requests in the "Club Requests" tab of the Admin Dashboard.
3. For each request, you can:
   - View the details of the request
   - Approve the request (which creates a club account)
   - Reject the request

When you approve a request, the system will:
1. Create a user account with the provided email
2. Generate a temporary password
3. Create a club profile linked to the user account
4. Display the temporary password for you to share with the club

## Using SQL (Advanced)

If you need to create a club account directly in the database:

```sql
DO $$
DECLARE
  club_id UUID := uuid_generate_v4();
BEGIN
  -- Create auth user
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token
  )
  VALUES (
    club_id,
    'club-email@example.com', -- Replace with the club's email
    crypt('SecurePassword123', gen_salt('bf')), -- Replace with a secure password
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Club Name"}', -- Replace with the club's name
    NOW(),
    NOW(),
    ''
  );

  -- Create club profile
  INSERT INTO clubs (
    id,
    name,
    description,
    contact_email,
    contact_phone,
    website
  )
  VALUES (
    club_id,
    'Club Name', -- Replace with the club's name
    'Club description', -- Replace with the club's description
    'contact@example.com', -- Replace with the contact email
    '+91 1234567890', -- Replace with the contact phone
    'https://example.com' -- Replace with the website
  );

  RAISE NOTICE 'Club account created with ID: %', club_id;
END $$;
```

## Important Notes

1. Always use secure passwords for club accounts.
2. Share the login credentials with the club representatives securely.
3. Encourage clubs to change their passwords after the first login.
4. Keep track of which clubs have accounts to avoid duplicates.
