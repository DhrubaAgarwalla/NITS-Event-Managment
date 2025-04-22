// Supabase Setup Script
// This script helps set up your Supabase project with the required schema and sample data

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

// Check if credentials are set
if (!supabaseUrl || !supabaseServiceKey) {
  console.error(`${colors.red}Error: Supabase credentials not found in .env file${colors.reset}`);
  console.log(`${colors.yellow}Please make sure you have the following variables in your .env file:${colors.reset}`);
  console.log(`${colors.cyan}VITE_SUPABASE_URL=your-supabase-url${colors.reset}`);
  console.log(`${colors.cyan}VITE_SUPABASE_SERVICE_KEY=your-supabase-service-key${colors.reset}`);
  process.exit(1);
}

// Initialize Supabase client with service key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Main function
async function main() {
  console.log(`${colors.magenta}=== Supabase Setup Script ===${colors.reset}\n`);

  try {
    // Step 1: Create database schema
    console.log(`${colors.blue}Step 1: Creating database schema...${colors.reset}`);

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    const { error: schemaError } = await supabase.rpc('exec_sql', { sql: schemaSQL });

    if (schemaError) {
      console.error(`${colors.red}Error creating schema:${colors.reset}`, schemaError.message);
      console.log(`${colors.yellow}You may need to run the schema.sql file manually in the Supabase SQL Editor.${colors.reset}`);
    } else {
      console.log(`${colors.green}Schema created successfully!${colors.reset}`);
    }

    // Step 2: Create admin user
    console.log(`\n${colors.blue}Step 2: Creating admin user...${colors.reset}`);

    // Check if admin user already exists
    const { data: existingAdmin, error: adminCheckError } = await supabase
      .from('admins')
      .select('*')
      .limit(1);

    if (adminCheckError) {
      console.error(`${colors.red}Error checking for existing admin:${colors.reset}`, adminCheckError.message);
    } else if (existingAdmin && existingAdmin.length > 0) {
      console.log(`${colors.yellow}Admin user already exists. Skipping admin creation.${colors.reset}`);
    } else {
      // Create admin user
      const adminEmail = 'admin@example.com';
      const adminPassword = 'admin123'; // You should change this in production

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
      });

      if (authError) {
        console.error(`${colors.red}Error creating admin user:${colors.reset}`, authError.message);
      } else {
        // Create admin profile
        const { error: profileError } = await supabase
          .from('admins')
          .insert([{ id: authData.user.id, name: 'System Administrator' }]);

        if (profileError) {
          console.error(`${colors.red}Error creating admin profile:${colors.reset}`, profileError.message);
        } else {
          console.log(`${colors.green}Admin user created successfully!${colors.reset}`);
          console.log(`${colors.cyan}Email:${colors.reset} ${adminEmail}`);
          console.log(`${colors.cyan}Password:${colors.reset} ${adminPassword}`);
        }
      }
    }

    // Step 3: No demo club accounts will be created
    console.log(`\n${colors.blue}Step 3: Skipping demo club creation...${colors.reset}`);
    console.log(`${colors.green}Club accounts should be created manually through the admin dashboard.${colors.reset}`);

    // No demo club creation code needed

    // Step 4: No sample data will be created
    console.log(`\n${colors.blue}Step 4: Skipping sample data creation...${colors.reset}`);
    console.log(`${colors.green}No sample data will be created automatically.${colors.reset}`);
    console.log(`${colors.green}All data should be created through the application interface.${colors.reset}`);

  } catch (error) {
    console.error(`${colors.red}Unexpected error:${colors.reset}`, error.message);
  }

  console.log(`\n${colors.magenta}=== Setup Complete ===${colors.reset}`);
}

// Run the main function
main();
