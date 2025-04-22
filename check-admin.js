import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, '.env') });

// If .env file is not found in the current directory, try parent directory
if (!process.env.VITE_SUPABASE_URL) {
  const parentEnvPath = resolve(__dirname, '..', '.env');
  if (fs.existsSync(parentEnvPath)) {
    dotenv.config({ path: parentEnvPath });
  }
}

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Log the environment variables for debugging
console.log('Environment variables:');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✓ Found' : '✗ Not found');
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✓ Found' : '✗ Not found');
console.log('VITE_SUPABASE_SERVICE_ROLE_KEY:', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? '✓ Found' : '✗ Not found');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase credentials are missing. Please check your .env file.');
  process.exit(1);
}

// Create the Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdmin() {
  try {
    console.log('Checking for admin accounts...');

    // Check for admin accounts in the admins table
    const { data: admins, error: adminsError } = await supabase
      .from('admins')
      .select('*');

    if (adminsError) {
      console.error('Error checking admins table:', adminsError.message);
    } else {
      console.log(`Found ${admins.length} admin accounts:`);

      for (const admin of admins) {
        // Get the user details from auth.users
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(admin.id);

        if (userError) {
          console.error(`Error getting user details for admin ${admin.id}:`, userError.message);
        } else if (userData && userData.user) {
          console.log(`- Admin: ${userData.user.email} (${admin.name || 'No name'})`);
        } else {
          console.log(`- Admin ID: ${admin.id} (No user found in auth.users)`);
        }
      }
    }

    // Check for club accounts
    const { data: clubs, error: clubsError } = await supabase
      .from('clubs')
      .select('*');

    if (clubsError) {
      console.error('Error checking clubs table:', clubsError.message);
    } else {
      console.log(`\nFound ${clubs.length} club accounts.`);
    }

  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

checkAdmin();
