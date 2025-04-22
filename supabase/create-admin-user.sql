-- Create admin user
-- Replace the email and password with your own values
DO $$
DECLARE
  admin_id UUID := uuid_generate_v4(); -- Generate UUID explicitly
BEGIN
  -- Create auth user
  INSERT INTO auth.users (
    id, -- Include id column
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
    admin_id, -- Use the generated UUID
    'admin@nitsilchar.ac.in', -- Replace with your admin email
    crypt('AdminSecurePassword123', gen_salt('bf')), -- Replace with a secure password
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "NIT Silchar Administrator"}',
    NOW(),
    NOW(),
    ''
  );

  -- Create admin profile
  INSERT INTO admins (id, name)
  VALUES (admin_id, 'NIT Silchar Administrator');

  RAISE NOTICE 'Admin user created with ID: %', admin_id;
END $$;
