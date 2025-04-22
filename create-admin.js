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

async function createAdminAccount() {
  try {
    console.log('=== Create Admin Account ===');
    
    // Get admin email and password
    const email = await prompt('Enter admin email: ');
    const password = await prompt('Enter admin password: ');
    const name = await prompt('Enter admin name: ');
    
    console.log('\nCreating admin account...');
    
    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (authError) {
      throw authError;
    }
    
    console.log('User created successfully!');
    console.log('User ID:', authData.user.id);
    
    // Create admin profile
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .insert([
        {
          id: authData.user.id,
          name: name,
          created_at: new Date(),
          updated_at: new Date()
        }
      ])
      .select();
    
    if (adminError) {
      throw adminError;
    }
    
    console.log('Admin profile created successfully!');
    console.log('Admin ID:', adminData[0].id);
    console.log('Admin Name:', adminData[0].name);
    
    console.log('\nAdmin account creation complete!');
    console.log('You can now log in with the following credentials:');
    console.log('Email:', email);
    console.log('Password:', password);
    
  } catch (error) {
    console.error('Error creating admin account:', error.message);
  } finally {
    rl.close();
  }
}

createAdminAccount();
