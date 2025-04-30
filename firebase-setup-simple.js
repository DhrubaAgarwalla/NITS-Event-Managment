// Firebase Setup Script (Simple Version)
// Run this with: node firebase-setup-simple.js your-email@example.com your-password

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

// Your Firebase configuration (hardcoded from .env)
const firebaseConfig = {
  apiKey: "AIzaSyDpZtD_EDIEJLqdpvgU0UGSKGCzVB0f7Pw",
  authDomain: "nits-event.firebaseapp.com",
  projectId: "nits-event",
  storageBucket: "nits-event.firebasestorage.app",
  messagingSenderId: "323777820197",
  appId: "1:323777820197:web:c446df0f87553ea460f1cc",
  databaseURL: "https://nits-event-default-rtdb.firebaseio.com"
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
  console.error('node firebase-setup-simple.js your-email@example.com your-password');
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

    // Create a test entry
    await set(ref(database, 'test'), {
      message: 'Hello from Firebase setup script!',
      timestamp: new Date().toISOString()
    });
    console.log('Test entry created');

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

    const testSnapshot = await get(child(dbRef, 'test'));
    if (testSnapshot.exists()) {
      console.log('Test data verified ✓');
    } else {
      console.log('Test data not found!');
    }

  } catch (error) {
    console.error('Error initializing database:', error);
    console.error('Error details:', error.code, error.message);
  }
}

// Run the initialization
initializeDatabase();
