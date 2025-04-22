import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase credentials are missing. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createDemoUser() {
  try {
    console.log('Creating demo user...');
    
    // Create the demo user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'club@nitsilchar.ac.in',
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        name: 'Computer Science Club'
      }
    });
    
    if (authError) {
      console.error('Error creating auth user:', authError.message);
      return;
    }
    
    console.log('Demo user created successfully:', authUser.user);
    
    // Create the club profile
    const { data: clubProfile, error: clubError } = await supabase
      .from('clubs')
      .insert([{
        id: authUser.user.id,
        name: 'Computer Science Club',
        description: 'The official Computer Science club of NIT Silchar',
        contact_email: 'cs-club@nitsilchar.ac.in',
        contact_phone: '+91 1234567890',
        website: 'https://example.com/cs-club'
      }])
      .select();
    
    if (clubError) {
      console.error('Error creating club profile:', clubError.message);
      return;
    }
    
    console.log('Club profile created successfully:', clubProfile[0]);
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

createDemoUser();
