// Firebase Setup Script
// Run this with: node firebase-setup.js your-email@example.com your-password

import { initializeApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  get,
  child
} from 'firebase/database';
import {
  getAuth,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { config } from 'dotenv';

// Load environment variables
config();

// Your Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// Admin email and password (use the account you created)
const adminEmail = process.argv[2]; // Pass as first argument
const adminPassword = process.argv[3]; // Pass as second argument

if (!adminEmail || !adminPassword) {
  console.error('Please provide admin email and password as arguments:');
  console.error('node firebase-setup.js your-email@example.com your-password');
  process.exit(1);
}

// Function to initialize database structure
async function initializeDatabase() {
  try {
    // Sign in with admin credentials
    console.log(`Signing in as ${adminEmail}...`);
    const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    const user = userCredential.user;
    console.log(`Signed in successfully as ${user.email} (${user.uid})`);

    // Create user roles
    console.log('Setting up user roles...');
    await set(ref(database, `users/${user.uid}`), {
      email: user.email,
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    console.log('Admin user role created');

    // Create test data
    console.log('Creating test data...');

    // Test event
    await set(ref(database, 'events/test-event-1'), {
      title: 'Test Event 1',
      description: 'This is a test event created by the setup script',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      location: 'NIT Silchar',
      is_featured: true,
      status: 'active',
      created_by: user.uid,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    console.log('Test event created');

    // Test club
    await set(ref(database, 'clubs/test-club-1'), {
      name: 'Test Club',
      description: 'This is a test club created by the setup script',
      logo_url: 'https://via.placeholder.com/150',
      email: 'testclub@example.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    console.log('Test club created');

    console.log('Database initialization completed successfully!');

    // Verify data was written
    console.log('Verifying data...');
    const dbRef = ref(database);

    const eventSnapshot = await get(child(dbRef, 'events/test-event-1'));
    if (eventSnapshot.exists()) {
      console.log('Event data verified ✓');
    } else {
      console.log('Event data not found!');
    }

    const clubSnapshot = await get(child(dbRef, 'clubs/test-club-1'));
    if (clubSnapshot.exists()) {
      console.log('Club data verified ✓');
    } else {
      console.log('Club data not found!');
    }

    const userSnapshot = await get(child(dbRef, `users/${user.uid}`));
    if (userSnapshot.exists()) {
      console.log('User data verified ✓');
    } else {
      console.log('User data not found!');
    }

  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Run the initialization
initializeDatabase();
