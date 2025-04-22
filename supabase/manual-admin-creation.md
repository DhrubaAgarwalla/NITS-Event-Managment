# Manual Admin Account Creation Guide

This guide explains how to manually create an admin account for the NIT Silchar Event Manager application.

## Option 1: Using the SQL Script

1. Run the `create-admin-user.sql` script in your Supabase SQL Editor.
2. Before running, modify the email and password in the script to your preferred values.
3. The script will create an admin user with the specified credentials.

## Option 2: Using the Supabase Dashboard

If you prefer to create the admin account manually through the Supabase dashboard:

1. Go to the Supabase dashboard and select your project.
2. Navigate to "Authentication" > "Users".
3. Click "Add User" and fill in the email and password.
4. Note the UUID of the created user.
5. Go to "Table Editor" and select the `admins` table.
6. Click "Insert Row" and add a new record with:
   - `id`: The UUID of the user you just created
   - `name`: The name of the administrator (e.g., "NIT Silchar Administrator")
   - The `created_at` and `updated_at` fields will be filled automatically

## Option 3: Using the JavaScript API

You can also create an admin account programmatically:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseServiceKey = 'YOUR_SUPABASE_SERVICE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminAccount() {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@nitsilchar.ac.in',
      password: 'SecureAdminPassword123',
      email_confirm: true
    });
    
    if (authError) throw authError;
    
    // Create admin profile
    const { data, error } = await supabase
      .from('admins')
      .insert([{ 
        id: authData.user.id,
        name: 'NIT Silchar Administrator'
      }]);
    
    if (error) throw error;
    
    console.log('Admin account created successfully');
  } catch (err) {
    console.error('Error creating admin account:', err);
  }
}

createAdminAccount();
```

## Important Notes

1. Make sure to use a strong, secure password for the admin account.
2. Keep the admin credentials secure and do not share them publicly.
3. The admin account has full access to create club accounts and manage the application.
4. After creating the admin account, you can log in to the application and use the admin dashboard to create club accounts.
