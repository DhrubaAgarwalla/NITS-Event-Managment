import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';
import readline from 'readline';

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
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials are missing. Please check your .env file.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt for input
const prompt = (question) => new Promise((resolve) => rl.question(question, resolve));

async function fixAdminAccount() {
  try {
    console.log('=== Fix Admin Account ===');
    
    // Get admin email
    const email = await prompt('Enter your admin email: ');
    
    console.log(`\nLooking up user with email: ${email}`);
    
    // Find user by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      throw userError;
    }
    
    const user = userData.users.find(u => u.email === email);
    
    if (!user) {
      console.log(`No user found with email: ${email}`);
      return;
    }
    
    console.log(`Found user: ${user.email} (ID: ${user.id})`);
    
    // Check if user is already in admins table
    const { data: adminData, error: adminCheckError } = await supabase
      .from('admins')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (adminCheckError && adminCheckError.code !== 'PGRST116') {
      throw adminCheckError;
    }
    
    if (adminData) {
      console.log('User is already in the admins table.');
      return;
    }
    
    console.log('User is not in the admins table. Adding now...');
    
    // Add user to admins table
    const name = await prompt('Enter admin name: ');
    
    const { data: newAdminData, error: insertError } = await supabase
      .from('admins')
      .insert([
        {
          id: user.id,
          name: name,
          created_at: new Date(),
          updated_at: new Date()
        }
      ])
      .select();
    
    if (insertError) {
      throw insertError;
    }
    
    console.log('Admin account fixed successfully!');
    console.log('You can now log in with your admin credentials and access the admin dashboard.');
    
  } catch (error) {
    console.error('Error fixing admin account:', error.message);
  } finally {
    rl.close();
  }
}

fixAdminAccount();
